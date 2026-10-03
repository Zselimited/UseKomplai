-- ============================================================================
-- Rulla — deadline reminder email log
-- ============================================================================
-- Tracks which (business, rule, due date, threshold) reminder emails have
-- already been sent, so the daily cron job never sends the same reminder
-- twice even if it runs more than once or catches up after a missed day.
--
-- No RLS policies are defined for anon/authenticated — this table is only
-- ever read/written by the server-only cron route using the service_role
-- key (see src/lib/supabase/admin.ts), which bypasses RLS entirely. RLS is
-- still enabled so a future accidental grant doesn't silently expose it.
-- ============================================================================

begin;

create table public.reminder_log (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  rule_code   text not null,
  due_date    date not null,
  threshold   text not null
              constraint reminder_log_threshold_check
              check (threshold in ('soon_7d', 'soon_1d', 'due_today')),
  sent_to     text not null,
  sent_at     timestamptz not null default now(),
  constraint reminder_log_unique_send unique (business_id, rule_code, due_date, threshold)
);

comment on table public.reminder_log is
  'De-dupe log for deadline reminder emails. Written only by the server-side cron route (service_role) — never by client code.';

create index reminder_log_business_id_idx on public.reminder_log (business_id);

alter table public.reminder_log enable row level security;

commit;
