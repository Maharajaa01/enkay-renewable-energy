import {
  ArrowDownToLine, AudioWaveform, BatteryCharging, Cable, CloudLightning, Hash, LayoutGrid, Plug, PlugZap, Sun, Unplug, type LucideIcon,
} from 'lucide-react';

const P = '/assets/products';

// Hero / CTA backdrops and two category photos could not be pulled from Figma (MCP call limit),
// so they reuse the closest photos already shipped with the project.
export const PRODUCTS_HERO_IMAGE = '/assets/products/hero-panels.jpg';
export const PRODUCTS_CTA_BG = '/assets/about/hero-solar-farm.jpg';

export interface Category {
  icon: LucideIcon;
  img: string;
  title: string;
  side?: 'dc' | 'ac';
}

export const CATEGORIES: Category[] = [
  { icon: LayoutGrid, img: `${P}/cat-modules.png`, title: 'Solar PV Modules' },
  { icon: PlugZap, img: `${P}/cat-ongrid.png`, title: 'On-Grid Solar Inverters' },
  { icon: BatteryCharging, img: `${P}/cat-offgrid.jpg`, title: 'Off-Grid Solar Inverters' },
  { icon: Sun, img: `${P}/cat-dcdb.jpg`, title: 'DCDB', side: 'dc' },
  { icon: AudioWaveform, img: `${P}/cat-acdb.jpg`, title: 'ACDB', side: 'ac' },
  { icon: Cable, img: `${P}/cat-dc-cables.jpg`, title: 'Solar DC Cables' },
  { icon: Unplug, img: `${P}/cat-ac-cables.jpg`, title: 'Solar AC Cables' },
  { icon: Hash, img: `${P}/cat-mounting.png`, title: 'Mounting Structures' },
  { icon: ArrowDownToLine, img: `${P}/cat-earthing-system.jpg`, title: 'Earthing System' },
  { icon: CloudLightning, img: `${P}/cat-lightning.jpg`, title: 'Lightning Protection' },
  { icon: Plug, img: `${P}/cat-accessories.jpg`, title: 'Electrical Accessories' },
];

export const MODULE_SPEC = {
  range: '3 – 880',
  unit: 'Wp',
  text: 'Full range of solar photovoltaic modules from automatic production lines, manufactured in India.',
  rows: [
    ['Quoted module', 'DCR 550 Wp'],
    ['Technology', 'TOPCon / Bifacial'],
    ['Quoted brands', 'Rayzon / Vikram'],
  ],
};

export const CERT_SPEC = {
  note: 'All modules of 10 Wp and above.',
  rows: [
    ['TUV certified', 'IEC 61215'],
    ['TUV certified', 'IEC 61730-2'],
    ['ETL Intertek', 'UL 1703'],
  ],
  badges: ['TUV', 'ETL Intertek'],
};

// export const INVERTER_SPEC = {
//   rows: [
//     ['Quoted inverter', 'VSole / Polycab'],
//     ['Rating', '5 kWp, single phase'],
//     ['Type', 'Grid-tied, on-grid'],
//     ['Monitoring', 'Cloud RMS'],
//     ['Compliance', 'BIS certified'],
//     ['Also available', 'On-grid & off-grid inverters'],
//   ],
// };