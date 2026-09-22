import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hello-world-title">
        <p className={styles.kicker}>Fall 2026 Design for Gen AI</p>
        <h1 id="hello-world-title">Hello World</h1>
        <p className={styles.copy}>
          Assignment 2 adds a Supabase-powered list page to the original
          Hello World app.
        </p>
        <a className={styles.status} href="/users">
          View users list
        </a>
      </section>
    </main>
  );
}
