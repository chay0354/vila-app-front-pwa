import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { InspectionMission, InspectionTask, defaultMonthlyInspectionTasks } from '../types/inspections'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import InspectionMissionCard from '../components/InspectionMissionCard'
import './MonthlyInspectionsScreen.css'

type MonthlyInspectionsScreenProps = {
  userName: string
}

function MonthlyInspectionsScreen({}: MonthlyInspectionsScreenProps) {
  const navigate = useNavigate()
  const [inspectionMissions, setInspectionMissions] = useState<InspectionMission[]>([])

  useEffect(() => {
    loadInspections()
  }, [])

  const syncMonthlyInspections = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/monthly-inspections/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        console.log('Synced monthly inspections via backend')
      } else {
        console.error('Monthly inspections sync failed with status:', res.status)
      }
    } catch (err) {
      console.error('Error syncing monthly inspections:', err)
    }
  }

  const loadInspections = async () => {
    console.log('Loading monthly inspections from backend...')
    
    // First, sync monthly inspections to ensure all hotels have inspections for current and next month
    await syncMonthlyInspections()
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/monthly-inspections`)
      console.log('Monthly inspections response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Backend returned', data?.length || 0, 'monthly inspections')
        if (data && data.length > 0) {
          console.log('Sample inspection:', JSON.stringify(data[0], null, 2))
        } else {
          console.warn('WARNING: Backend returned empty array for monthly inspections')
        }
        
        const loadedMissions: InspectionMission[] = (data || []).map((insp: any) => {
          const backendTasks = (insp.tasks || []).map((t: any) => ({
            id: String(t.id),
            name: String(t.name || ''),
            completed: Boolean(t.completed),
          }))
          
          // Merge backend tasks with default tasks
          let tasks: InspectionTask[] = []
          if (backendTasks.length === 0) {
            tasks = defaultMonthlyInspectionTasks.map(t => ({ ...t }))
          } else {
            const tasksMapById = new Map(backendTasks.map((t: any) => [String(t.id), t]))
            const tasksMapByName = new Map(backendTasks.map((t: any) => [String(t.name).trim().toLowerCase(), t]))
            
            tasks = defaultMonthlyInspectionTasks.map(defaultTask => {
              let backendTask: any = tasksMapById.get(String(defaultTask.id))
              if (!backendTask) {
                const defaultTaskName = String(defaultTask.name).trim().toLowerCase()
                backendTask = tasksMapByName.get(defaultTaskName)
              }
              
              if (backendTask) {
                return { 
                  id: String(defaultTask.id),
                  name: String(backendTask.name || defaultTask.name),
                  completed: Boolean(backendTask.completed)
                }
              } else {
                return { ...defaultTask }
              }
            })
          }
          
          // For monthly inspections, use inspectionMonth as departureDate for compatibility
          const inspectionMonth = insp.inspectionMonth || insp.inspection_month || ''
          
          return {
            id: insp.id,
            orderId: '', // Monthly inspections don't have order IDs
            unitNumber: insp.unitNumber || insp.unit_number || '',
            guestName: '', // Monthly inspections don't have guest names
            departureDate: inspectionMonth, // Use month as date for compatibility
            status: (insp.status || 'זמן הביקורות טרם הגיע') as InspectionMission['status'],
            tasks,
          }
        })
        
        // Sort by month, then by unit number
        loadedMissions.sort((a, b) => {
          const monthCompare = (a.departureDate || '').localeCompare(b.departureDate || '')
          if (monthCompare !== 0) return monthCompare
          return (a.unitNumber || '').localeCompare(b.unitNumber || '')
        })
        
        setInspectionMissions(loadedMissions)
        console.log('Loaded', loadedMissions.length, 'monthly inspection missions')
      } else {
        console.error('Failed to load monthly inspections:', res.status)
      }
    } catch (err) {
      console.error('Error loading monthly inspections:', err)
    }
  }

  const handleToggleTask = async (missionId: string, taskId: string) => {
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) return

    const task = mission.tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = mission.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )

    const updatedStatus = computeInspectionStatus({ departureDate: mission.departureDate, tasks: updatedTasks })

    // Update local state immediately
    setInspectionMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, tasks: updatedTasks, status: updatedStatus } : m))
    )
  }

  const handleSave = async (missionId: string) => {
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) {
      console.error('Mission not found:', missionId)
      alert('לא נמצאה משימת ביקורת')
      return
    }

    const completedCount = mission.tasks.filter(t => t.completed).length
    console.log('Saving monthly inspection mission:', missionId, 'with tasks:', mission.tasks.length, 'completed:', completedCount)
    
    const defaultTasksMap = new Map(defaultMonthlyInspectionTasks.map(dt => [dt.name.trim().toLowerCase(), dt]))
    
    const tasksToSave = mission.tasks.map(t => {
      const taskName = String(t.name).trim().toLowerCase()
      const defaultTask = defaultTasksMap.get(taskName)
      const correctId = defaultTask ? String(defaultTask.id) : String(t.id)
      
      return {
        id: correctId,
        name: String(t.name),
        completed: Boolean(t.completed),
      }
    })
    
    try {
      const payload = {
        id: mission.id,
        unitNumber: mission.unitNumber,
        inspectionMonth: mission.departureDate, // Use departureDate as inspectionMonth
        status: mission.status,
        tasks: tasksToSave,
      }
      
      const response = await fetch(`${API_BASE_URL}/api/monthly-inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('Error saving monthly inspection:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          alert(`שגיאה בשמירה: ${errorData.detail || errorText}`)
        } catch {
          alert(`שגיאה בשמירה: ${response.status} ${errorText}`)
        }
        return
      }
      
      const result = await response.json().catch(() => null)
      console.log('Monthly inspection saved successfully:', missionId)
      
      if (result && result.tasks) {
        const savedCompleted = result.completedTasksCount || result.tasks.filter((t: any) => t.completed).length
        const savedCount = result.savedTasksCount || result.tasks.length
        const totalCount = result.totalTasksCount || mission.tasks.length
        
        await loadInspections()
        
        if (savedCount === totalCount && savedCompleted === completedCount) {
          alert(`נשמר בהצלחה! ${completedCount}/${totalCount} משימות הושלמו`)
        } else if (savedCount < totalCount) {
          alert(`נשמר חלקית: ${savedCount}/${totalCount} משימות נשמרו. ${savedCompleted} הושלמו.`)
        } else {
          alert(`נשמר, אך יש לבדוק: ${savedCompleted}/${totalCount} משימות הושלמו (צפוי: ${completedCount})`)
        }
      } else {
        alert('נשמר, אך לא ניתן לאמת את השמירה - תגובת השרת לא כוללת משימות')
      }
    } catch (err: any) {
      console.error('Error saving monthly inspection to backend:', err)
      alert(`שגיאה בשמירה: ${err.message || 'נסה שוב'}`)
    }
  }

  // Format month for display (YYYY-MM-DD -> "חודש עברי YYYY")
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return ''
    try {
      // monthStr is in format "YYYY-MM-01", parse components directly
      const parts = monthStr.split('-')
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Convert to 0-11
        
        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
          console.warn('Invalid date format:', monthStr)
          return monthStr
        }
        
        const hebrewMonths = [
          'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
          'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ]
        
        return `${hebrewMonths[month]} ${year}`
      } else {
        // Fallback: try Date parsing
        const date = new Date(monthStr + 'T00:00:00')
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = date.getMonth()
          const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
          ]
          return `${hebrewMonths[month]} ${year}`
        }
        return monthStr
      }
    } catch (err) {
      console.error('Error formatting month:', monthStr, err)
      return monthStr
    }
  }

  // Get current month and next month
  const getCurrentAndNextMonth = () => {
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    
    const formatMonthKey = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
    }
    
    return {
      currentMonthKey: formatMonthKey(currentMonth),
      nextMonthKey: formatMonthKey(nextMonth),
      currentMonthLabel: formatMonth(formatMonthKey(currentMonth)),
      nextMonthLabel: formatMonth(formatMonthKey(nextMonth)),
    }
  }

  const { currentMonthKey, nextMonthKey, currentMonthLabel, nextMonthLabel } = getCurrentAndNextMonth()

  // Group missions by month
  const currentMonthMissions = inspectionMissions
    .filter(m => m.departureDate === currentMonthKey)
    .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''))
  
  const nextMonthMissions = inspectionMissions
    .filter(m => m.departureDate === nextMonthKey)
    .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''))

  return (
    <div className="monthly-inspections-screen">
      <div className="monthly-inspections-header">
        <button className="back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
      </div>
      <div className="monthly-inspections-scroll">
        <div className="monthly-inspections-title-section">
          <div>
            <h1 className="monthly-inspections-title">ביקורות חודשיות</h1>
            <p className="monthly-inspections-subtitle">
              ביקורת תקינות חודשית לכל מלון - חודש נוכחי וחודש הבא
            </p>
          </div>
          <div className="monthly-inspections-stats-badge">
            <span className="monthly-inspections-stats-text">{inspectionMissions.length} משימות</span>
          </div>
        </div>

        {inspectionMissions.length === 0 ? (
          <div className="monthly-inspections-empty-state">
            <p className="monthly-inspections-empty-text">אין משימות ביקורת חודשית כרגע</p>
          </div>
        ) : (
          <>
            {/* Current Month Section */}
            <div className="monthly-inspections-month-section">
              <h2 className="monthly-inspections-month-title">
                חודש נוכחי - {currentMonthLabel}
              </h2>
              {currentMonthMissions.length === 0 ? (
                <div className="monthly-inspections-empty-state">
                  <p className="monthly-inspections-empty-text">אין ביקורות לחודש זה</p>
                </div>
              ) : (
                <div className="monthly-inspections-missions-list">
                  {currentMonthMissions.map(mission => (
                    <InspectionMissionCard
                      key={mission.id}
                      mission={{
                        ...mission,
                        guestName: mission.unitNumber || '', // Show only unit name
                      }}
                      onToggleTask={handleToggleTask}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Next Month Section */}
            <div className="monthly-inspections-month-section">
              <h2 className="monthly-inspections-month-title">
                חודש הבא - {nextMonthLabel}
              </h2>
              {nextMonthMissions.length === 0 ? (
                <div className="monthly-inspections-empty-state">
                  <p className="monthly-inspections-empty-text">אין ביקורות לחודש זה</p>
                </div>
              ) : (
                <div className="monthly-inspections-missions-list">
                  {nextMonthMissions.map(mission => (
                    <InspectionMissionCard
                      key={mission.id}
                      mission={{
                        ...mission,
                        guestName: mission.unitNumber || '', // Show only unit name
                      }}
                      onToggleTask={handleToggleTask}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MonthlyInspectionsScreen

