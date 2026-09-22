import Link from "next/link";
import {
  UserRow,
  createSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase";
import styles from "./users.module.css";

export const dynamic = "force-dynamic";

async function getUsers() {
  const supabase = createSupabaseClient();

  if (!supabase) {
    return {
      data: [] as UserRow[],
      error:
        "Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to load rows.",
    };
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  return {
    data: (data ?? []) as UserRow[],
    error: error?.message,
  };
}

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function UsersPage() {
  const { data: users, error } = await getUsers();

  return (
    <main className={styles.page}>
      <section className={styles.header} aria-labelledby="users-title">
        <Link href="/" className={styles.backLink}>
          Back home
        </Link>
        <p className={styles.kicker}>Assignment 2</p>
        <h1 id="users-title">Supabase Users</h1>
        <p>
          Rows from the <code>users</code> table, fetched with environment-based
          Supabase configuration.
        </p>
      </section>

      {error ? (
        <section className={styles.notice} aria-live="polite">
          <h2>{hasSupabaseConfig() ? "Could not load rows" : "Setup needed"}</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!error && users.length > 0 ? (
        <section className={styles.tableWrap} aria-label="Users list">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <time dateTime={user.created_at}>
                      {formatTimestamp(user.created_at)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {!error && users.length === 0 ? (
        <section className={styles.notice} aria-live="polite">
          <h2>No rows yet</h2>
          <p>Add rows to the Supabase table and refresh this page.</p>
        </section>
      ) : null}
    </main>
  );
}
