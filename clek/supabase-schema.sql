-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  generations_today int default 0,
  last_generation_date date default current_date,
  created_at timestamptz default now()
);

-- Decks table
create table if not exists decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  categories text[] default '{}',
  quiz_options boolean default false,
  tags text[] default '{}',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cards table
create table if not exists cards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  tags text[] default '{}',
  ease_factor float default 2.5,
  interval_days int default 0,
  next_review timestamptz default now(),
  created_at timestamptz default now()
);

-- Study sessions table
create table if not exists study_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  deck_id uuid references decks(id) on delete cascade not null,
  cards_studied int default 0,
  correct int default 0,
  mode text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table decks enable row level security;
alter table cards enable row level security;
alter table study_sessions enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Enable insert for auth users" on profiles for insert with check (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Decks: users can CRUD their own
create policy "Users can view own decks" on decks for select using (auth.uid() = user_id);
create policy "Users can insert own decks" on decks for insert with check (auth.uid() = user_id);
create policy "Users can update own decks" on decks for update using (auth.uid() = user_id);
create policy "Users can delete own decks" on decks for delete using (auth.uid() = user_id);

-- Cards: via deck ownership
create policy "Users can view own cards" on cards for select using (
  exists (select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid())
);
create policy "Users can insert own cards" on cards for insert with check (
  exists (select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid())
);
create policy "Users can update own cards" on cards for update using (
  exists (select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid())
);
create policy "Users can delete own cards" on cards for delete using (
  exists (select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid())
);

-- Study sessions
create policy "Users can view own sessions" on study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on study_sessions for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to reset daily generation count
create or replace function reset_daily_generations()
returns void as $$
begin
  update profiles
  set generations_today = 0, last_generation_date = current_date
  where last_generation_date < current_date;
end;
$$ language plpgsql security definer;
