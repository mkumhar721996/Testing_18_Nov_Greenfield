export interface Organization {
  id: string
  name: string
  address: string
  admin: { name: string; email: string } | null
  createdBy: string
  contact: { name: string; details: string }
}
