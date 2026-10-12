import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./members.module.css";

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.first_name?.trim() || !profile.last_name?.trim()) redirect("/profile?complete=1");

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>Fieldnotes / Members</Link>
        <div className={styles.account}>
          <Link href="/profile" className={styles.profileLink}>Profile</Link>
          <form action={signOut}><button type="submit" className={styles.signOut}>Sign out</button></form>
        </div>
      </header>
      <nav className={styles.studioNav} aria-label="Caption studio">
        <span>Caption studio</span>
        <div>
          <Link href="/#studio-title">Create captions <span aria-hidden="true">↗</span></Link>
          <Link href="/#feed-title">Rate captions <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
      <section className={styles.content}>
        <p className={styles.kicker}>Private area</p>
        <h1>Good to see you,<br />{profile.first_name}.</h1>
        <p className={styles.copy}>You are signed in as <strong>{user.email}</strong>. This route checks your Supabase session on the server before showing member content.</p>
        <Link href="/#studio-title" className={styles.captionsButton}>Go to captions <span aria-hidden="true">↗</span></Link>
        <div className={styles.rule}><span>01</span><p>Your gated route is working.</p></div>
      </section>
    </main>
  );
}