"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { signOut } from "@/app/actions/auth";
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.currentTarget.files?.[0];
    setPhotoPreview(photo ? URL.createObjectURL(photo) : null);
  }

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
    setPhotoPreview(null);
    setMessage("Three captions have entered the Columbia comedy lab.");
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

    const nextVote = result.my_vote === 1 || result.my_vote === -1 ? result.my_vote : null;
    setItems((current) => current.map((entry) => {
      if (entry.id !== item.id) return entry;
      const upvotes = entry.upvotes - Number(entry.my_vote === 1) + Number(nextVote === 1);
      const downvotes = entry.downvotes - Number(entry.my_vote === -1) + Number(nextVote === -1);
      return { ...entry, upvotes, downvotes, my_vote: nextVote };
    }));
    setPendingVote(null);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.wordmark} href="/">The Punchline <span>/ Columbia</span></Link>
        <nav aria-label="Account navigation">
          {loggedIn ? (
            <>
              <a href="/profile">Edit profile</a>
              <form action={signOut}>
                <button className={styles.signOut} type="submit">Sign out</button>
              </form>
            </>
          ) : <a className={styles.signIn} href="/login">Sign in</a>}
        </nav>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>Columbia&apos;s very unofficial comedy department</p>
        <h1>Columbia, <em>with a punchline.</em></h1>
        <p className={styles.lede}>Bring a photo. Our AI writes three Columbia-themed jokes. You vote for the one that deserves to stay in the group chat.</p>
      </section>

      <section className={styles.studio} aria-labelledby="studio-title">
        <div className={styles.studioHeading}>
          <div><p className={styles.eyebrow}>Today&apos;s highly unofficial assignment</p><h2 id="studio-title">{dailyPrompt}</h2></div>
          <span className={styles.dayMark}>NO EXTRA CREDIT</span>
        </div>
        {loggedIn ? (
          <form ref={formRef} className={styles.form} onSubmit={createCaptions}>
            <label className={`${styles.photoInput} ${photoPreview ? styles.photoSelected : ""}`}>
              {photoPreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.photoPreview} src={photoPreview} alt="Selected photo preview" />
                  <span><strong>Change photo</strong><small>JPEG, PNG, or WebP · up to 5 MB</small></span>
                </>
              ) : (
                <>
                  <span className={styles.photoIcon} aria-hidden="true">+</span>
                  <span><strong>Add a photo</strong><small>JPEG, PNG, or WebP · up to 5 MB</small></span>
                </>
              )}
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} required />
            </label>
            <label className={styles.promptLabel}>
              Give the comedy department some context
              <textarea name="prompt" maxLength={500} placeholder="What should the AI know? Keep it Columbia-related; the punchline is its problem." required rows={2} />
            </label>
            <div className={styles.submitRow}>
              <span>Three Columbia jokes, one photo. No one gets graded.</span>
              <button type="submit" disabled={pending}>{pending ? "Consulting the comedy department..." : "Make me laugh"}<span aria-hidden="true">↗</span></button>
            </div>
          </form>
        ) : (
          <div className={styles.gate}>
            <p>The comedy department is accepting submissions. Sign in with your Columbia account to add a photo, generate captions, and vote.</p>
            <a href="/login">Get your laugh pass <span aria-hidden="true">↗</span></a>
          </div>
        )}
        {message ? <p className={styles.message} role="status">{message}</p> : null}
      </section>

      <section className={styles.feed} aria-labelledby="feed-title">
        <div className={styles.feedHeading}>
          <div><p className={styles.eyebrow}>Peer-reviewed by absolutely nobody</p><h2 id="feed-title">The Columbia laugh feed</h2></div>
          <p>{items.length} {items.length === 1 ? "attempt at comedy" : "attempts at comedy"}</p>
        </div>
        {feedError ? <p className={styles.feedNotice}>{feedError}</p> : null}
        {!feedError && items.length === 0 ? (
          <div className={styles.empty}><span>01</span><p>The laugh track is waiting. Add a photo and let Columbia comedy happen.</p></div>
        ) : null}
        <div className={styles.grid}>
          {items.map((item, index) => (
            <article className={styles.caption} key={item.id}>
              <div className={styles.imageFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.photo_url} alt="A community member's photo" />
                <span className={styles.imageIndex}>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className={styles.captionBody}>
                <p className={styles.captionPrompt}>{item.prompt}</p>
                <blockquote>{item.caption}</blockquote>
                <div className={styles.voteBar}>
                  <span>AI joke / human vote</span>
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
      <footer className={styles.footer}><span>The Punchline / Columbia</span><span>For entertainment. Not for course credit.</span></footer>
    </main>
  );
}
