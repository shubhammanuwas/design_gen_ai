"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./login.module.css";

export function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn() {
    setError(null);
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Add the public Supabase URL and publishable key to the app environment.");
      setPending(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (authError) {
      setError(authError.message);
      setPending(false);
    }
  }

  return (
    <div className={styles.actionGroup}>
      <button className={styles.googleButton} type="button" onClick={signIn} disabled={pending}>
        <span aria-hidden="true" className={styles.googleMark}>G</span>
        {pending ? "Connecting to Google..." : "Continue with Google"}
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}