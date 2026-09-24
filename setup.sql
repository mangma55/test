-- รันครั้งเดียวใน Supabase Dashboard > SQL Editor
-- ตารางทดลองแยกข้อมูลตามบัญชีที่เข้าสู่ระบบ
create table if not exists public.demo_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists demo_notes_user_created_idx
  on public.demo_notes (user_id, created_at desc);

alter table public.demo_notes enable row level security;

-- กำหนดสิทธิ์ SQL ขั้นพื้นฐานให้เฉพาะผู้ใช้ที่ลงชื่อเข้าใช้
revoke all on table public.demo_notes from anon, authenticated;
grant select, insert, delete on table public.demo_notes to authenticated;
grant update (message) on table public.demo_notes to authenticated;

drop policy if exists "demo_notes_select_own" on public.demo_notes;
create policy "demo_notes_select_own" on public.demo_notes
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "demo_notes_insert_own" on public.demo_notes;
create policy "demo_notes_insert_own" on public.demo_notes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "demo_notes_update_own" on public.demo_notes;
create policy "demo_notes_update_own" on public.demo_notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "demo_notes_delete_own" on public.demo_notes;
create policy "demo_notes_delete_own" on public.demo_notes
  for delete to authenticated using ((select auth.uid()) = user_id);
