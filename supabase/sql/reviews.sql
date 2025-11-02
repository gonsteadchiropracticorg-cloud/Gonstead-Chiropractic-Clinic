-- Reviews table for website ratings (Trustpilot-like)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int2 not null check (rating between 1 and 5),
  title text,
  text text not null,
  source text default 'website',
  verified boolean default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Allow public (anon) to insert and read reviews
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_select'
  ) then
    create policy reviews_select on public.reviews for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='reviews_insert'
  ) then
    create policy reviews_insert on public.reviews for insert with check (rating between 1 and 5 and char_length(text) > 2);
  end if;
end $$;

-- Helpful indexes
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_rating_idx on public.reviews (rating);
