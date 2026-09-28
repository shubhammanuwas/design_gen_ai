import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "./sign-in-button";
import styles from "./login.module.css";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/members");
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <Link className={styles.back} href="/">Back home</Link>
        <p className={styles.kicker}>Member access</p>
        <h1 id="login-title">Sign in to continue.</h1>
        <p className={styles.copy}>Use your Google account to open your private space and manage your profile.</p>
        <GoogleSignInButton />
        <p className={styles.note}>Your profile is only visible to you.</p>
      </section>
    </main>
  );
}