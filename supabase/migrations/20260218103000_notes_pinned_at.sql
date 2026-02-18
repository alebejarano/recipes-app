alter table if exists public.notes
  add column if not exists pinned_at timestamptz;

create index if not exists notes_user_pinned_updated_idx
  on public.notes (user_id, pinned_at desc, updated_at desc);
