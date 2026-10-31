import { supabase } from './supabase';
import { sendFormEmail } from './formSubmit';
import type { ContactValues } from '../components/contact/contactLogic';
import type { QuoteValues } from '../components/quote/quoteLogic';
import type { CalcInputs, CalcResult } from '../components/calculator/calculatorLogic';
import { parseNum } from '../components/calculator/calculatorLogic';

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
  project_type: 'residential' | 'commercial';
  location: string;
  readings: (number | null)[];
  total_units: number;
  monthly_bill: number;
  capacity_kwp: number;
  capacity_provided: boolean;
  recommended_kw: number;
  tariff: number | null;
  units_per_kwp: number | null;
  cost_per_kwp: number | null;
  monthly_saving: number | null;
  annual_saving: number | null;
  payback_years: number | null;
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

// Logged in the background for /admin — the visitor's estimate never depends on this succeeding.
export function saveCalculation(i: CalcInputs, r: CalcResult) {
  insert('calculator_submissions', {
    project_type: i.projectType,
    location: i.location.trim(),
    readings: i.readings.map(numOrNull),
    total_units: round(r.totalUnits),
    monthly_bill: round(r.currentBill),
    capacity_kwp: round(r.capacityKwp),
    capacity_provided: r.capacityProvided,
    recommended_kw: round(r.recommendedKw),
    tariff: numOrNull(i.tariff),
    units_per_kwp: numOrNull(i.unitsPerKwp),
    cost_per_kwp: numOrNull(i.costPerKwp),
    monthly_saving: round(r.monthlySaving),
    annual_saving: round(r.annualSaving),
    payback_years: round(r.paybackYears),
  }).catch(err => console.error('Calculation log failed', err));
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
