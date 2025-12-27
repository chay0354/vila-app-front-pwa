import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { MaintenanceUnit, MaintenanceTask } from '../types/maintenance'
import { getInitialMaintenanceUnits, normalizeMaintenanceUnitId } from '../utils/maintenanceUtils'
import './MaintenanceTaskDetailScreen.css'

type MaintenanceTaskDetailScreenProps = {
  userName: string
}

function MaintenanceTaskDetailScreen({}: MaintenanceTaskDetailScreenProps) {
  const navigate = useNavigate()
  const { unitId, taskId } = useParams<{ unitId: string; taskId: string }>()
  const [unit, setUnit] = useState<MaintenanceUnit | null>(null)
  const [task, setTask] = useState<MaintenanceTask | null>(null)
  const [systemUsers, setSystemUsers] = useState<Array<{ id: string; username: string }>>([])
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeModalImageUri, setCloseModalImageUri] = useState<string | undefined>(undefined)
  const [showEditMediaModal, setShowEditMediaModal] = useState(false)
  const [editMediaUri, setEditMediaUri] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadSystemUsers()
    loadMaintenanceUnits()
  }, [unitId, taskId])

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

      const foundTask = foundUnit.tasks.find((t: MaintenanceTask) => t.id === taskId)
      if (!foundTask) {
        navigate(`/maintenance/${unitId}/tasks`)
        return
      }
      setTask(foundTask)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setUri: (uri: string) => void, autoClose?: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setUri(result)
        // If autoClose is true (for close modal), automatically close the task
        if (autoClose && task) {
          await handleUpdateTask({ status: 'סגור', imageUri: result })
          alert('המשימה נסגרה בהצלחה')
          setShowCloseModal(false)
          navigate(`/maintenance/${unitId}/tasks`)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateTask = async (updates: Partial<MaintenanceTask>) => {
    if (!task) return
    try {
      const payload: any = {}
      if (updates.status) payload.status = updates.status
      if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo
      if (updates.imageUri !== undefined) {
        payload.image_uri = updates.imageUri || null
      }
      if (updates.title) payload.title = updates.title
      if (updates.description) payload.description = updates.description

      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks/${encodeURIComponent(task.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        let errorDetail = errText || `HTTP ${res.status}`
        try {
          const errorData = JSON.parse(errText)
          errorDetail = errorData.detail || errorData.message || errText
        } catch {
          // Keep original errorDetail
        }
        alert(errorDetail)
        return
      }
      await loadMaintenanceUnits()
    } catch (err: any) {
      console.error('Error updating task:', err)
      alert(err.message || 'לא ניתן לעדכן משימת תחזוקה')
    }
  }


  const handleSaveEditMedia = async () => {
    const imageUriToSave = editMediaUri === null || editMediaUri === undefined ? undefined : editMediaUri
    await handleUpdateTask({ imageUri: imageUriToSave })
    alert(imageUriToSave ? 'המדיה עודכנה בהצלחה' : 'המדיה הוסרה בהצלחה')
    setShowEditMediaModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'פתוח':
        return '#f59e0b'
      case 'סגור':
        return '#22c55e'
      default:
        return '#64748b'
    }
  }

  if (!unit || !task) {
    return (
      <div className="maintenance-task-detail-container">
        <div className="maintenance-task-detail-header">
          <button
            className="maintenance-task-detail-back-button"
            onClick={() => navigate(`/maintenance/${unitId}/tasks`)}
          >
            ← חזרה
          </button>
        </div>
        <div className="maintenance-task-detail-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  const isVideo = task.imageUri?.startsWith('data:video/') || task.imageUri?.includes('.mp4') || task.imageUri?.includes('.mov')
  const editIsVideo = editMediaUri?.startsWith('data:video/') || editMediaUri?.includes('.mp4') || editMediaUri?.includes('.mov')
  const closeIsVideo = closeModalImageUri?.startsWith('data:video/') || closeModalImageUri?.includes('.mp4') || closeModalImageUri?.includes('.mov')

  return (
    <div className="maintenance-task-detail-container">
      <div className="maintenance-task-detail-header">
        <button
          className="maintenance-task-detail-back-button"
          onClick={() => navigate(`/maintenance/${unitId}/tasks`)}
        >
          ← חזרה
        </button>
      </div>
      <div className="maintenance-task-detail-scroll">
        <div className="maintenance-task-detail-card">
          <div className="maintenance-task-detail-header-section">
            <h1 className="maintenance-task-detail-title">{task.title}</h1>
            <div className="maintenance-task-detail-badges">
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
          </div>

          <div className="maintenance-task-detail-section">
            <span className="maintenance-task-detail-label">יחידה:</span>
            <span className="maintenance-task-detail-value">{unit.name}</span>
          </div>

          <div className="maintenance-task-detail-section">
            <span className="maintenance-task-detail-label">תאריך יצירה:</span>
            <span className="maintenance-task-detail-value">{task.createdDate}</span>
          </div>

          {task.assignedTo && (
            <div className="maintenance-task-detail-section">
              <span className="maintenance-task-detail-label">מוקצה ל:</span>
              <span className="maintenance-task-detail-value">{resolveAssignee(task.assignedTo)}</span>
            </div>
          )}

          <div className="maintenance-task-detail-section">
            <span className="maintenance-task-detail-label">תיאור:</span>
            <p className="maintenance-task-detail-description">{task.description}</p>
          </div>

          {task.imageUri && (
            <div className="maintenance-task-detail-section maintenance-task-detail-section-with-media">
              <div className="maintenance-task-detail-media-header-overlay">
                <span className="maintenance-task-detail-label-overlay">{isVideo ? 'וידאו:' : 'תמונה:'}</span>
                <button
                  className="maintenance-task-detail-edit-media-button"
                  onClick={() => {
                    setEditMediaUri(task.imageUri)
                    setShowEditMediaModal(true)
                  }}
                  type="button"
                >
                  ערוך/העלה
                </button>
              </div>
              <div className="maintenance-task-detail-image-container">
                {isVideo ? (
                  <video src={task.imageUri} controls className="maintenance-task-detail-image" />
                ) : (
                  <img src={task.imageUri} alt="Task media" className="maintenance-task-detail-image" />
                )}
              </div>
            </div>
          )}

          {task.status !== 'סגור' && (
            <div className="maintenance-task-detail-actions">
              <button
                className="maintenance-task-detail-close-button"
                onClick={() => {
                  setCloseModalImageUri(undefined)
                  setShowCloseModal(true)
                }}
                type="button"
              >
                סגור משימה
              </button>
            </div>
          )}

          {task.status === 'סגור' && (
            <div className="maintenance-task-detail-actions">
              <div className="maintenance-task-detail-closed-indicator">
                <span className="maintenance-task-detail-closed-text">✓ משימה סגורה</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close Modal */}
      {showCloseModal && (
        <div className="maintenance-modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="maintenance-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="maintenance-modal-title">סגירת משימה</h2>
            <p className="maintenance-modal-subtitle">על מנת לסגור את המשימה, יש להעלות תמונה או וידאו</p>

            <div className="maintenance-modal-field">
              <label className="maintenance-modal-label">תמונה/וידאו *</label>
              {closeModalImageUri ? (
                <div className="maintenance-modal-image-container">
                  <div className="maintenance-task-image-preview-container">
                    {closeIsVideo ? (
                      <video src={closeModalImageUri} controls className="maintenance-task-image-preview" />
                    ) : (
                      <img src={closeModalImageUri} alt="Preview" className="maintenance-task-image-preview" />
                    )}
                  </div>
                  <div className="maintenance-modal-buttons-grid">
                    <label className="maintenance-modal-grid-button maintenance-change-image-button">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e, setCloseModalImageUri, true)}
                        style={{ display: 'none' }}
                      />
                      החלף
                    </label>
                    <label className="maintenance-modal-grid-button maintenance-upload-image-button">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e, setCloseModalImageUri, true)}
                        style={{ display: 'none' }}
                      />
                      העלה אחר
                    </label>
                    <button
                      className="maintenance-modal-grid-button maintenance-modal-button-ghost"
                      onClick={() => setShowCloseModal(false)}
                      type="button"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <label className="maintenance-upload-image-button">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e, setCloseModalImageUri, true)}
                    style={{ display: 'none' }}
                  />
                  + העלה תמונה/וידאו
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {showEditMediaModal && (
        <div className="maintenance-modal-overlay" onClick={() => setShowEditMediaModal(false)}>
          <div className="maintenance-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="maintenance-modal-title">עריכת מדיה</h2>
            <p className="maintenance-modal-subtitle">בחר תמונה או וידאו חדש</p>

            <div className="maintenance-modal-field">
              <label className="maintenance-modal-label">תמונה/וידאו</label>
              {editMediaUri ? (
                <div className="maintenance-modal-image-container">
                  <div className="maintenance-task-image-preview-container">
                    {editIsVideo ? (
                      <video src={editMediaUri} controls className="maintenance-task-image-preview" />
                    ) : (
                      <img src={editMediaUri} alt="Preview" className="maintenance-task-image-preview" />
                    )}
                  </div>
                  <div className="maintenance-modal-buttons-row">
                    <label className="maintenance-change-image-button">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e, setEditMediaUri)}
                        style={{ display: 'none' }}
                      />
                      החלף
                    </label>
                  </div>
                </div>
              ) : (
                <label className="maintenance-upload-image-button">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e, setEditMediaUri)}
                    style={{ display: 'none' }}
                  />
                  + העלה תמונה/וידאו
                </label>
              )}
            </div>

            <div className="maintenance-modal-buttons">
              {editMediaUri ? (
                <>
                  <button
                    className="maintenance-modal-button maintenance-modal-button-primary"
                    onClick={handleSaveEditMedia}
                    type="button"
                  >
                    אישור
                  </button>
                  <button
                    className="maintenance-modal-button maintenance-modal-button-ghost"
                    onClick={() => {
                      setShowEditMediaModal(false)
                    }}
                    type="button"
                  >
                    ביטול
                  </button>
                </>
              ) : (
                <button
                  className="maintenance-modal-button maintenance-modal-button-ghost"
                  onClick={() => {
                    setShowEditMediaModal(false)
                  }}
                  type="button"
                >
                  ביטול
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceTaskDetailScreen

