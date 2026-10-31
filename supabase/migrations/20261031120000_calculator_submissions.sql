-- Solar Savings Calculator runs, logged anonymously from the website and listed on /admin/calculator.

create table public.calculator_submissions (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  project_type      text not null check (project_type in ('residential', 'commercial')),
  location          text not null check (char_length(location) between 1 and 200),
  readings          numeric[] not null check (cardinality(readings) <= 6),
  total_units       numeric not null check (total_units >= 0),
  monthly_bill      numeric not null check (monthly_bill > 0),
  capacity_kwp      numeric not null check (capacity_kwp >= 0),
  capacity_provided boolean not null default false,
  recommended_kw    numeric not null check (recommended_kw >= 0),
  tariff            numeric check (tariff > 0),
  units_per_kwp     numeric check (units_per_kwp > 0),
  cost_per_kwp      numeric check (cost_per_kwp > 0),
  monthly_saving    numeric,
  annual_saving     numeric,
  payback_years     numeric,
  status            text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create index calculator_submissions_created_at_idx on public.calculator_submissions (created_at desc);

alter table public.calculator_submissions enable row level security;

grant insert on public.calculator_submissions to anon, authenticated;
grant select, update, delete on public.calculator_submissions to authenticated;

-- Visitors may only add new rows; they can never read them back.
create policy "Visitors can log calculations"
  on public.calculator_submissions for insert
  to anon, authenticated
  with check (status = 'new');

-- Only users listed in public.admins can read and manage them.
create policy "Admins can read calculations"
  on public.calculator_submissions for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can update calculations"
  on public.calculator_submissions for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Admins can delete calculations"
  on public.calculator_submissions for delete
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
