create table if not exists public.users (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.users to anon, authenticated;

drop policy if exists "Allow public read access to users" on public.users;

create policy "Allow public read access to users"
on public.users
for select
to anon, authenticated
using (true);
