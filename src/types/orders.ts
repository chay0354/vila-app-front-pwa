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
  createdBy?: string
  openedBy?: string
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

export type UnitCategory = {
  name: string
  units: string[]
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: 'מתחמים מושב כלנית',
    units: [
      'צימרים כלנית ריזורט',
      'וילה ויקטוריה',
      'וילה כלנית',
      'וילה ממלכת אהרון',
      'וילה בוטיק אהרון',
      'וילה אירופה',
    ],
  },
  {
    name: 'מושב מגדל',
    units: [
      'וילאה 1',
      'וילאה 2',
      'לה כינרה',
    ],
  },
  {
    name: 'גבעת יואב',
    units: [
      'הודולה 1',
      'הודולה 2',
      'הודולה 3',
      'הודולה 4',
      'הודולה 5',
    ],
  },
  {
    name: 'צפת',
    units: [
      'בית קונפיטה',
    ],
  },
]

// Flatten all unit names for validation and easy access
export const UNIT_NAMES = UNIT_CATEGORIES.flatMap(category => category.units)

