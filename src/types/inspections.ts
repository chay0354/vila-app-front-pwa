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

// Default tasks for exit inspections
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

// Default tasks for cleaning inspections
export const defaultCleaningInspectionTasks: InspectionTask[] = [
  // מטבח (Kitchen)
  { id: '1', name: 'מכונת קפה, לנקות ולהחליף פילטר קפה', completed: false },
  { id: '2', name: 'קפה תה סוכר וכו׳', completed: false },
  { id: '3', name: 'להעביר סמרטוט במתקן מים', completed: false },
  { id: '4', name: 'מקרר – בפנים ובחוץ', completed: false },
  { id: '5', name: 'תנור – בפנים ובחוץ', completed: false },
  { id: '6', name: 'כיריים וגריל', completed: false },
  { id: '7', name: 'מיקרו', completed: false },
  { id: '8', name: 'כיור', completed: false },
  { id: '9', name: 'כלים – לשטוף ליבש ולהחזיר לארון', completed: false },
  { id: '10', name: 'לבדוק שכל הכלים נקיים', completed: false },
  { id: '11', name: 'לבדוק שיש לפחות 20 כוסות אוכל מכל דבר', completed: false },
  { id: '12', name: 'ארונות מטבח – לפתוח ולראות שאין דברים להוציא דברים לא קשורים', completed: false },
  { id: '13', name: 'להעביר סמרטוט על הדלתות מטבח בחוץ', completed: false },
  { id: '14', name: 'להעביר סמרטוט על הפח ולראות שנקי', completed: false },
  { id: '15', name: 'פלטת שבת ומיחם מים חמים – לראות שאין אבן', completed: false },
  { id: '16', name: 'סכו״ם, כלים, סמרטוט, סקוֹץ׳ חדשים לאורחים', completed: false },
  { id: '17', name: 'סבון', completed: false },
  // סלון (Living Room)
  { id: '18', name: 'סלון שטיפה יסודית גם מתחת לספות ולשולחן, להזיז כורסאות ולבדוק שאין פירורים של אוכל', completed: false },
  { id: '19', name: 'שולחן אוכל וספסלים (לנקות בשפריצר ולהעביר סמרטוט)', completed: false },
  { id: '20', name: 'סלון – לנגב אבק ולהעביר סמרטוט גם על הספה. כיריות לנקות לסדר יפה', completed: false },
  { id: '21', name: 'שולחן אוכל וספסלים – להעביר סמרטוט נקי עם תריס', completed: false },
  { id: '22', name: 'חלונות ותריסים – עם ספריי חלונות וסמרטוט נקי. שלא יהיו סימנים. מסילות לנקות', completed: false },
  // מסדרון (Hallway)
  { id: '23', name: 'מסדרון – לנגב בחוץ שטיחים. לנקות מסילות בחלונות. לנקות חלונות', completed: false },
  // חצר (Yard)
  { id: '24', name: 'טיפול ברזים וניקוי', completed: false },
  { id: '25', name: 'להשקות עציצים בכל המתחם', completed: false },
  { id: '26', name: 'פינת מנגל – לרוקן פחים ולנקות רשת, וכל אזור המנגל', completed: false },
  { id: '27', name: 'לנקות דשא ולסדר פינות ישיבה', completed: false },
  { id: '28', name: 'שולחן חוץ – להעביר סמרטוט עם חומר. כיסאות נקיים', completed: false },
  { id: '29', name: 'שטיפה לרצפה בחוץ', completed: false },
  { id: '30', name: 'לרוקן את הפחים, לשים שקית חדשה', completed: false },
  { id: '31', name: 'להעביר סמרטוט על הפחים ולשים שקיות', completed: false },
]

// Default tasks for monthly inspections
export const defaultMonthlyInspectionTasks: InspectionTask[] = [
  { id: '1', name: 'בדיקת תקינות מערכות חשמל', completed: false },
  { id: '2', name: 'בדיקת תקינות מערכות מים', completed: false },
  { id: '3', name: 'בדיקת תקינות מערכות גז', completed: false },
  { id: '4', name: 'בדיקת תקינות מזגנים', completed: false },
  { id: '5', name: 'בדיקת תקינות דודי שמש', completed: false },
  { id: '6', name: 'בדיקת תקינות מערכות אבטחה', completed: false },
  { id: '7', name: 'בדיקת תקינות מערכות תאורה', completed: false },
  { id: '8', name: 'בדיקת תקינות דלתות וחלונות', completed: false },
  { id: '9', name: 'בדיקת תקינות ריהוט וציוד', completed: false },
  { id: '10', name: 'בדיקת תקינות מערכות ניקוז', completed: false },
  { id: '11', name: 'בדיקת תקינות מערכות אוורור', completed: false },
  { id: '12', name: 'בדיקת תקינות מערכות כיבוי אש', completed: false },
  { id: '13', name: 'בדיקת תקינות מערכות אינטרנט', completed: false },
  { id: '14', name: 'בדיקת תקינות מערכות טלוויזיה', completed: false },
  { id: '15', name: 'בדיקת תקינות מערכות מיזוג', completed: false },
  { id: '16', name: 'בדיקת תקינות מערכות מים חמים', completed: false },
  { id: '17', name: 'בדיקת תקינות מערכות תאורה חוץ', completed: false },
  { id: '18', name: 'בדיקת תקינות מערכות השקיה', completed: false },
  { id: '19', name: 'בדיקת תקינות מערכות בריכה', completed: false },
  { id: '20', name: 'בדיקת תקינות מערכות גקוזי', completed: false },
]

