import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { MaintenanceUnit, MaintenanceTask } from '../types/maintenance'
import { getInitialMaintenanceUnits, normalizeMaintenanceUnitId } from '../utils/maintenanceUtils'
import './MaintenanceTasksScreen.css'

type MaintenanceTasksScreenProps = {
  userName: string
}

function MaintenanceTasksScreen({}: MaintenanceTasksScreenProps) {
  const navigate = useNavigate()
  const { unitId } = useParams<{ unitId: string }>()
  const [unit, setUnit] = useState<MaintenanceUnit | null>(null)
  const [systemUsers, setSystemUsers] = useState<Array<{ id: string; username: string }>>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')

  useEffect(() => {
    loadSystemUsers()
    loadMaintenanceUnits()
  }, [unitId])

  const loadSystemUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`)
      if (!res.ok) return
      const data = await res.json()
      setSystemUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Error loading system users', err)
    }
  }

  const loadMaintenanceUnits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) {
        navigate('/maintenance')
        return
      }
      const data = (await res.json()) || []

      const baseUnits = getInitialMaintenanceUnits()
      const byId = new Map<string, MaintenanceUnit>()
      baseUnits.forEach(u => byId.set(u.id, u))

      ;(data || []).forEach((t: any) => {
        const taskUnitId = normalizeMaintenanceUnitId(t.unit_id || t.unitId || t.unit)
        const taskUnit = byId.get(taskUnitId) || byId.get('unit-1')
        if (!taskUnit) return

        const task: MaintenanceTask = {
          id: (t.id || `task-${Date.now()}`).toString(),
          unitId: taskUnitId,
          title: (t.title || '').toString(),
          description: (t.description || '').toString(),
          status: (t.status || 'פתוח') as MaintenanceTask['status'],
          createdDate: (t.created_date || t.createdDate || new Date().toISOString().split('T')[0]).toString(),
          assignedTo: (t.assigned_to || t.assignedTo || undefined)?.toString(),
          imageUri: (t.image_uri || t.imageUri || undefined)?.toString(),
          room: (t.room || undefined)?.toString(),
        }

        taskUnit.tasks.push(task)
      })

      baseUnits.forEach(u => {
        u.tasks.sort((a: MaintenanceTask, b: MaintenanceTask) => (b.createdDate || '').localeCompare(a.createdDate || ''))
      })

      const foundUnit = baseUnits.find(u => u.id === unitId)
      if (!foundUnit) {
        navigate('/maintenance')
        return
      }
      setUnit(foundUnit)
    } catch (err) {
      console.error('Error loading maintenance units:', err)
      navigate('/maintenance')
    }
  }

  const resolveAssignee = (assignedTo?: string | null) => {
    if (!assignedTo) return ''
    const user = systemUsers.find(u => u.id.toString() === assignedTo.toString())
    return user?.username || assignedTo
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פתוח':
        return '#f59e0b'
      case 'בטיפול':
        return '#3b82f6'
      case 'סגור':
        return '#22c55e'
      default:
        return '#64748b'
    }
  }

  if (!unit) {
    return (
      <div className="maintenance-tasks-container">
        <div className="maintenance-tasks-header">
          <button className="maintenance-tasks-back-button" onClick={() => navigate('/maintenance')}>
            ← חזרה
          </button>
        </div>
        <div className="maintenance-tasks-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="maintenance-tasks-container">
      <div className="maintenance-tasks-header">
        <button className="maintenance-tasks-back-button" onClick={() => navigate('/maintenance')}>
          ← חזרה
        </button>
      </div>
      <div className="maintenance-tasks-scroll">
        <div className="maintenance-tasks-title-section">
          <div>
            <h1 className="maintenance-tasks-title">{unit.name}</h1>
            <p className="maintenance-tasks-subtitle">משימות תחזוקה - {unit.tasks.length} משימות</p>
          </div>
        </div>

        <div className="maintenance-tasks-header-row">
          <div className="maintenance-tasks-filter">
            <button
              className={`maintenance-tasks-filter-button ${filter === 'closed' ? 'active' : ''}`}
              onClick={() => setFilter('closed')}
              type="button"
            >
              קריאות סגורות
            </button>
            <button
              className={`maintenance-tasks-filter-button ${filter === 'open' ? 'active' : ''}`}
              onClick={() => setFilter('open')}
              type="button"
            >
              קריאות פתוחות
            </button>
            <button
              className={`maintenance-tasks-filter-button ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              type="button"
            >
              סה״כ קריאות
            </button>
          </div>
        </div>

        {(() => {
          const today = new Date().toISOString().split('T')[0];
          
          const filteredTasks = filter === 'all' 
            ? unit.tasks 
            : filter === 'open' 
            ? unit.tasks.filter(t => t.status === 'פתוח')
            : unit.tasks.filter(t => t.status === 'סגור')
          
          // Separate tasks into "opened today" and "not today"
          const tasksOpenedToday = filteredTasks.filter(t => t.createdDate === today);
          const tasksNotToday = filteredTasks.filter(t => t.createdDate !== today);
          
          if (filteredTasks.length === 0) {
            return (
              <div className="maintenance-tasks-empty-state">
                <p className="maintenance-tasks-empty-state-text">אין משימות תחזוקה ליחידה זו</p>
              </div>
            );
          }
          
          const renderTaskCard = (task: MaintenanceTask) => (
            <div
              key={task.id}
              className="maintenance-task-card"
              onClick={() => navigate(`/maintenance/${unit.id}/tasks/${task.id}`)}
            >
              <div className="maintenance-task-card-header">
                <div className="maintenance-task-card-badges">
                  <span
                    className="maintenance-task-status-badge"
                    style={{
                      backgroundColor: getStatusColor(task.status) + '22',
                      color: getStatusColor(task.status),
                    }}
                  >
                    {task.status}
                  </span>
                  {task.room && (
                    <span className="maintenance-task-room-badge">
                      חדר {task.room}
                    </span>
                  )}
                </div>
                <div className="maintenance-task-card-content">
                  <h3 className="maintenance-task-card-title">{task.title}</h3>
                  <p className="maintenance-task-card-description">{task.description}</p>
                  <div className="maintenance-task-card-meta">
                    <span className="maintenance-task-card-meta-text">תאריך: {task.createdDate}</span>
                  </div>
                  {task.assignedTo && (
                    <p className="maintenance-task-card-assigned">
                      מוקצה ל: {resolveAssignee(task.assignedTo)}
                    </p>
                  )}
                </div>
              </div>
              {task.imageUri && (
                <div className="maintenance-task-image-indicator">
                  <span className="maintenance-task-image-indicator-text">📎 מדיה מצורפת</span>
                </div>
              )}
            </div>
          );
          
          return (
            <>
              {tasksOpenedToday.length > 0 && (
                <>
                  <div className="maintenance-tasks-section-header">
                    <h3 className="maintenance-tasks-section-title">נפתחו היום</h3>
                  </div>
                  <div className="maintenance-tasks-list">
                    {tasksOpenedToday.map(renderTaskCard)}
                  </div>
                </>
              )}
              
              {tasksNotToday.length > 0 && (
                <>
                  <div className="maintenance-tasks-section-header">
                    <h3 className="maintenance-tasks-section-title">לא מהיום</h3>
                  </div>
                  <div className="maintenance-tasks-list">
                    {tasksNotToday.map(renderTaskCard)}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  )
}

export default MaintenanceTasksScreen

