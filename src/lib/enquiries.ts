import { supabase } from './supabase';
import { sendFormEmail } from './formSubmit';
import type { ContactValues } from '../components/contact/contactLogic';
import type { QuoteValues } from '../components/quote/quoteLogic';
import type { CalcInputs, CalcResult } from '../components/calculator/calculatorLogic';
import { calculatedCapacityKw, parseNum, recommendedCapacityKw, totalAnnualUnits } from '../components/calculator/calculatorLogic';
import { calculateFinancials, formatPayback, moneyValue } from '../components/admin/solarFinancials';

export type EnquiryStatus = 'new' | 'contacted' | 'closed';
export const ENQUIRY_STATUSES: EnquiryStatus[] = ['new', 'contacted', 'closed'];

export interface QuoteRequest {
  id: number;
  created_at: string;
  source: 'quote_page' | 'quote_modal';
  name: string;
  email: string | null;
  phone: string;
  project_type: 'residential' | 'commercial' | null;
  capacity: string | null;
  location: string | null;
  bill: string | null;
  details: string | null;
  status: EnquiryStatus;
}

export interface ContactMessage {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
}

export interface CalculatorSubmission {
  id: number;
  created_at: string;
  source: 'website' | 'admin';
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  quote_request_id: number | null;
  contact_message_id: number | null;
  project_type: 'residential' | 'commercial';
  location: string;
  readings: (number | null)[];
  total_units: number;
  monthly_bill: number;
  capacity_kwp: number;
  capacity_provided: boolean;
  recommended_kw: number;
  monthly_saving: number | null;
  annual_saving: number | null;
  payback_years: number | null;
  // Admin solar calculation (null on website rows and older records)
  eb_bills: number[] | null;
  monthly_fixed_charges: number | null;
  installation_cost: number | null;
  average_daily_units: number | null;
  calculated_kw: number | null;
  annual_eb_bill: number | null;
  monthly_average_bill: number | null;
  payback_text: string | null;
  status: EnquiryStatus;
}

export type EnquiryTable = 'quote_requests' | 'contact_messages' | 'calculator_submissions';

const orNull = (v: string) => v.trim() || null;

// Save to Supabase (for /admin) and email the enquiry to the support inbox in parallel.
// The visitor sees success if either one goes through; only fail when both do.
async function saveAndEmail(save: () => Promise<void>, email: () => Promise<void>) {
  const [saved, emailed] = await Promise.allSettled([save(), email()]);
  if (saved.status === 'rejected') console.error('Enquiry save failed', saved.reason);
  if (emailed.status === 'rejected') console.error('Enquiry email failed', emailed.reason);
  if (saved.status === 'rejected' && emailed.status === 'rejected') throw saved.reason;
}

// Inserts are write-only for visitors (RLS blocks reading back), so no .select() after insert.
async function insert(table: EnquiryTable, row: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw error;
}

export function submitQuote(v: QuoteValues) {
  return saveAndEmail(
    () => insert('quote_requests', {
      source: 'quote_page',
      name: v.name.trim(),
      email: orNull(v.email),
      phone: v.phone.trim(),
      project_type: v.projectType,
      capacity: orNull(v.capacity),
      location: orNull(v.location),
      bill: orNull(v.bill),
      details: orNull(v.details),
    }),
    () => sendFormEmail(`New quote request from ${v.name.trim()}`, {
      Name: v.name.trim(),
      Email: v.email.trim(),
      Phone: v.phone.trim(),
      'Project type': v.projectType === 'residential' ? 'Residential' : 'Commercial',
      'Solar system capacity': v.capacity.trim() || 'Not specified',
      'Installation location': v.location.trim(),
      'Monthly bill / energy requirement': v.bill.trim() || 'Not specified',
      'Additional details': v.details.trim() || 'None',
    }, v.email.trim()),
  );
}

export function submitQuickQuote(v: { name: string; phone: string; message: string }) {
  return saveAndEmail(
    () => insert('quote_requests', {
      source: 'quote_modal',
      name: v.name.trim(),
      phone: v.phone.trim(),
      details: orNull(v.message),
    }),
    () => sendFormEmail(`New quick quote request from ${v.name.trim()}`, {
      Name: v.name.trim(),
      Phone: v.phone.trim(),
      Message: v.message.trim() || 'None',
    }),
  );
}

export function submitContact(v: ContactValues) {
  return saveAndEmail(
    () => insert('contact_messages', {
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      subject: v.subject,
      message: v.message.trim(),
    }),
    () => sendFormEmail(`Contact form: ${v.subject} — ${v.name.trim()}`, {
      Name: v.name.trim(),
      Email: v.email.trim(),
      Phone: v.phone.trim(),
      Subject: v.subject,
      Message: v.message.trim(),
    }, v.email.trim()),
  );
}

const numOrNull = (v: string) => (Number.isFinite(parseNum(v)) ? parseNum(v) : null);
const round = (n: number | null, dp = 2) => (n === null ? null : Math.round(n * 10 ** dp) / 10 ** dp);

const calcRow = (i: CalcInputs, r: CalcResult) => ({
  project_type: i.projectType,
  location: i.location.trim(),
  readings: i.readings.map(numOrNull),
  total_units: round(r.totalUnits),
  monthly_bill: round(r.currentBill),
  capacity_kwp: round(r.capacityKwp),
  capacity_provided: r.capacityProvided,
  recommended_kw: round(r.recommendedKw),
  monthly_saving: round(r.monthlySaving),
  annual_saving: round(r.annualSaving),
  payback_years: round(r.paybackYears),
});

// Logged in the background for /admin — the visitor's estimate never depends on this succeeding.
export function saveCalculation(i: CalcInputs, r: CalcResult) {
  insert('calculator_submissions', calcRow(i, r)).catch(err => console.error('Calculation log failed', err));
}

/** The customer an admin calculation is saved against, optionally linked to their enquiry. */
export interface CalcCustomer {
  name: string;
  phone: string;
  email: string;
  quoteRequestId: number | null;
  contactMessageId: number | null;
}

/** Raw admin inputs + capacity result; every derived value is recomputed here before saving. */
export interface AdminSolarSave {
  readings: string[];
  bills: string[];
  fixedCharges: string;
  installationCost: string;
}

/** Every calculated + input column the admin dialog writes (shared by create and update). */
function adminSolarRow(i: CalcInputs, r: CalcResult, c: CalcCustomer, s: AdminSolarSave) {
  const units = totalAnnualUnits(s.readings.map(parseNum));
  const calculatedKw = calculatedCapacityKw(units);
  const fin = calculateFinancials({ bills: s.bills, fixedCharges: s.fixedCharges, installationCost: s.installationCost });
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);
  return {
    ...calcRow(i, r),
    total_units: round(safe(units)),
    average_daily_units: round(safe(units / 365)),
    calculated_kw: round(safe(calculatedKw)),
    recommended_kw: round(safe(recommendedCapacityKw(calculatedKw))),
    eb_bills: s.bills.map(moneyValue),
    monthly_fixed_charges: moneyValue(s.fixedCharges),
    installation_cost: moneyValue(s.installationCost),
    annual_eb_bill: round(safe(fin.annualBill)),
    monthly_average_bill: round(safe(fin.monthlyAverage)),
    monthly_saving: round(safe(fin.monthlySavings)),
    annual_saving: round(safe(fin.annualSavings)),
    payback_years: round(fin.paybackYears),
    payback_text: formatPayback(fin.paybackMonths),
    customer_name: c.name.trim(),
    customer_phone: c.phone.trim(),
    customer_email: orNull(c.email),
    quote_request_id: c.quoteRequestId,
    contact_message_id: c.contactMessageId,
  };
}

export function saveAdminCalculation(i: CalcInputs, r: CalcResult, c: CalcCustomer, s: AdminSolarSave) {
  return insert('calculator_submissions', { ...adminSolarRow(i, r, c, s), source: 'admin', status: 'contacted' });
}

/** Updates an existing calculation in place; source, status and created_at are left as they are. */
export async function updateAdminCalculation(id: number, i: CalcInputs, r: CalcResult, c: CalcCustomer, s: AdminSolarSave) {
  const { data, error } = await supabase.from('calculator_submissions').update(adminSolarRow(i, r, c, s)).eq('id', id).select('id');
  if (error) throw error;
  // RLS filters unauthorised updates silently, so an empty result means nothing was saved.
  if (!data?.length) throw new Error('Could not update this calculation. Please sign in again and retry.');
}

/** Calculations an admin saved against one enquiry, newest first. */
export async function listCalculationsFor(link: { quote_request_id: number } | { contact_message_id: number }) {
  const [col, id] = Object.entries(link)[0];
  const { data, error } = await supabase.from('calculator_submissions').select('*').eq(col, id).order('created_at', { ascending: false });
  if (error) throw error;
  return data as CalculatorSubmission[];
}

export async function listEnquiries<T>(table: EnquiryTable): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data as T[];
}

export async function setEnquiryStatus(table: EnquiryTable, id: number, status: EnquiryStatus) {
  const { error } = await supabase.from(table).update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteEnquiry(table: EnquiryTable, id: number) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/** Deletes several rows at once; returns the ids actually removed (RLS can filter rows out silently). */
export async function deleteEnquiries(table: EnquiryTable, ids: number[]): Promise<number[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from(table).delete().in('id', ids).select('id');
  if (error) throw error;
  return (data ?? []).map(r => r.id as number);
}
