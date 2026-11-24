-- Store every field of the admin "Solar calculation" dialog as real columns.
-- All nullable, so website rows and older admin rows keep working. Supersedes the jsonb `financials` column.
alter table public.calculator_submissions
  add column if not exists eb_bills               numeric[] check (eb_bills is null or cardinality(eb_bills) <= 6),
  add column if not exists monthly_fixed_charges  numeric check (monthly_fixed_charges >= 0),
  add column if not exists installation_cost      numeric check (installation_cost >= 0),
  add column if not exists average_daily_units    numeric check (average_daily_units >= 0),
  add column if not exists calculated_kw          numeric check (calculated_kw >= 0),
  add column if not exists annual_eb_bill         numeric check (annual_eb_bill >= 0),
  add column if not exists monthly_average_bill   numeric check (monthly_average_bill >= 0),
  add column if not exists payback_text           text;

-- Make the API see the new columns immediately.
notify pgrst, 'reload schema';
