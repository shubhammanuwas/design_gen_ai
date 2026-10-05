import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to generate captions." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "Caption generation is not configured yet." }, { status: 503 });

  const formData = await request.formData();
  const photo = formData.get("photo");
  const prompt = String(formData.get("prompt") ?? "").trim();

  if (!(photo instanceof File) || !ALLOWED_TYPES.has(photo.type)) {
    return Response.json({ error: "Choose a JPEG, PNG, or WebP photo." }, { status: 400 });
  }
  if (photo.size === 0 || photo.size > MAX_PHOTO_SIZE) {
    return Response.json({ error: "Choose a photo smaller than 5 MB." }, { status: 400 });
  }
  if (!prompt || prompt.length > 500) {
    return Response.json({ error: "Add a prompt between 1 and 500 characters." }, { status: 400 });
  }

  const imageData = Buffer.from(await photo.arrayBuffer()).toString("base64");
  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Write exactly three short, distinct, witty but kind social captions for the user's NYC photo and prompt. Return a JSON object with a captions array of three strings. Do not claim facts that are not visible in the image.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Prompt: ${prompt}` },
            { type: "image_url", image_url: { url: `data:${photo.type};base64,${imageData}` } },
          ],
        },
      ],
    }),
  });

  if (!openAiResponse.ok) {
    const providerError = await getOpenAiError(openAiResponse);
    console.error("OpenAI caption request failed", {
      status: openAiResponse.status,
      code: providerError.code,
      type: providerError.type,
      message: providerError.message,
    });
    return Response.json({ error: explainOpenAiError(openAiResponse.status, providerError) }, { status: 502 });
  }

  const openAiData: unknown = await openAiResponse.json();
  const content = getMessageContent(openAiData);
  if (!content) return Response.json({ error: "The caption service returned an unexpected response." }, { status: 502 });

  let captions: string[];
  try {
    const parsed: unknown = JSON.parse(content);
    captions = getCaptions(parsed);
  } catch {
    return Response.json({ error: "The caption service returned captions in an unexpected format." }, { status: 502 });
  }

  if (captions.length !== 3 || captions.some((caption) => !caption || caption.length > 500)) {
    return Response.json({ error: "The caption service returned invalid captions." }, { status: 502 });
  }

  const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("generation-photos")
    .upload(photoPath, photo, { contentType: photo.type, upsert: false });

  if (uploadError) return Response.json({ error: "The photo could not be saved." }, { status: 500 });

  const { data: generations, error: insertError } = await supabase
    .from("generations")
    .insert(captions.map((caption) => ({ user_id: user.id, photo_path: photoPath, prompt, caption })))
    .select("id, user_id, photo_path, prompt, caption, created_at");

  if (insertError) {
    await supabase.storage.from("generation-photos").remove([photoPath]);
    return Response.json({ error: "Captions were generated but could not be saved." }, { status: 500 });
  }

  return Response.json({ generations }, { status: 201 });
}

function getMessageContent(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const choices = (value as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

function getCaptions(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const captions = (value as { captions?: unknown }).captions;
  if (!Array.isArray(captions)) return [];
  return captions.filter((caption): caption is string => typeof caption === "string").map((caption) => caption.trim());
}

async function getOpenAiError(response: Response) {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return { code: "", type: "", message: "" };
    const error = (body as { error?: unknown }).error;
    if (!error || typeof error !== "object") return { code: "", type: "", message: "" };
    const details = error as { code?: unknown; type?: unknown; message?: unknown };
    return {
      code: typeof details.code === "string" ? details.code : "",
      type: typeof details.type === "string" ? details.type : "",
      message: typeof details.message === "string" ? details.message : "",
    };
  } catch {
    return { code: "", type: "", message: "" };
  }
}

function explainOpenAiError(status: number, details: { code: string; type: string; message: string }) {
  const code = `${details.code} ${details.type}`.toLowerCase();
  if (status === 401 || code.includes("invalid_api_key")) {
    return "OpenAI rejected the configured API key. Check that OPENAI_API_KEY is a valid OpenAI API key, then restart the dev server.";
  }
  if (status === 429 || code.includes("quota") || code.includes("rate_limit")) {
    return "OpenAI could not accept the request because of a quota or rate limit. Check your OpenAI project billing and usage limits, then try again.";
  }
  if (status === 403) {
    return "This OpenAI project does not have permission to use the caption model. Check the key's project and model access.";
  }
  if (status === 404) {
    return "The caption model is unavailable to this OpenAI project. Check model access and try again.";
  }
  return `OpenAI could not generate captions (HTTP ${status}). Check the dev server log for its error code, then try again.`;
}
