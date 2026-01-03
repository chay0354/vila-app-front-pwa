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

// Categorize cleaning inspection tasks by category (מטבח, סלון, מסדרון, חצר, חדרים)
export function categorizeCleaningTasks(tasks: InspectionTask[]): TaskCategory[] {
  const categories: { [key: string]: InspectionTask[] } = {
    'מטבח': [],
    'סלון': [],
    'מסדרון': [],
    'חצר': [],
    'חדרים': [],
  }

  tasks.forEach(task => {
    const taskId = parseInt(task.id) || 0
    
    // מטבח (Kitchen) - tasks 1-17
    if (taskId >= 1 && taskId <= 17) {
      categories['מטבח'].push(task)
    }
    // סלון (Living Room) - tasks 18-22
    else if (taskId >= 18 && taskId <= 22) {
      categories['סלון'].push(task)
    }
    // מסדרון (Hallway) - task 23
    else if (taskId === 23) {
      categories['מסדרון'].push(task)
    }
    // חצר (Yard) - tasks 24-31
    else if (taskId >= 24 && taskId <= 31) {
      categories['חצר'].push(task)
    }
    // חדרים (Rooms) - tasks 32-39
    else if (taskId >= 32 && taskId <= 39) {
      categories['חדרים'].push(task)
    }
    // Fallback: try to categorize by name
    else {
      const taskName = task.name.toLowerCase()
      if (taskName.includes('מטבח') || taskName.includes('קפה') || taskName.includes('כלים') || 
          taskName.includes('מקרר') || taskName.includes('תנור') || taskName.includes('כיריים') ||
          taskName.includes('מיקרו') || taskName.includes('כיור') || taskName.includes('סבון') ||
          taskName.includes('סכו') || taskName.includes('פילטר') || taskName.includes('פח')) {
        categories['מטבח'].push(task)
      } else if (taskName.includes('סלון') || taskName.includes('שולחן אוכל') || 
                 taskName.includes('ספה') || taskName.includes('כורסאות') || 
                 taskName.includes('חלונות') || taskName.includes('תריסים')) {
        categories['סלון'].push(task)
      } else if (taskName.includes('מסדרון') || taskName.includes('שטיחים')) {
        categories['מסדרון'].push(task)
      } else if (taskName.includes('חצר') || taskName.includes('מנגל') || 
                 taskName.includes('דשא') || taskName.includes('פחים') || 
                 taskName.includes('ברזים') || taskName.includes('עציצים') ||
                 taskName.includes('רצפה בחוץ')) {
        categories['חצר'].push(task)
      } else if (taskName.includes('חדר')) {
        categories['חדרים'].push(task)
      } else {
        // Default to מטבח if can't determine
        categories['מטבח'].push(task)
      }
    }
  })

  // Return only categories that have tasks, in a specific order
  const orderedCategories: TaskCategory[] = []
  const categoryOrder = ['מטבח', 'סלון', 'מסדרון', 'חצר', 'חדרים']
  
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

