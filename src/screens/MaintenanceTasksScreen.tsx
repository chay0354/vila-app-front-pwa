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
          <h2 className="maintenance-tasks-section-title">משימות תחזוקה</h2>
          <button
            className="maintenance-tasks-add-button"
            onClick={() => navigate(`/maintenance/${unit.id}/new-task`)}
            type="button"
          >
            + משימה חדשה
          </button>
        </div>

        {unit.tasks.length === 0 ? (
          <div className="maintenance-tasks-empty-state">
            <p className="maintenance-tasks-empty-state-text">אין משימות תחזוקה ליחידה זו</p>
          </div>
        ) : (
          <div className="maintenance-tasks-list">
            {unit.tasks.map(task => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MaintenanceTasksScreen

