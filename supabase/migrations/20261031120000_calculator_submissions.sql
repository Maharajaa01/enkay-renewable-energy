-- Solar Savings Calculator runs: logged anonymously from the website, or saved by an admin
-- against a customer (optionally linked to their Get a Quote / Contact Us enquiry). Listed on /admin/calculator.

create table public.calculator_submissions (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  source             text not null default 'website' check (source in ('website', 'admin')),
  created_by         uuid default auth.uid() references auth.users (id) on delete set null,

  -- Customer (admin calculations only)
  customer_name      text check (char_length(customer_name) between 1 and 120),
  customer_phone     text check (char_length(customer_phone) between 1 and 30),
  customer_email     text check (char_length(customer_email) <= 200),
  quote_request_id   bigint references public.quote_requests (id) on delete set null,
  contact_message_id bigint references public.contact_messages (id) on delete set null,

  -- Inputs
  project_type       text not null check (project_type in ('residential', 'commercial')),
  location           text not null check (char_length(location) between 1 and 200),
  readings           numeric[] not null check (cardinality(readings) <= 6),
  monthly_bill       numeric not null check (monthly_bill > 0),
  capacity_provided  boolean not null default false,
  tariff             numeric check (tariff > 0),
  units_per_kwp      numeric check (units_per_kwp > 0),
  cost_per_kwp       numeric check (cost_per_kwp > 0),

  -- Results
  total_units        numeric not null check (total_units >= 0),
  capacity_kwp       numeric not null check (capacity_kwp >= 0),
  recommended_kw     numeric not null check (recommended_kw >= 0),
  monthly_saving     numeric,
  annual_saving      numeric,
  payback_years      numeric,

  status             text not null default 'new' check (status in ('new', 'contacted', 'closed'))
);

create index calculator_submissions_created_at_idx on public.calculator_submissions (created_at desc);
create index calculator_submissions_quote_request_id_idx on public.calculator_submissions (quote_request_id);
create index calculator_submissions_contact_message_id_idx on public.calculator_submissions (contact_message_id);
create index calculator_submissions_created_by_idx on public.calculator_submissions (created_by);

alter table public.calculator_submissions enable row level security;

grant insert on public.calculator_submissions to anon, authenticated;
grant select, update, delete on public.calculator_submissions to authenticated;

-- Website visitors may only add anonymous rows and can never read them back.
create policy "Visitors can log calculations"
  on public.calculator_submissions for insert
  to anon, authenticated
  with check (
    source = 'website' and status = 'new' and created_by is null
    and customer_name is null and customer_phone is null and customer_email is null
    and quote_request_id is null and contact_message_id is null
  );

-- Only users listed in public.admins can save customer calculations and manage all rows.
create policy "Admins can add calculations"
  on public.calculator_submissions for insert
  to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

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
