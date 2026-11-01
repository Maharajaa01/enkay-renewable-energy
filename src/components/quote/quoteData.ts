// Static content taken from img/07-get-a-quote.svg

export const QUOTE_BENEFITS = [
  'Expert Guidance & Consultation',
  'High-Quality Solar Products',
  'Professional Installation Team',
  'Government Subsidy Assistance',
  'Long-Term Support & Maintenance',
];

export const SUBSIDIES = [
  { who: ['PM Surya Ghar: Muft Bijli', 'Yojana'], amount: '₹78,000' },
  { who: ['State Government'], amount: '₹22,000' },
];

export const BANK_DETAILS: { label: string; value?: string; mono?: boolean; pending?: string }[] = [
  { label: 'Account Name', value: 'ENKAY Renewables Energy' },
  { label: 'Account Number', value: '196321010000154', mono: true },
  { label: 'Bank & Branch Name', value: 'UNION BANK, Madhavaram Branch' },
  { label: 'IFSC Code', pending: 'To be confirmed' },
];

export const TERMS: { title: string; text: string }[] = [
  { title: 'Price Basis', text: 'Chennai.' },
  { title: 'Delivery', text: '1–2 weeks from receipt of the purchase order and advance payment.' },
  { title: 'Solar Panels Warranty', text: '15-year manufacturing warranty, with 90% rated power production as stated in the client proposal.' },
  { title: 'VSole On-Grid Inverter Warranty', text: '10-year manufacturing warranty.' },
  { title: 'Other System Components', text: '5-year warranty.' },
  { title: 'Maintenance', text: '5 years of free maintenance.' },
  { title: 'TNEB Net-Metering', text: "Customer's scope." },
  { title: 'Payment Terms', text: '75% advance; the remaining 25% after installation is completed.' },
];
