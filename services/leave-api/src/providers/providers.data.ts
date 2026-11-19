export interface RatingSummary {
  average: number;
  count: number;
}

export interface Provider {
  id: string;
  name: string;
  services: string[];
  towns: string[];
  // null = no ratings yet. The summary is maintained by Reviews & Notifications; read per request.
  rating: RatingSummary | null;
}

export const PROVIDERS_DATA = 'PROVIDERS_DATA';

// Release-time stand-in providers until provider onboarding exists. No prices or availability (owned by other contexts).
export const PROVIDERS: Provider[] = [
  {
    id: 'asha-plumbing',
    name: 'Asha Plumbing Co.',
    services: ['Plumbing', 'Water heater repair'],
    towns: ['Pune', 'Pimpri-Chinchwad'],
    rating: { average: 4.9, count: 124 },
  },
  {
    id: 'bright-spark',
    name: 'Bright Spark Electrical',
    services: ['Plumbing', 'Electrical wiring'],
    towns: ['Pune', 'Hadapsar'],
    rating: { average: 4.7, count: 58 },
  },
  {
    id: 'cedar-home',
    name: 'Cedar Home Services',
    services: ['Plumbing', 'Drain cleaning'],
    towns: ['Pune', 'Kothrud'],
    rating: { average: 4.7, count: 31 },
  },
  {
    id: 'anand-fix-it',
    name: 'Anand Fix-It',
    services: ['Plumbing', 'Tap and pipe fitting'],
    towns: ['Pune', 'Viman Nagar'],
    rating: null,
  },
  {
    id: 'dev-appliance-care',
    name: 'Dev Appliance Care',
    services: ['Plumbing', 'Appliance repair'],
    towns: ['Pune', 'Baner'],
    rating: null,
  },
];
