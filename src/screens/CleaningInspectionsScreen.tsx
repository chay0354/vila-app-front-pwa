import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order } from '../types/orders'
import { InspectionMission, InspectionTask, defaultCleaningInspectionTasks } from '../types/inspections'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import InspectionMissionCard from '../components/InspectionMissionCard'
import './CleaningInspectionsScreen.css'

type CleaningInspectionsScreenProps = {
  userName: string
}

function CleaningInspectionsScreen({}: CleaningInspectionsScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [inspectionMissions, setInspectionMissions] = useState<InspectionMission[]>([])

  useEffect(() => {
    // Load orders first, then sync and load cleaning inspections from backend
    // This ensures backend data (with completion status) is loaded before any derivation
    // Sync happens every time the screen opens to ensure cleaning inspections match orders
    const initialize = async () => {
      console.log('Initializing: Loading orders first...')
      await loadOrders()
      console.log('Orders loaded, now syncing and loading cleaning inspections from backend...')
      await loadInspections() // This will sync and then load
      console.log('Initialization complete')
    }
    initialize()
  }, [])

  // Sync cleaning inspections with orders - ensure every departure date has a cleaning inspection and no more
  const syncInspectionsWithOrders = async () => {
    try {
      // Call backend sync endpoint which handles adding and removing cleaning inspections
      // The backend will fetch orders itself, so we don't need to check orders.length
      const res = await fetch(`${API_BASE_URL}/api/cleaning-inspections/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        console.log('Synced cleaning inspections with orders via backend')
      } else {
        console.error('Sync failed with status:', res.status)
      }
    } catch (err) {
      console.error('Error syncing cleaning inspections with orders:', err)
    }
  }

  // Load cleaning inspections from backend - ALWAYS read from cleaning_inspections table
  const loadInspections = async () => {
    console.log('Loading cleaning inspections from backend...')
    
    // First, sync cleaning inspections with orders to ensure all departure dates have cleaning inspections
    await syncInspectionsWithOrders()
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/cleaning-inspections`)
      if (res.ok) {
        const data = await res.json()
        console.log('Backend returned', data?.length || 0, 'cleaning inspections')
        
        // Show all cleaning inspections - one per order (even if same departure date)
        const finalMissions: InspectionMission[] = (data || []).map((insp: any) => {
          const backendTasks = (insp.tasks || []).map((t: any) => ({
            id: String(t.id),
            name: String(t.name || ''),
            completed: Boolean(t.completed),
          }))

          console.log('Loaded cleaning inspection:', insp.id, 'with', backendTasks.length, 'tasks from backend')
          
          // Merge backend tasks with default tasks
          let tasks: InspectionTask[] = []
          if (backendTasks.length === 0) {
            tasks = defaultCleaningInspectionTasks.map(t => ({ ...t }))
          } else {
            const tasksMapById = new Map(backendTasks.map((t: any) => [String(t.id), t]))
            const tasksMapByName = new Map(backendTasks.map((t: any) => [String(t.name).trim().toLowerCase(), t]))
            
            tasks = defaultCleaningInspectionTasks.map(defaultTask => {
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
          
          const departureDate = insp.departure_date || insp.departureDate || ''
          return {
            id: insp.id,
            orderId: insp.order_id || insp.orderId || '',
            unitNumber: insp.unit_number || insp.unitNumber || '',
            guestName: insp.guest_name || insp.guestName || '',
            departureDate,
            status: (insp.status || 'זמן הביקורות טרם הגיע') as InspectionMission['status'],
            tasks,
          }
        })
        console.log('Setting cleaning missions (grouped by departure date):', finalMissions.length, 'missions')
        finalMissions.forEach((m: InspectionMission) => {
          const completedCount = m.tasks.filter((t: InspectionTask) => t.completed).length
          console.log(`  Cleaning mission ${m.id} (${m.departureDate}): ${completedCount}/${m.tasks.length} tasks completed`)
        })
        
        hasLoadedFromBackend.current = true
        setInspectionMissions(finalMissions)
      } else {
        console.warn('Failed to load cleaning inspections:', res.status)
      }
    } catch (err) {
      console.error('Error loading cleaning inspections from backend:', err)
    }
  }

  // Use a ref to track if we've loaded from backend to prevent overwriting
  const hasLoadedFromBackend = useRef(false)
  
  // Sync cleaning inspections when orders change - ensure cleaning_inspections table stays in sync with orders
  // This ensures that when new orders are created or updated, cleaning inspections are automatically synced
  useEffect(() => {
    if (orders.length > 0 && hasLoadedFromBackend.current) {
      // Call backend sync endpoint to ensure all departure dates have cleaning inspections
      const syncWithBackend = async () => {
        try {
          await fetch(`${API_BASE_URL}/api/cleaning-inspections/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          // Reload cleaning inspections after syncing to get the latest data from backend
          await loadInspections()
        } catch (err) {
          console.error('Error syncing cleaning inspections with backend:', err)
          // Fallback to local sync
          syncInspectionsWithOrders().then(() => {
            loadInspections()
          })
        }
      }
      syncWithBackend()
    }
  }, [orders.length]) // Trigger when number of orders changes

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (!res.ok) {
        console.error('Failed to load orders:', res.status)
        return
      }
      const data = await res.json()
      const list = (data || []).map((o: any): Order => ({
        id: o.id,
        guestName: o.guest_name ?? o.guestName ?? '',
        unitNumber: o.unit_number ?? o.unitNumber ?? '',
        arrivalDate: o.arrival_date ?? o.arrivalDate ?? '',
        departureDate: o.departure_date ?? o.departureDate ?? '',
        status: (o.status ?? 'חדש') as Order['status'],
        guestsCount: Number(o.guests_count ?? o.guestsCount ?? 0),
        specialRequests: o.special_requests ?? o.specialRequests ?? '',
        internalNotes: o.internal_notes ?? o.internalNotes ?? '',
        paidAmount: Number(o.paid_amount ?? o.paidAmount ?? 0),
        totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
        paymentMethod: o.payment_method ?? o.paymentMethod ?? 'לא צוין',
      }))
      setOrders(list)
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }


  const handleToggleTask = async (missionId: string, taskId: string) => {
    console.log('=== CLEANING TASK TOGGLED ===', missionId, taskId)
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) return

    const task = mission.tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = mission.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    console.log('Cleaning task toggled:', taskId, 'Old completed:', task.completed, 'New completed:', !task.completed)
    console.log('Updated cleaning tasks count:', updatedTasks.filter(t => t.completed).length, 'completed out of', updatedTasks.length)

    const updatedStatus = computeInspectionStatus({ departureDate: mission.departureDate, tasks: updatedTasks })

    // Update local state immediately (don't save to backend yet)
    setInspectionMissions(prev =>
      prev.map(m => 
        m.id === missionId 
          ? { ...m, tasks: updatedTasks, status: updatedStatus }
          : m
      )
    )
  }

  const handleSave = async (missionId: string) => {
    console.log('=== CLEANING SAVE BUTTON CLICKED ===', missionId)
    // Get the latest mission from current state
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) {
      console.error('Cleaning mission not found:', missionId)
      alert('שגיאה: לא נמצאה משימת ביקורת ניקיון')
      return
    }

    const completedCount = mission.tasks.filter(t => t.completed).length
    console.log('Saving cleaning mission:', missionId, 'with tasks:', mission.tasks.length, 'completed:', completedCount)
    console.log('Cleaning mission tasks before save:', mission.tasks.map(t => ({ id: t.id, name: t.name.substring(0, 20), completed: t.completed })))
    
    // Ensure all tasks have the correct format with boolean completed status
    // IMPORTANT: Match tasks to default tasks to ensure we use the correct IDs
    // This ensures IDs match between saves and loads
    const defaultTasksMap = new Map(defaultCleaningInspectionTasks.map(dt => [dt.name.trim().toLowerCase(), dt]))
    
    const tasksToSave = mission.tasks.map(t => {
      // Find matching default task by name to get the correct ID
      const taskName = String(t.name).trim().toLowerCase()
      const defaultTask = defaultTasksMap.get(taskName)
      const correctId = defaultTask ? String(defaultTask.id) : String(t.id)
      
      return {
        id: correctId, // Use default task ID to ensure consistency
        name: String(t.name),
        completed: Boolean(t.completed), // Ensure it's a boolean
      }
    })
    
    console.log('Cleaning tasks to save:', tasksToSave.map(t => ({ id: t.id, name: t.name, completed: t.completed })))
    console.log('Completed cleaning tasks count:', tasksToSave.filter(t => t.completed).length, 'out of', tasksToSave.length)

    const payload = {
      id: mission.id,
      orderId: mission.orderId,
      unitNumber: mission.unitNumber,
      guestName: mission.guestName,
      departureDate: mission.departureDate,
      status: mission.status,
      tasks: tasksToSave, // Use the properly formatted tasks
    }
    console.log('Cleaning payload being sent:', JSON.stringify(payload, null, 2))
    console.log('Cleaning payload tasks with completion:', payload.tasks.map(t => ({ id: t.id, name: t.name.substring(0, 20), completed: t.completed, completedType: typeof t.completed })))

    // Save the entire cleaning mission with all tasks to backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/cleaning-inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('Error saving cleaning inspection:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          alert(`שגיאה בשמירה: ${errorData.detail || errorText}`)
        } catch {
          alert(`שגיאה בשמירה: ${response.status} ${errorText}`)
        }
        return
      }
      
      const result = await response.json().catch(() => null)
      console.log('Cleaning inspection saved successfully:', missionId)
      console.log('Response from backend:', JSON.stringify(result, null, 2))
      
      // Verify the response contains the tasks and check save status
      if (result && result.tasks) {
        const savedCompleted = result.completedTasksCount || result.tasks.filter((t: any) => t.completed).length
        const savedCount = result.savedTasksCount || result.tasks.length
        const totalCount = result.totalTasksCount || mission.tasks.length
        const failedCount = result.failedTasksCount || 0
        
        console.log('Cleaning save summary:', {
          saved: savedCount,
          total: totalCount,
          failed: failedCount,
          completed: savedCompleted,
          expectedCompleted: completedCount,
          tasksFromBackend: result.tasks.length
        })
        
        // CRITICAL: Verify tasks were actually saved
        if (failedCount > 0) {
          console.error(`ERROR: ${failedCount} cleaning tasks failed to save!`)
          alert(`שגיאה: ${failedCount} משימות נכשלו בשמירה. אנא נסה שוב או בדוק את חיבור האינטרנט.`)
        } else if (savedCount < totalCount) {
          console.error(`ERROR: Only ${savedCount}/${totalCount} cleaning tasks were saved!`)
          console.error('This means some cleaning tasks failed to save to the database.')
          alert(`אזהרה: רק ${savedCount}/${totalCount} משימות נשמרו. חלק מהמשימות לא נשמרו במסד הנתונים.`)
        }
        
        // Always update local state with what backend returned (even if counts don't match)
        // This ensures we show what was actually saved
        const savedTasks = result.tasks.map((t: any) => ({
          id: String(t.id),
          name: String(t.name),
          completed: Boolean(t.completed),
        }))
        
        console.log('Updating local state with saved cleaning tasks:', savedTasks.map((t: any) => ({ id: t.id, completed: t.completed })))
        
        // CRITICAL: Reload cleaning inspections from backend to ensure we have the latest data for ALL cleaning inspections
        // This fixes the issue where the second cleaning inspection doesn't persist after refresh
        console.log('Reloading ALL cleaning inspections from backend after save...')
        await loadInspections()
        
        if (savedCount === totalCount && savedCompleted === completedCount) {
          alert(`נשמר בהצלחה! ${completedCount}/${totalCount} משימות הושלמו`)
        } else if (savedCount < totalCount) {
          console.warn('Warning: Not all cleaning tasks were saved:', savedCount, 'of', totalCount)
          alert(`נשמר חלקית: ${savedCount}/${totalCount} משימות נשמרו. ${savedCompleted} הושלמו.`)
        } else {
          console.warn('Warning: Saved completion count does not match:', savedCompleted, 'vs', completedCount)
          alert(`נשמר, אך יש לבדוק: ${savedCompleted}/${totalCount} משימות הושלמו (צפוי: ${completedCount})`)
        }
      } else {
        console.error('Backend response missing cleaning tasks:', result)
        alert('נשמר, אך לא ניתן לאמת את השמירה - תגובת השרת לא כוללת משימות')
      }
    } catch (err: any) {
      console.error('Error saving cleaning inspection to backend:', err)
      alert(`שגיאה בשמירה: ${err.message || 'נסה שוב'}`)
    }
  }

  // Sort missions by departure date
  const sortedMissions = useMemo(() => {
    return [...inspectionMissions].sort((a, b) => {
      const aStatus = computeInspectionStatus(a)
      const bStatus = computeInspectionStatus(b)
      const aIsClosed = aStatus === 'הביקורת הושלמה'
      const bIsClosed = bStatus === 'הביקורת הושלמה'
      
      // Put closed missions at the bottom
      if (aIsClosed && !bIsClosed) return 1
      if (!aIsClosed && bIsClosed) return -1
      
      // For same status, sort by date
      return (a.departureDate || '').localeCompare(b.departureDate || '')
    })
  }, [inspectionMissions])

  return (
    <div className="cleaning-inspections-container">
      <div className="cleaning-inspections-header">
        <div className="cleaning-inspections-top-row">
          <div className="cleaning-inspections-brand-badge">
            <div className="cleaning-inspections-brand-dot" />
            <span className="cleaning-inspections-brand-text">Seisignes</span>
          </div>
          <button className="cleaning-inspections-back-button" onClick={() => navigate('/hub')}>
            ← חזרה
          </button>
        </div>
      </div>
      <div className="cleaning-inspections-scroll">
        {/* Hotel name - show from first mission or most common */}
        {sortedMissions.length > 0 && sortedMissions[0].unitNumber && (
          <div className="cleaning-inspections-hotel-name">
            <h2 className="cleaning-inspections-hotel-name-text">
              {sortedMissions[0].unitNumber}
            </h2>
          </div>
        )}
        
        <div className="cleaning-inspections-title-section">
          <div>
            <h1 className="cleaning-inspections-title">ביקורת ניקיון מנקה</h1>
          </div>
        </div>

        {sortedMissions.length === 0 ? (
          <div className="cleaning-inspections-empty-state">
            <p className="cleaning-inspections-empty-state-text">אין משימות ביקורת ניקיון כרגע</p>
          </div>
        ) : (
          <div className="cleaning-inspections-missions-list">
            {sortedMissions.map(mission => (
              <InspectionMissionCard
                key={mission.id}
                mission={mission}
                onToggleTask={handleToggleTask}
                onSave={handleSave}
                isCleaningInspection={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CleaningInspectionsScreen

