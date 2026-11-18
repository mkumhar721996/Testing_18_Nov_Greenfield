import { createContext, useContext } from 'react'

export type Customer = { firstName: string; fullName: string }

// Filled by the sign-in/session flow; null while nobody is signed in.
export const CustomerContext = createContext<Customer | null>(null)

export function useCustomer(): Customer | null {
  return useContext(CustomerContext)
}

export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}
