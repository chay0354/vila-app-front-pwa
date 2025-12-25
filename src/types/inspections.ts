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
  // טיפול ברכיה
  { id: '1', name: 'לשים כלור בבריכה', completed: false },
  { id: '2', name: 'להוסיף מים בבריכה', completed: false },
  { id: '3', name: 'לנקות רובוט ולהפעיל', completed: false },
  { id: '4', name: 'לנקות רשת פנים המנוע', completed: false },
  { id: '5', name: 'לעשות בקווש שטיפה לפילטר', completed: false },
  { id: '6', name: 'לטאטא הבק מהמדרגות ומשטחי רביצה', completed: false },
  // טיפול גקוזי
  { id: '7', name: 'לשים כלור בגקוזי', completed: false },
  { id: '8', name: 'להוסיף מים בגקוזי', completed: false },
  { id: '9', name: 'לנקות רובוט גקוזי ולהפעיל', completed: false },
  { id: '10', name: 'לנקות רשת פנים המנוע גקוזי', completed: false },
  { id: '11', name: 'לעשות בקווש שטיפה לפילטר גקוזי', completed: false },
  { id: '12', name: 'לטאטא הבק מהמדרגות ומשטחי רביצה גקוזי', completed: false },
  // ניקיון
  { id: '13', name: 'ניקיון חדרים', completed: false },
  { id: '14', name: 'ניקיון מטבח', completed: false },
  { id: '15', name: 'ניקיון שירותים', completed: false },
  { id: '16', name: 'פינוי זבל לפח אשפה פנים וחוץ הוילה', completed: false },
  // בדיקות
  { id: '17', name: 'בדיקת מכשירים', completed: false },
  { id: '18', name: 'בדיקת מצב ריהוט', completed: false },
  { id: '19', name: 'החלפת מצעים', completed: false },
  { id: '20', name: 'החלפת מגבות', completed: false },
  { id: '21', name: 'בדיקת מלאי', completed: false },
  { id: '22', name: 'לבדוק תקינות חדרים', completed: false },
  // כיבוי ונעילה
  { id: '23', name: 'כיבוי אורות פנים וחוץ הוילה', completed: false },
  { id: '24', name: 'לנעול דלת ראשית', completed: false },
]

