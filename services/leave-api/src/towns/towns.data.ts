export interface Town {
  id: string;
  name: string;
}

export const TOWNS_DATA = 'TOWNS_DATA';

// Release-time shared town list: add a town by appending one entry here.
export const TOWNS: Town[] = [
  { id: 'pune', name: 'Pune' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'chennai', name: 'Chennai' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'bengaluru', name: 'Bengaluru' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'kolkata', name: 'Kolkata' },
  { id: 'ahmedabad', name: 'Ahmedabad' },
];
