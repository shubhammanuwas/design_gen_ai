"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { GenerationRow } from "@/lib/supabase/database";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./page.module.css";

type FeedItem = GenerationRow & {
  photo_url: string;
  upvotes: number;
  downvotes: number;
  my_vote: -1 | 1 | null;
};

type CaptionStudioProps = {
  loggedIn: boolean;
  dailyPrompt: string;
  items: FeedItem[];
  feedError: string | null;
};

export function CaptionStudio({ loggedIn, dailyPrompt, items: initialItems, feedError }: CaptionStudioProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [items, setItems] = useState(initialItems);
  const [pending, setPending] = useState(false);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function createCaptions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setPending(true);
    setMessage("");
    const response = await fetch("/api/generations", { method: "POST", body: new FormData(event.currentTarget) });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Generation failed. Please try again.");
      setPending(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const photoUrl = supabase?.storage.from("generation-photos").getPublicUrl(result.generations[0].photo_path).data.publicUrl;
    const createdItems = (result.generations as GenerationRow[]).map((generation) => ({
      ...generation,
      photo_url: photoUrl ?? "",
      upvotes: 0,
      downvotes: 0,
      my_vote: null,
    }));
    setItems((current) => [...createdItems, ...current]);
    formRef.current?.reset();
    setMessage("Three captions added to the exchange.");
    setPending(false);
    router.refresh();
  }

  async function vote(item: FeedItem, value: -1 | 1) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setPendingVote(item.id);
    setMessage("");
    const response = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generation_id: item.id, value }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Your vote could not be saved.");
      setPendingVote(null);
      return;
    }

    setItems((current) => current.map((entry) => {
      if (entry.id !== item.id) return entry;
      const upvotes = entry.upvotes - Number(entry.my_vote === 1) + Number(value === 1);
      const downvotes = entry.downvotes - Number(entry.my_vote === -1) + Number(value === -1);
      return { ...entry, upvotes, downvotes, my_vote: value };
    }));
    setPendingVote(null);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.wordmark} href="/">Fieldnotes <span>/ NYC</span></Link>
        <nav aria-label="Account navigation">
          {loggedIn ? <><a href="/profile">Profile</a><a href="/members">Members</a></> : <a className={styles.signIn} href="/login">Sign in</a>}
        </nav>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>A daily caption exchange</p>
        <h1>The city, <em>in your words.</em></h1>
        <p className={styles.lede}>A photo from your day. Three AI-written takes. The Columbia community picks the one that gets it.</p>
      </section>

      <section className={styles.studio} aria-labelledby="studio-title">
        <div className={styles.studioHeading}>
          <div><p className={styles.eyebrow}>Today&apos;s prompt</p><h2 id="studio-title">{dailyPrompt}</h2></div>
          <span className={styles.dayMark}>TODAY / NYC</span>
        </div>
        {loggedIn ? (
          <form ref={formRef} className={styles.form} onSubmit={createCaptions}>
            <label className={styles.photoInput}>
              <span className={styles.photoIcon} aria-hidden="true">+</span>
              <span><strong>Add a city photo</strong><small>JPEG, PNG, or WebP · up to 5 MB</small></span>
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required />
            </label>
            <label className={styles.promptLabel}>
              Give the AI a little context
              <textarea name="prompt" maxLength={500} defaultValue={dailyPrompt} required rows={2} />
            </label>
            <div className={styles.submitRow}>
              <span>Three captions, one photo. Your prompt is saved with them.</span>
              <button type="submit" disabled={pending}>{pending ? "Writing captions..." : "Generate captions"}<span aria-hidden="true">↗</span></button>
            </div>
          </form>
        ) : (
          <div className={styles.gate}>
            <p>Sign in with your Columbia account to add a photo, generate captions, and vote.</p>
            <a href="/login">Sign in to join <span aria-hidden="true">↗</span></a>
          </div>
        )}
        {message ? <p className={styles.message} role="status">{message}</p> : null}
      </section>

      <section className={styles.feed} aria-labelledby="feed-title">
        <div className={styles.feedHeading}>
          <div><p className={styles.eyebrow}>From around the city</p><h2 id="feed-title">The caption exchange</h2></div>
          <p>{items.length} {items.length === 1 ? "caption" : "captions"}</p>
        </div>
        {feedError ? <p className={styles.feedNotice}>{feedError}</p> : null}
        {!feedError && items.length === 0 ? (
          <div className={styles.empty}><span>01</span><p>No captions yet. Start the exchange with a photo from your day.</p></div>
        ) : null}
        <div className={styles.grid}>
          {items.map((item, index) => (
            <article className={styles.caption} key={item.id}>
              <div className={styles.imageFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.photo_url} alt="A community member's NYC photo" />
                <span className={styles.imageIndex}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className={styles.captionBody}>
                <p className={styles.captionPrompt}>{item.prompt}</p>
                <blockquote>{item.caption}</blockquote>
                <div className={styles.voteBar}>
                  <span>AI caption</span>
                  <div className={styles.voteActions}>
                    <button type="button" aria-label={`Upvote caption, ${item.upvotes} votes`} aria-pressed={item.my_vote === 1} disabled={pendingVote === item.id} onClick={() => vote(item, 1)}>
                      <span aria-hidden="true">↑</span> {item.upvotes}
                    </button>
                    <button type="button" aria-label={`Downvote caption, ${item.downvotes} votes`} aria-pressed={item.my_vote === -1} disabled={pendingVote === item.id} onClick={() => vote(item, -1)}>
                      <span aria-hidden="true">↓</span> {item.downvotes}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className={styles.footer}><span>Fieldnotes / NYC</span><span>Made from the everyday.</span></footer>
    </main>
  );
}
