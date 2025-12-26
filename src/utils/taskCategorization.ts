import { InspectionTask } from '../types/inspections'

export type TaskCategory = {
  name: string
  tasks: InspectionTask[]
}

export function categorizeTasks(tasks: InspectionTask[]): TaskCategory[] {
  const categories: { [key: string]: InspectionTask[] } = {
    'טיפול ברכיה': [],
    'טיפול גקוזי': [],
    'ניקיון': [],
    'בדיקות': [],
    'כיבוי ונעילה': [],
    'אחר': [],
  }

  tasks.forEach(task => {
    const taskName = task.name.toLowerCase()
    
    // טיפול ברכיה
    if (taskName.includes('רכיה') || taskName.includes('בריכה') || 
        taskName.includes('כלור') || taskName.includes('רובוט') || 
        taskName.includes('רשת') || taskName.includes('מנוע') || 
        taskName.includes('פילטר') || taskName.includes('בקווש') ||
        taskName.includes('מדרגות') || taskName.includes('רביצה')) {
      categories['טיפול ברכיה'].push(task)
    }
    // טיפול גקוזי
    else if (taskName.includes('גקוזי') || taskName.includes('ג\'קוזי')) {
      categories['טיפול גקוזי'].push(task)
    }
    // ניקיון
    else if (taskName.includes('ניקיון') || taskName.includes('פינוי') || 
             taskName.includes('זבל') || taskName.includes('אשפה')) {
      categories['ניקיון'].push(task)
    }
    // בדיקות
    else if (taskName.includes('בדיק') || taskName.includes('תקינות') || 
             taskName.includes('מכשיר') || taskName.includes('ריהוט') ||
             taskName.includes('מצעים') || taskName.includes('מגבות') ||
             taskName.includes('מלאי')) {
      categories['בדיקות'].push(task)
    }
    // כיבוי ונעילה
    else if (taskName.includes('כיבוי') || taskName.includes('אורות') || 
             taskName.includes('נעיל') || taskName.includes('דלת')) {
      categories['כיבוי ונעילה'].push(task)
    }
    // אחר
    else {
      categories['אחר'].push(task)
    }
  })

  // Return only categories that have tasks, in a specific order
  const orderedCategories: TaskCategory[] = []
  const categoryOrder = ['טיפול ברכיה', 'טיפול גקוזי', 'ניקיון', 'בדיקות', 'כיבוי ונעילה', 'אחר']
  
  categoryOrder.forEach(categoryName => {
    if (categories[categoryName].length > 0) {
      orderedCategories.push({
        name: categoryName,
        tasks: categories[categoryName],
      })
    }
  })

  return orderedCategories
}




