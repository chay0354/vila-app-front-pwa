export type InspectionStatus =
  | 'זמן הביקורות טרם הגיע'
  | 'דורש ביקורת היום'
  | 'זמן הביקורת עבר'
  | 'הביקורת הושלמה'

export type InspectionTask = {
  id: string
  name: string
  completed: boolean
}

export type InspectionMission = {
  id: string
  orderId: string
  unitNumber: string
  guestName: string
  departureDate: string
  status: InspectionStatus
  tasks: InspectionTask[]
}

export const defaultInspectionTasks: InspectionTask[] = [
  { id: '1', name: 'ניקיון חדרים', completed: false },
  { id: '2', name: 'ניקיון מטבח', completed: false },
  { id: '3', name: 'ניקיון שירותים', completed: false },
  { id: '4', name: 'בדיקת מכשירים', completed: false },
  { id: '5', name: 'בדיקת מצב ריהוט', completed: false },
  { id: '6', name: 'החלפת מצעים', completed: false },
  { id: '7', name: 'החלפת מגבות', completed: false },
  { id: '8', name: 'בדיקת מלאי', completed: false },
]

