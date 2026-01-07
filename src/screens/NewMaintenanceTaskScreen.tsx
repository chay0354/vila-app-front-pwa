import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { MaintenanceUnit, MaintenanceTask } from '../types/maintenance'
import { getInitialMaintenanceUnits, normalizeMaintenanceUnitId } from '../utils/maintenanceUtils'
import './NewMaintenanceTaskScreen.css'

type NewMaintenanceTaskScreenProps = {
  userName: string
}

function NewMaintenanceTaskScreen({ userName }: NewMaintenanceTaskScreenProps) {
  const navigate = useNavigate()
  const { unitId } = useParams<{ unitId: string }>()
  const [unit, setUnit] = useState<MaintenanceUnit | null>(null)
  const [systemUsers, setSystemUsers] = useState<Array<{ id: string; username: string }>>([])
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [showAssigneeModal, setShowAssigneeModal] = useState(false)
  const [room, setRoom] = useState('')
  const [mediaUri, setMediaUri] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadSystemUsers()
    loadMaintenanceUnits()
  }, [unitId])

  useEffect(() => {
    // Default assignee: current user (if we can resolve them from system users list)
    if (!assignedTo && userName && systemUsers?.length) {
      const found = systemUsers.find(u => (u.username || '').toString() === userName)
      if (found?.id) setAssignedTo(found.id.toString())
    }
  }, [assignedTo, userName, systemUsers])

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

  const uploadFileToStorage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`${API_BASE_URL}/api/storage/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Storage upload failed: ${errText}`)
      }
      
      const data = await res.json()
      return data.url
    } catch (err: any) {
      console.error('Error uploading to storage, falling back to data URI:', err)
      // Fallback to data URI if storage upload fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result
          if (typeof result === 'string') {
            resolve(result)
          } else {
            reject(new Error('Failed to read file'))
          }
        }
        reader.onerror = () => {
          reject(new Error('Failed to read file'))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Upload to storage first
      const storageUrl = await uploadFileToStorage(file)
      setMediaUri(storageUrl)
    } catch (err: any) {
      console.error('Error handling file:', err)
      alert(err.message || 'שגיאה בהעלאת הקובץ')
    }
  }

  const handleSave = async () => {
    if (!description) {
      alert('אנא מלאו את כל השדות הנדרשים')
      return
    }
    if (!assignedTo) {
      alert('אנא בחרו עובד לשיוך המשימה')
      return
    }
    if (!unit) return

    try {
      const jsonPayload: any = {
        id: `task-${Date.now()}`,
        unit_id: unit.id,
        title: description.substring(0, 100), // Use description as title since title field is removed
        description,
        status: 'פתוח',
        created_date: new Date().toISOString().split('T')[0],
      }
      if (assignedTo) jsonPayload.assigned_to = assignedTo
      if (room) jsonPayload.room = room
      if (mediaUri) jsonPayload.imageUri = mediaUri

      const jsonRes = await fetch(`${API_BASE_URL}/api/maintenance/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonPayload),
      })
      if (!jsonRes.ok) {
        const errText = await jsonRes.text().catch(() => '')
        let errorDetail = errText || `HTTP ${jsonRes.status}`
        try {
          const errorData = JSON.parse(errText)
          errorDetail = errorData.detail || errorData.message || errText
        } catch {
          // Keep original errorDetail
        }
        alert(errorDetail)
        return
      }
      navigate(`/maintenance/${unit.id}/tasks`)
    } catch (err: any) {
      console.error('Error creating task:', err)
      alert(err.message || 'לא ניתן ליצור משימת תחזוקה')
    }
  }

  if (!unit) {
    return (
      <div className="new-maintenance-task-container">
        <div className="new-maintenance-task-header">
          <button
            className="new-maintenance-task-back-button"
            onClick={() => navigate(`/maintenance/${unitId}/tasks`)}
          >
            ← חזרה
          </button>
        </div>
        <div className="new-maintenance-task-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  const selectedUser = systemUsers.find(u => u.id.toString() === assignedTo)
  const isVideo = mediaUri?.startsWith('data:video/') || mediaUri?.includes('.mp4') || mediaUri?.includes('.mov') || mediaUri?.includes('/vidoes/') || mediaUri?.includes('/storage/v1/object/public/vidoes/')

  return (
    <div className="new-maintenance-task-container">
      <div className="new-maintenance-task-header">
        <button
          className="new-maintenance-task-back-button"
          onClick={() => navigate('/maintenance')}
        >
          ← חזרה
        </button>
      </div>
      <div className="new-maintenance-task-scroll">
        <div className="new-maintenance-task-title-section">
          <div>
            <h1 className="new-maintenance-task-title">קריאה חדשה {unit.name}</h1>
            <p className="new-maintenance-task-subtitle">הוספת משימת תחזוקה ל{unit.name}</p>
          </div>
        </div>

        <div className="new-maintenance-task-card">
          <div className="new-maintenance-task-field">
            <label className="new-maintenance-task-label">תיאור הקריאה *</label>
            <textarea
              className="new-maintenance-task-input new-maintenance-task-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="הזינו תיאור מפורט"
              rows={4}
            />
          </div>

          <div className="new-maintenance-task-field">
            <label className="new-maintenance-task-label">שיוך עובד *</label>
            <button
              className="new-maintenance-task-select"
              onClick={() => setShowAssigneeModal(!showAssigneeModal)}
              type="button"
            >
              <span className="new-maintenance-task-select-value">
                {selectedUser ? selectedUser.username : 'בחרו עובד'}
              </span>
              <span className="new-maintenance-task-select-caret">▾</span>
            </button>
            {showAssigneeModal && (
              <div className="new-maintenance-task-select-list">
                {systemUsers.map((user) => (
                  <button
                    key={user.id}
                    className={`new-maintenance-task-select-item ${
                      user.id.toString() === assignedTo ? 'active' : ''
                    }`}
                    onClick={() => {
                      setAssignedTo(user.id.toString())
                      setShowAssigneeModal(false)
                    }}
                    type="button"
                  >
                    {user.username}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="new-maintenance-task-field">
            <label className="new-maintenance-task-label">חדר</label>
            <input
              className="new-maintenance-task-input"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="הזינו מספר חדר (אופציונלי)"
            />
          </div>

          <div className="new-maintenance-task-field">
            <label className="new-maintenance-task-label">תמונה/וידאו (אופציונלי)</label>
            {mediaUri ? (
              <div className="new-maintenance-task-media-container">
                <div className="new-maintenance-task-image-preview-container">
                  {isVideo ? (
                    <video src={mediaUri} controls className="new-maintenance-task-image-preview" />
                  ) : (
                    <img src={mediaUri} alt="Preview" className="new-maintenance-task-image-preview" />
                  )}
                </div>
                <div className="new-maintenance-task-media-buttons">
                  <label className="new-maintenance-task-change-image-button">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    החלף
                  </label>
                  <button
                    className="new-maintenance-task-remove-image-button"
                    onClick={() => setMediaUri(undefined)}
                    type="button"
                  >
                    הסר
                  </button>
                </div>
              </div>
            ) : (
              <label className="new-maintenance-task-upload-image-button">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                + העלה תמונה/וידאו
              </label>
            )}
          </div>

          <div className="new-maintenance-task-actions">
            <button
              className="new-maintenance-task-save-button"
              onClick={handleSave}
              type="button"
            >
              שמור משימה
            </button>
            <button
              className="new-maintenance-task-cancel-button"
              onClick={() => navigate(`/maintenance/${unit.id}/tasks`)}
              type="button"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewMaintenanceTaskScreen

