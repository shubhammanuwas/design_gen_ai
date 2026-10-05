create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_path text not null,
  prompt text not null check (char_length(prompt) between 1 and 500),
  caption text not null check (char_length(caption) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.caption_votes (
  generation_id uuid not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (generation_id, user_id)
);

create index if not exists generations_created_at_idx
  on public.generations (created_at desc);

create index if not exists caption_votes_user_id_idx
  on public.caption_votes (user_id);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.caption_votes enable row level security;

grant select on public.users to anon, authenticated;
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant select on public.generations to anon, authenticated;
grant insert on public.generations to authenticated;
grant select, insert, update on public.caption_votes to authenticated;

drop policy if exists "Allow public read access to users" on public.users;
drop policy if exists "Anyone can read users" on public.users;
create policy "Anyone can read users"
on public.users for select to anon, authenticated
using (true);

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Anyone can read generations" on public.generations;
create policy "Anyone can read generations"
on public.generations for select to anon, authenticated
using (true);

drop policy if exists "Users can create their own generations" on public.generations;
create policy "Users can create their own generations"
on public.generations for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own votes" on public.caption_votes;
create policy "Users can read their own votes"
on public.caption_votes for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own votes" on public.caption_votes;
create policy "Users can create their own votes"
on public.caption_votes for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can change their own votes" on public.caption_votes;
create policy "Users can change their own votes"
on public.caption_votes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generation-photos', 'generation-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Generation photos are publicly readable" on storage.objects;
create policy "Generation photos are publicly readable"
on storage.objects for select to public
using (bucket_id = 'generation-photos');

drop policy if exists "Users can upload their own generation photos" on storage.objects;
create policy "Users can upload their own generation photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'generation-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their own generation photos" on storage.objects;
create policy "Users can delete their own generation photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'generation-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create or replace function public.get_caption_vote_counts()
returns table (generation_id uuid, upvotes bigint, downvotes bigint)
language sql
security definer
set search_path = ''
as $$
  select
    g.id,
    count(v.generation_id) filter (where v.value = 1),
    count(v.generation_id) filter (where v.value = -1)
  from public.generations as g
  left join public.caption_votes as v on v.generation_id = g.id
  group by g.id
$$;

revoke all on function public.get_caption_vote_counts() from public;
grant execute on function public.get_caption_vote_counts() to anon, authenticated;
