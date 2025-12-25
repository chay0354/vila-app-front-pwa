import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order } from '../types/orders'
import { InspectionMission, InspectionTask, defaultInspectionTasks } from '../types/inspections'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import InspectionMissionCard from '../components/InspectionMissionCard'
import './ExitInspectionsScreen.css'

type ExitInspectionsScreenProps = {
  userName: string
}

function ExitInspectionsScreen({}: ExitInspectionsScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [inspectionMissions, setInspectionMissions] = useState<InspectionMission[]>([])

  useEffect(() => {
    // Load orders first, then inspections from backend
    // This ensures backend data (with completion status) is loaded before any derivation
    const initialize = async () => {
      console.log('Initializing: Loading orders first...')
      await loadOrders()
      console.log('Orders loaded, now loading inspections from backend...')
      await loadInspections() // This will set hasLoadedFromBackend.current = true
      console.log('Initialization complete')
    }
    initialize()
  }, [])

  // Load inspections from backend
  const loadInspections = async () => {
    console.log('Loading inspections from backend...')
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspections`)
      if (res.ok) {
        const data = await res.json()
        console.log('Backend returned', data?.length || 0, 'inspections')
        const loadedMissions: InspectionMission[] = (data || []).map((insp: any) => {
          const backendTasks = (insp.tasks || []).map((t: any) => ({
            id: String(t.id), // Ensure ID is a string
            name: String(t.name || ''),
            completed: Boolean(t.completed), // Ensure it's a boolean, not string
          }))
          
        console.log('Loaded inspection:', insp.id, 'with', backendTasks.length, 'tasks from backend')
        console.log('Backend tasks:', backendTasks.map((t: any) => ({ id: t.id, name: t.name, completed: t.completed })))
          
          // If no tasks from backend, use default tasks
          // Otherwise, merge backend tasks with default tasks to ensure all tasks are present
          let tasks: InspectionTask[] = []
          if (backendTasks.length === 0) {
            // No tasks in backend, use all default tasks
            tasks = defaultInspectionTasks.map(t => ({ ...t }))
          } else {
            // Merge: use backend tasks for completion status, but ensure all default tasks are present
            // Match by ID first, then by name as fallback (in case IDs don't match)
            const tasksMapById = new Map(backendTasks.map((t: any) => [String(t.id), t]))
            const tasksMapByName = new Map(backendTasks.map((t: any) => [String(t.name).trim().toLowerCase(), t]))
            
            tasks = defaultInspectionTasks.map(defaultTask => {
              // Try to find by ID first
              let backendTask: any = tasksMapById.get(String(defaultTask.id))
              
              // If not found by ID, try to find by name (case-insensitive, trimmed)
              if (!backendTask) {
                const defaultTaskName = String(defaultTask.name).trim().toLowerCase()
                backendTask = tasksMapByName.get(defaultTaskName)
              }
              
              if (backendTask) {
                // Use backend task (preserves completion status)
                // Make sure we preserve the completion status from backend
                const completed = Boolean(backendTask.completed)
                console.log(`Task ${defaultTask.id} (${defaultTask.name}): completed=${completed} from backend (matched by ${tasksMapById.has(String(defaultTask.id)) ? 'ID' : 'name'})`)
                return { 
                  id: String(defaultTask.id), // Always use default task ID to ensure consistency
                  name: String(backendTask.name || defaultTask.name),
                  completed: completed // Ensure it's a boolean
                }
              } else {
                // Default task not in backend, add it as incomplete
                console.log(`Task ${defaultTask.id} (${defaultTask.name}): not in backend, using default (incomplete)`)
                return { ...defaultTask }
              }
            })
            
        console.log('Final merged tasks:', tasks.map(t => ({ id: t.id, name: t.name, completed: t.completed })))
          }
          
          return {
            id: insp.id,
            orderId: insp.order_id || insp.orderId || '',
            unitNumber: insp.unit_number || insp.unitNumber || '',
            guestName: insp.guest_name || insp.guestName || '',
            departureDate: insp.departure_date || insp.departureDate || '',
            status: (insp.status || 'זמן הביקורות טרם הגיע') as InspectionMission['status'],
            tasks,
          }
        })
        
        if (loadedMissions.length > 0) {
          hasLoadedFromBackend.current = true
          // Deduplicate missions by ID to prevent duplicates
          const missionsMap = new Map<string, InspectionMission>()
          loadedMissions.forEach(m => missionsMap.set(m.id, m))
          
          // Add missing missions for orders that don't have inspections yet
          if (orders.length > 0) {
            orders
              .filter(o => o.status !== 'בוטל')
              .forEach(o => {
                // Check if we already have a mission for this order (by orderId or by inspection ID)
                const existingByOrderId = Array.from(missionsMap.values()).find(m => m.orderId === o.id)
                const inspectionId = `INSP-${o.id}`
                const existingById = missionsMap.get(inspectionId)
                
                // Only add if this order doesn't have an inspection yet
                if (!existingByOrderId && !existingById) {
                  const tasks = defaultInspectionTasks.map(t => ({ ...t }))
                  missionsMap.set(inspectionId, {
                    id: inspectionId,
                    orderId: o.id,
                    unitNumber: o.unitNumber,
                    guestName: o.guestName,
                    departureDate: o.departureDate,
                    tasks,
                    status: computeInspectionStatus({ departureDate: o.departureDate, tasks }),
                  })
                }
              })
          }
          
          // Convert map back to array (deduplicated by ID)
          const deduplicatedMissions = Array.from(missionsMap.values())
          console.log('Setting missions (deduplicated):', deduplicatedMissions.length, 'missions')
          deduplicatedMissions.forEach(m => {
            const completedCount = m.tasks.filter(t => t.completed).length
            console.log(`  Mission ${m.id}: ${completedCount}/${m.tasks.length} tasks completed`)
          })
          setInspectionMissions(deduplicatedMissions)
          return
        } else {
          console.log('No missions loaded from backend (empty array)')
        }
      }
    } catch (err) {
      console.warn('Error loading inspections from backend:', err)
      // Only fallback to deriving from orders if we haven't loaded from backend
      if (orders.length > 0 && !hasLoadedFromBackend.current) {
        console.log('Backend load failed, falling back to derive from orders')
        deriveMissionsFromOrders()
      }
    }
  }

  // Reconcile missions from orders (fallback if backend has no data)
  // IMPORTANT: This should ONLY be called if backend has no data
  // It should NOT overwrite missions loaded from backend
  const deriveMissionsFromOrders = async () => {
    // Only derive if we haven't loaded from backend yet
    if (hasLoadedFromBackend.current) {
      console.log('Skipping deriveMissionsFromOrders - already loaded from backend')
      return
    }
    
    setInspectionMissions(prev => {
      const prevByOrderId = new Map<string, InspectionMission>()
      prev.forEach(m => prevByOrderId.set(m.orderId, m))

      const next: InspectionMission[] = []
      const newMissions: InspectionMission[] = []
      
      orders
        .filter(o => o.status !== 'בוטל')
        .forEach(o => {
          const existing = prevByOrderId.get(o.id)
          const isNew = !existing
          
          // Ensure tasks are always populated with all default tasks
          let tasks: InspectionTask[] = []
          if (existing?.tasks?.length) {
            // Merge existing tasks with default tasks to ensure all are present
            const tasksMap = new Map(existing.tasks.map(t => [t.id, t]))
            tasks = defaultInspectionTasks.map(defaultTask => {
              const existingTask = tasksMap.get(defaultTask.id)
              if (existingTask) {
                // Use existing task (preserves completion status)
                return { ...existingTask }
              } else {
                // Default task not in existing, add it as incomplete
                return { ...defaultTask }
              }
            })
          } else {
            // No existing tasks, use all default tasks
            tasks = defaultInspectionTasks.map(t => ({ ...t }))
          }
          
          const mission: InspectionMission = {
            id: existing?.id || `INSP-${o.id}`,
            orderId: o.id,
            unitNumber: o.unitNumber,
            guestName: o.guestName,
            departureDate: o.departureDate,
            tasks,
            status: computeInspectionStatus({ departureDate: o.departureDate, tasks }),
          }
          next.push(mission)
          if (isNew) {
            newMissions.push(mission)
          }
        })

      // Save new missions to backend
      if (newMissions.length > 0) {
        newMissions.forEach(async (mission) => {
          try {
            await fetch(`${API_BASE_URL}/api/inspections`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: mission.id,
                orderId: mission.orderId,
                unitNumber: mission.unitNumber,
                guestName: mission.guestName,
                departureDate: mission.departureDate,
                status: mission.status,
                tasks: mission.tasks,
              }),
            })
          } catch (err) {
            console.error('Error saving new inspection to backend:', err)
          }
        })
      }

      return next
    })
  }

  // Use a ref to track if we've loaded from backend to prevent overwriting
  const hasLoadedFromBackend = useRef(false)
  
  // Always sync missions from orders to ensure every order has an inspection
  // This ensures that when new orders are created, inspections are automatically created
  // BUT: Don't overwrite missions that were loaded from backend - they have saved completion status
  useEffect(() => {
    if (orders.length > 0 && inspectionMissions.length > 0) {
      // Only add missing missions, don't overwrite existing ones
      // Deduplicate by ID to prevent duplicates
      setInspectionMissions(prev => {
        const missionsMap = new Map<string, InspectionMission>()
        // First, add all existing missions (deduplicated by ID)
        prev.forEach(m => {
          if (!missionsMap.has(m.id)) {
            missionsMap.set(m.id, m)
          }
        })
        
        // Then add missing missions for orders
        orders
          .filter(o => o.status !== 'בוטל')
          .forEach(o => {
            // Check if we already have a mission for this order
            const existingByOrderId = Array.from(missionsMap.values()).find(m => m.orderId === o.id)
            const inspectionId = `INSP-${o.id}`
            const existingById = missionsMap.get(inspectionId)
            
            // Only add if this order doesn't have an inspection yet
            if (!existingByOrderId && !existingById) {
              const tasks = defaultInspectionTasks.map(t => ({ ...t }))
              missionsMap.set(inspectionId, {
                id: inspectionId,
                orderId: o.id,
                unitNumber: o.unitNumber,
                guestName: o.guestName,
                departureDate: o.departureDate,
                tasks,
                status: computeInspectionStatus({ departureDate: o.departureDate, tasks }),
              })
            }
          })
        
        // Convert map back to array (deduplicated)
        return Array.from(missionsMap.values())
      })
    } else if (orders.length > 0 && inspectionMissions.length === 0 && !hasLoadedFromBackend.current) {
      // Only derive if we have no missions at all AND haven't loaded from backend
      // This is a fallback for when backend has no data
      // BUT: Wait a bit to ensure backend load has a chance to complete first
      const timeoutId = setTimeout(() => {
        if (!hasLoadedFromBackend.current && inspectionMissions.length === 0) {
          console.log('No missions loaded from backend after delay, deriving from orders as fallback')
          deriveMissionsFromOrders()
        }
      }, 1000) // Wait 1 second for backend load to complete
      
      return () => clearTimeout(timeoutId)
    }
  }, [orders, inspectionMissions.length])

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
    console.log('=== TASK TOGGLED ===', missionId, taskId)
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) return

    const task = mission.tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTasks = mission.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    console.log('Task toggled:', taskId, 'Old completed:', task.completed, 'New completed:', !task.completed)
    console.log('Updated tasks count:', updatedTasks.filter(t => t.completed).length, 'completed out of', updatedTasks.length)

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
    console.log('=== SAVE BUTTON CLICKED ===', missionId)
    // Get the latest mission from current state
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) {
      console.error('Mission not found:', missionId)
      alert('שגיאה: לא נמצאה משימת ביקורת')
      return
    }

    const completedCount = mission.tasks.filter(t => t.completed).length
    console.log('Saving mission:', missionId, 'with tasks:', mission.tasks.length, 'completed:', completedCount)
    console.log('Mission tasks before save:', mission.tasks.map(t => ({ id: t.id, name: t.name.substring(0, 20), completed: t.completed })))
    
    // Ensure all tasks have the correct format with boolean completed status
    // IMPORTANT: Match tasks to default tasks to ensure we use the correct IDs
    // This ensures IDs match between saves and loads
    const defaultTasksMap = new Map(defaultInspectionTasks.map(dt => [dt.name.trim().toLowerCase(), dt]))
    
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
    
    console.log('Tasks to save:', tasksToSave.map(t => ({ id: t.id, name: t.name, completed: t.completed })))
    console.log('Completed tasks count:', tasksToSave.filter(t => t.completed).length, 'out of', tasksToSave.length)

    const payload = {
      id: mission.id,
      orderId: mission.orderId,
      unitNumber: mission.unitNumber,
      guestName: mission.guestName,
      departureDate: mission.departureDate,
      status: mission.status,
      tasks: tasksToSave, // Use the properly formatted tasks
    }
    console.log('Payload being sent:', JSON.stringify(payload, null, 2))
    console.log('Payload tasks with completion:', payload.tasks.map(t => ({ id: t.id, name: t.name.substring(0, 20), completed: t.completed, completedType: typeof t.completed })))

    // Save the entire mission with all tasks to backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('Error saving inspection:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          alert(`שגיאה בשמירה: ${errorData.detail || errorText}`)
        } catch {
          alert(`שגיאה בשמירה: ${response.status} ${errorText}`)
        }
        return
      }
      
      const result = await response.json().catch(() => null)
      console.log('Inspection saved successfully:', missionId)
      console.log('Response from backend:', JSON.stringify(result, null, 2))
      
      // Verify the response contains the tasks and check save status
      if (result && result.tasks) {
        const savedCompleted = result.completedTasksCount || result.tasks.filter((t: any) => t.completed).length
        const savedCount = result.savedTasksCount || result.tasks.length
        const totalCount = result.totalTasksCount || mission.tasks.length
        const failedCount = result.failedTasksCount || 0
        
        console.log('Save summary:', {
          saved: savedCount,
          total: totalCount,
          failed: failedCount,
          completed: savedCompleted,
          expectedCompleted: completedCount,
          tasksFromBackend: result.tasks.length
        })
        
        // CRITICAL: Verify tasks were actually saved
        if (failedCount > 0) {
          console.error(`ERROR: ${failedCount} tasks failed to save!`)
          alert(`שגיאה: ${failedCount} משימות נכשלו בשמירה. אנא נסה שוב או בדוק את חיבור האינטרנט.`)
        } else if (savedCount < totalCount) {
          console.error(`ERROR: Only ${savedCount}/${totalCount} tasks were saved!`)
          console.error('This means some tasks failed to save to the database.')
          alert(`אזהרה: רק ${savedCount}/${totalCount} משימות נשמרו. חלק מהמשימות לא נשמרו במסד הנתונים.`)
        }
        
        // Always update local state with what backend returned (even if counts don't match)
        // This ensures we show what was actually saved
        const savedTasks = result.tasks.map((t: any) => ({
          id: String(t.id),
          name: String(t.name),
          completed: Boolean(t.completed),
        }))
        
        console.log('Updating local state with saved tasks:', savedTasks.map((t: any) => ({ id: t.id, completed: t.completed })))
        
        // CRITICAL: Reload inspections from backend to ensure we have the latest data for ALL inspections
        // This fixes the issue where the second inspection doesn't persist after refresh
        console.log('Reloading ALL inspections from backend after save...')
        await loadInspections()
        
        if (savedCount === totalCount && savedCompleted === completedCount) {
          alert(`נשמר בהצלחה! ${completedCount}/${totalCount} משימות הושלמו`)
        } else if (savedCount < totalCount) {
          console.warn('Warning: Not all tasks were saved:', savedCount, 'of', totalCount)
          alert(`נשמר חלקית: ${savedCount}/${totalCount} משימות נשמרו. ${savedCompleted} הושלמו.`)
        } else {
          console.warn('Warning: Saved completion count does not match:', savedCompleted, 'vs', completedCount)
          alert(`נשמר, אך יש לבדוק: ${savedCompleted}/${totalCount} משימות הושלמו (צפוי: ${completedCount})`)
        }
      } else {
        console.error('Backend response missing tasks:', result)
        alert('נשמר, אך לא ניתן לאמת את השמירה - תגובת השרת לא כוללת משימות')
      }
    } catch (err: any) {
      console.error('Error saving inspection to backend:', err)
      alert(`שגיאה בשמירה: ${err.message || 'נסה שוב'}`)
    }
  }

  // Sort missions by departure date
  const sortedMissions = useMemo(() => {
    return [...inspectionMissions].sort((a, b) =>
      (a.departureDate || '').localeCompare(b.departureDate || '')
    )
  }, [inspectionMissions])

  return (
    <div className="exit-inspections-container">
      <div className="exit-inspections-header">
        <button className="exit-inspections-back-button" onClick={() => navigate('/inspections')}>
          ← חזרה
        </button>
      </div>
      <div className="exit-inspections-scroll">
        <div className="exit-inspections-title-section">
          <div>
            <h1 className="exit-inspections-title">ביקורת יציאת אורח</h1>
            <p className="exit-inspections-subtitle">
              ניהול משימות ניקיון וביקורת לאחר עזיבת אורחים
            </p>
          </div>
          <div className="exit-inspections-stats-badge">
            <span className="exit-inspections-stats-badge-text">
              {sortedMissions.length} משימות
            </span>
          </div>
        </div>

        {sortedMissions.length === 0 ? (
          <div className="exit-inspections-empty-state">
            <p className="exit-inspections-empty-state-text">אין משימות ביקורת כרגע</p>
          </div>
        ) : (
          <div className="exit-inspections-missions-list">
            {sortedMissions.map(mission => (
              <InspectionMissionCard
                key={mission.id}
                mission={mission}
                onToggleTask={handleToggleTask}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExitInspectionsScreen

