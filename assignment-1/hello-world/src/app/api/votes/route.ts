import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to vote." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid vote request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid vote request." }, { status: 400 });
  }
  const { generation_id: generationId, value } = body as { generation_id?: unknown; value?: unknown };
  if (typeof generationId !== "string" || !/^[0-9a-f-]{36}$/i.test(generationId) || (value !== 1 && value !== -1)) {
    return Response.json({ error: "Choose an upvote or downvote for a caption." }, { status: 400 });
  }

  const { error } = await supabase
    .from("caption_votes")
    .upsert(
      { generation_id: generationId, user_id: user.id, value },
      { onConflict: "generation_id,user_id" },
    );

  if (error) return Response.json({ error: "Your vote could not be saved." }, { status: 400 });
  return Response.json({ success: true });
}
