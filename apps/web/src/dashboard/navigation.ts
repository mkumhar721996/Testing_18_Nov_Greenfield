export type Destination =
  | 'dashboard'
  | 'accounts'
  | 'transfers'
  | 'bill-pay'
  | 'statements'
  | 'payments'
  | 'cards'
  | 'profile'
  | 'my-leave'

export type IconName = 'home' | 'user' | 'arrow-right' | 'bell' | 'calendar'

export const SIDEBAR_ITEMS: { destination: Destination; label: string; icon: IconName }[] = [
  { destination: 'dashboard', label: 'Dashboard', icon: 'home' },
  { destination: 'accounts', label: 'Accounts', icon: 'user' },
  { destination: 'transfers', label: 'Transfers', icon: 'arrow-right' },
  { destination: 'bill-pay', label: 'Bill pay', icon: 'bell' },
  { destination: 'statements', label: 'Statements', icon: 'calendar' },
]

export const TOP_NAV_ITEMS: { destination: Destination; label: string }[] = [
  { destination: 'dashboard', label: 'Dashboard' },
  { destination: 'my-leave', label: 'My leave' },
  { destination: 'accounts', label: 'Accounts' },
  { destination: 'payments', label: 'Payments' },
  { destination: 'cards', label: 'Cards' },
]
