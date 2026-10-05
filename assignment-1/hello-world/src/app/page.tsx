import { CaptionStudio } from "./caption-studio";
import { getDailyPrompt } from "@/lib/daily-prompt";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const dailyPrompt = getDailyPrompt();
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return <CaptionStudio loggedIn={false} dailyPrompt={dailyPrompt} items={[]} feedError="Connect Supabase to load the caption exchange." />;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, user_id, photo_path, prompt, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: voteCounts } = await supabase.rpc("get_caption_vote_counts");
  const { data: myVotes } = user
    ? await supabase.from("caption_votes").select("generation_id, value").eq("user_id", user.id)
    : { data: [] };
  const countsById = new Map((voteCounts ?? []).map((count) => [count.generation_id, count]));
  const votesById = new Map((myVotes ?? []).map((vote) => [vote.generation_id, vote.value]));
  const items = (generations ?? []).map((generation) => {
    const { data: photo } = supabase.storage.from("generation-photos").getPublicUrl(generation.photo_path);
    const counts = countsById.get(generation.id);
    return {
      ...generation,
      photo_url: photo.publicUrl,
      upvotes: Number(counts?.upvotes ?? 0),
      downvotes: Number(counts?.downvotes ?? 0),
      my_vote: (votesById.get(generation.id) ?? null) as -1 | 1 | null,
    };
  });

  return (
    <CaptionStudio
      loggedIn={Boolean(user)}
      dailyPrompt={dailyPrompt}
      items={items}
      feedError={error ? "The caption exchange is still being set up. Please check back shortly." : null}
    />
  );
}
