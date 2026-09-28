# Design Gen AI Assignments

Assignments for Fall 2026 Design for Gen AI.

This is a [Next.js](https://nextjs.org) app designed to deploy on Vercel.

## Assignment 3: Auth and Profiles

This update adds Google OAuth sign-in, user profiles, avatar uploads, and the
protected `/members` route. Profile pictures live in Supabase Storage; only the
image URL is saved in the `profiles` table.

### Supabase setup

1. In Supabase SQL Editor, run [`supabase/assignment-3.sql`](supabase/assignment-3.sql).
	It creates `profiles`, inserts profile rows when new `auth.users` rows are
	created, adds per-user profile/storage policies, and creates the public
	`avatars` Storage bucket.
2. In Supabase Authentication > Providers, enable Google and enter the OAuth
	Client ID and Client Secret from your Google Cloud OAuth client.
3. In Supabase Authentication > URL Configuration, set the Site URL to your
	deployed app URL. Add both `http://localhost:3000/auth/callback` and your
	deployed app's `/auth/callback` URL to the allowed Redirect URLs.
4. In Google Cloud Console, create an OAuth 2.0 Client ID for a Web application.
	Add your local and deployed app origins as Authorized JavaScript origins.
	Add the Supabase Auth callback URL shown in Supabase's Google provider setup
	as the Authorized redirect URI. Google redirects to Supabase; Supabase then
	redirects back to the app's `/auth/callback`.

### App configuration

Set these locally in `.env.local` and in Vercel Project Settings > Environment
Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The callback route exchanges the OAuth code at `/auth/callback` without adding
custom query parameters to the redirect URI. In Vercel, turn off Deployment
Protection if the instructor needs to test the deployment in an incognito
window. After deploying, submit the URL for the specific deployment/commit.

### Routes

- `/login` starts Google sign-in.
- `/auth/callback` completes the session exchange and checks required names.
- `/profile` lets the signed-in user add or edit names and upload an avatar.
- `/members` is the protected route; both the request proxy and server page
  validate the Supabase session.

## Assignment 2

The `/users` page reads rows from a Supabase table named `users` and displays
the `id` and `created_at` columns in a table.

Add these environment variables locally and in Vercel:

```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The `/users` page is server-rendered, so these variables do not need the
`NEXT_PUBLIC_` prefix. The app still supports `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for
local fallback compatibility.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build

```bash
npm run build
```

## Deploy

Connect this repository to Vercel and deploy the default Next.js project settings.

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
