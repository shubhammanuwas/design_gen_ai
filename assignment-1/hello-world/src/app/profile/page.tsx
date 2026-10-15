import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AvatarUploader } from "./avatar-uploader";
import { saveProfile } from "./actions";
import styles from "./profile.module.css";

type ProfilePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return <main className={styles.page}><p>Configure Supabase to edit your profile.</p></main>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const params = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.back} href="/">Back to captions</Link>
        <header className={styles.header}>
          <p className={styles.kicker}>Your account</p>
          <h1>Profile</h1>
          <p>Keep your account details current.</p>
        </header>

        {params.error ? <p className={styles.error} role="alert">{params.error === "names" ? "Enter both your first and last name." : "We could not save your profile. Please try again."}</p> : null}
        {error ? <p className={styles.error} role="alert">Profile could not be loaded: {error.message}</p> : null}

        <section className={styles.profile} aria-label="Profile details">
          <AvatarUploader avatarUrl={profile?.avatar_url ?? null} />
          <form action={saveProfile} className={styles.form}>
            <label>
              First name
              <input name="first_name" autoComplete="given-name" required defaultValue={profile?.first_name ?? ""} />
            </label>
            <label>
              Last name
              <input name="last_name" autoComplete="family-name" required defaultValue={profile?.last_name ?? ""} />
            </label>
            <label>
              Email
              <input type="email" value={user.email ?? ""} readOnly />
            </label>
            <button className={styles.save} type="submit">Save profile</button>
          </form>
        </section>
      </div>
    </main>
  );
}