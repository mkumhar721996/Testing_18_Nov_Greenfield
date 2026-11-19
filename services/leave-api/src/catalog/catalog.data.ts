export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export const CATALOG_DATA = 'CATALOG_DATA';

// Release-time catalog data: add a category by appending one entry here. No prices (owned by Pricing, Quotes & Payment Records).
export const CATALOG_CATEGORIES: ServiceCategory[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, blocked drains, taps, toilets, water heaters and pipe repairs.',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Wiring faults, socket and switch replacement, lighting and fuse board checks.',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Home and office cleaning, deep cleaning, and end-of-tenancy cleaning.',
  },
  {
    id: 'appliance-repair',
    name: 'Appliance repair',
    description: 'Repairs for washing machines, fridges, ovens and other home appliances.',
  },
];
