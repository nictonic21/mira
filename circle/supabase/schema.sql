-- Circle schema. Run this in the Supabase SQL editor.
-- Uses Supabase's built-in auth.users for identity; the tables below hold app data.

-- Profile row per user (subscription state lives here, not in auth.users).
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  subscription_status text not null default 'free'
);

create table if not exists public.friends (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  relationship_type text,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid (),
  friend_id uuid not null references public.friends (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  energy_score int not null check (energy_score between 1 and 10),
  effort text not null check (effort in ('me', 'them', 'mutual')),
  tags text[] not null default '{}',
  what_happened text,
  how_i_felt text
);

create table if not exists public.entry_analysis (
  id uuid primary key default gen_random_uuid (),
  entry_id uuid not null references public.entries (id) on delete cascade,
  sentiment_score real not null check (sentiment_score between -1 and 1),
  themes text[] not null default '{}',
  ai_note text not null default '',
  processed_at timestamptz not null default now()
);

-- Nightly-computed monthly aggregates. The MVP computes scores on read
-- client-side; this table is here for the scheduled job that replaces that.
create table if not exists public.friend_scores (
  id uuid primary key default gen_random_uuid (),
  friend_id uuid not null references public.friends (id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  avg_energy real,
  effort_ratio real,
  entry_count int not null default 0,
  computed_score int,
  unique (friend_id, month)
);

create index if not exists friends_user_idx on public.friends (user_id);
create index if not exists entries_user_idx on public.entries (user_id);
create index if not exists entries_friend_idx on public.entries (friend_id);
create index if not exists entry_analysis_entry_idx on public.entry_analysis (entry_id);
create index if not exists friend_scores_friend_idx on public.friend_scores (friend_id);

-- Row level security: every row is private to its owner.
alter table public.users enable row level security;
alter table public.friends enable row level security;
alter table public.entries enable row level security;
alter table public.entry_analysis enable row level security;
alter table public.friend_scores enable row level security;

create policy "own profile" on public.users
  for all using (id = auth.uid ()) with check (id = auth.uid ());

create policy "own friends" on public.friends
  for all using (user_id = auth.uid ()) with check (user_id = auth.uid ());

create policy "own entries" on public.entries
  for all using (user_id = auth.uid ()) with check (user_id = auth.uid ());

create policy "own entry analysis" on public.entry_analysis
  for all using (
    exists (
      select 1 from public.entries e
      where e.id = entry_id and e.user_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1 from public.entries e
      where e.id = entry_id and e.user_id = auth.uid ()
    )
  );

create policy "own friend scores" on public.friend_scores
  for all using (
    exists (
      select 1 from public.friends f
      where f.id = friend_id and f.user_id = auth.uid ()
    )
  )
  with check (
    exists (
      select 1 from public.friends f
      where f.id = friend_id and f.user_id = auth.uid ()
    )
  );

-- Create the profile row automatically on signup.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();
