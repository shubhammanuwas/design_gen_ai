"use client";

import { useState, type ChangeEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./profile.module.css";

type AvatarUploaderProps = { avatarUrl: string | null };

export function AvatarUploader({ avatarUrl }: AvatarUploaderProps) {
  const [imageUrl, setImageUrl] = useState(avatarUrl);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }

    setPending(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      setPending(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Sign in again to upload a photo.");
      setPending(false);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setMessage(uploadError.message);
      setPending(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) setMessage(updateError.message);
    else {
      setImageUrl(publicUrl);
      setMessage("Photo updated.");
    }
    setPending(false);
  }

  return (
    <div className={styles.avatarBlock}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.avatar} src={imageUrl} alt="Your profile" />
      ) : <div className={styles.avatarPlaceholder} aria-hidden="true">+</div>}
      <label className={styles.upload}>
        <span>{pending ? "Uploading..." : "Upload photo"}</span>
        <input type="file" accept="image/*" onChange={uploadAvatar} disabled={pending} />
      </label>
      <p className={styles.help}>Image files, up to 5 MB</p>
      {message ? <p className={styles.uploadMessage} role="status">{message}</p> : null}
    </div>
  );
}