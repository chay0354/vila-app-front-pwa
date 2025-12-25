export type OrderStatus = 'חדש' | 'באישור' | 'שולם חלקית' | 'שולם' | 'בוטל'

export type Order = {
  id: string
  guestName: string
  unitNumber: string
  arrivalDate: string
  departureDate: string
  status: OrderStatus
  guestsCount: number
  specialRequests?: string
  internalNotes?: string
  paidAmount: number
  totalAmount: number
  paymentMethod: string
}

export const statusOptions: OrderStatus[] = [
  'חדש',
  'באישור',
  'שולם חלקית',
  'שולם',
  'בוטל',
]

export const paymentOptions = [
  'מזומן',
  'אשראי',
  'העברה בנקאית',
  'ביט',
  'צ׳ק',
  'אחר',
]

export const UNIT_NAMES = Array.from({ length: 10 }, (_, i) => `יחידה ${i + 1}`)

