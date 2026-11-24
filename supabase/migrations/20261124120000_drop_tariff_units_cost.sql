-- Remove the optional tariff / units-per-kWp / cost-per-kWp values from saved calculations.
-- They were empty in every existing row. Dropping the columns also drops their CHECK constraints.
alter table public.calculator_submissions
  drop column if exists tariff,
  drop column if exists units_per_kwp,
  drop column if exists cost_per_kwp;

notify pgrst, 'reload schema';
