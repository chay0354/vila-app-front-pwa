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
  const [isUploadingClose, setIsUploadingClose] = useState(false)
  const [isUploadingEdit, setIsUploadingEdit] = useState(false)

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
      console.log('[PWA TaskDetail] Loading maintenance units...')
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) {
        console.error('[PWA TaskDetail] Failed to load tasks:', res.status)
        navigate('/maintenance')
        return
      }
      const data = (await res.json()) || []
      console.log('[PWA TaskDetail] Loaded', data.length, 'tasks (without images)')

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
        console.error('[PWA TaskDetail] Unit not found:', unitId)
        navigate('/maintenance')
        return
      }
      setUnit(foundUnit)

      const foundTask = foundUnit.tasks.find((t: MaintenanceTask) => t.id === taskId)
      if (!foundTask) {
        console.error('[PWA TaskDetail] Task not found:', taskId)
        navigate(`/maintenance/${unitId}/tasks`)
        return
      }
      
      console.log('[PWA TaskDetail] Found task:', foundTask.id, 'imageUri:', foundTask.imageUri ? 'YES' : 'NO')
      
      // Now fetch the full task with image_uri
      if (!taskId) {
        console.error('[PWA TaskDetail] taskId is undefined')
        setTask(foundTask)
        return
      }
      
      console.log('[PWA TaskDetail] Fetching full task with image_uri for:', taskId)
      try {
        const fullTaskRes = await fetch(`${API_BASE_URL}/api/maintenance/tasks/${encodeURIComponent(taskId)}`)
        if (fullTaskRes.ok) {
          const fullTaskData = await fullTaskRes.json()
          const imageUri: string | undefined = fullTaskData.image_uri || fullTaskData.imageUri || undefined
          console.log('[PWA TaskDetail] ==========================================')
          console.log('[PWA TaskDetail] IMAGE/VIDEO URL:', imageUri || 'NONE')
          if (imageUri) {
            console.log('[PWA TaskDetail] URL length:', imageUri.length)
            const isVideo = imageUri.startsWith('data:video/') || 
                           imageUri.includes('.mp4') || 
                           imageUri.includes('.mov') || 
                           imageUri.includes('/vidoes/') || 
                           imageUri.includes('/storage/')
            console.log('[PWA TaskDetail] Type:', isVideo ? 'VIDEO' : 'IMAGE')
            if (imageUri.startsWith('http')) {
              console.log('[PWA TaskDetail] URL Type: HTTP/HTTPS (Storage URL)')
            } else if (imageUri.startsWith('data:')) {
              console.log('[PWA TaskDetail] URL Type: Data URI (Base64)')
              const semicolonIndex = imageUri.indexOf(';')
              const mimeType = semicolonIndex > 0 ? imageUri.substring(5, semicolonIndex) : 'unknown'
              console.log('[PWA TaskDetail] Data URI MIME type:', mimeType)
            }
          }
          console.log('[PWA TaskDetail] ==========================================')
          
          // Update task with full data including imageUri
          const updatedTask: MaintenanceTask = {
            id: foundTask.id,
            unitId: foundTask.unitId,
            title: fullTaskData.title || foundTask.title,
            description: fullTaskData.description || foundTask.description,
            status: (fullTaskData.status || foundTask.status) as MaintenanceTask['status'],
            createdDate: fullTaskData.created_date || fullTaskData.createdDate || foundTask.createdDate,
            assignedTo: fullTaskData.assigned_to || fullTaskData.assignedTo || foundTask.assignedTo,
            imageUri: imageUri,
          }
          console.log('[PWA TaskDetail] Setting task with imageUri:', updatedTask.imageUri ? 'YES' : 'NO')
          setTask(updatedTask)
        } else {
          console.warn('[PWA TaskDetail] Failed to fetch full task, using task without image:', fullTaskRes.status)
          setTask(foundTask)
        }
      } catch (fetchErr) {
        console.error('[PWA TaskDetail] Error fetching full task:', fetchErr)
        setTask(foundTask)
      }
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
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result
          if (typeof result === 'string') {
            resolve(result)
          } else {
            throw new Error('Failed to read file')
          }
        }
        reader.onerror = () => {
          throw new Error('Failed to read file')
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, setUri: (uri: string) => void, autoClose?: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (autoClose) {
      setIsUploadingClose(true)
    }

    try {
      // Upload to storage first
      const storageUrl = await uploadFileToStorage(file)
      setUri(storageUrl)
      
      // If autoClose is true (for close modal), automatically close the task
      if (autoClose && task) {
        try {
          await handleUpdateTask({ status: 'סגור', imageUri: storageUrl })
          alert('המשימה נסגרה בהצלחה')
          setShowCloseModal(false)
          navigate(`/maintenance/${unitId}/tasks`)
        } finally {
          setIsUploadingClose(false)
        }
      }
    } catch (err: any) {
      console.error('Error handling file:', err)
      alert(err.message || 'שגיאה בהעלאת הקובץ')
      if (autoClose) {
        setIsUploadingClose(false)
      }
    }
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
    setIsUploadingEdit(true)
    try {
      const imageUriToSave = editMediaUri === null || editMediaUri === undefined ? undefined : editMediaUri
      await handleUpdateTask({ imageUri: imageUriToSave })
      alert(imageUriToSave ? 'המדיה עודכנה בהצלחה' : 'המדיה הוסרה בהצלחה')
      setShowEditMediaModal(false)
    } finally {
      setIsUploadingEdit(false)
    }
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

  const isVideo = task.imageUri?.startsWith('data:video/') || task.imageUri?.includes('.mp4') || task.imageUri?.includes('.mov') || task.imageUri?.includes('/vidoes/') || task.imageUri?.includes('/storage/v1/object/public/vidoes/')
  const editIsVideo = editMediaUri?.startsWith('data:video/') || editMediaUri?.includes('.mp4') || editMediaUri?.includes('.mov') || editMediaUri?.includes('/vidoes/') || editMediaUri?.includes('/storage/v1/object/public/vidoes/')
  const closeIsVideo = closeModalImageUri?.startsWith('data:video/') || closeModalImageUri?.includes('.mp4') || closeModalImageUri?.includes('.mov') || closeModalImageUri?.includes('/vidoes/') || closeModalImageUri?.includes('/storage/v1/object/public/vidoes/')

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

          {task.imageUri ? (
            <div className="maintenance-task-detail-section maintenance-task-detail-section-with-media">
              {(() => {
                console.log('[PWA TaskDetail] Rendering image/video with URL:', task.imageUri)
                console.log('[PWA TaskDetail] Rendering as:', isVideo ? 'VIDEO' : 'IMAGE')
                return null
              })()}
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
                  <video 
                    src={task.imageUri} 
                    controls 
                    className="maintenance-task-detail-image"
                    onLoadStart={() => console.log('[PWA TaskDetail] Video loading started:', task.imageUri)}
                    onLoadedData={() => console.log('[PWA TaskDetail] Video loaded successfully:', task.imageUri)}
                    onError={(e) => console.error('[PWA TaskDetail] Video error:', e, 'URL:', task.imageUri)}
                  />
                ) : (
                  <img 
                    src={task.imageUri} 
                    alt="Task media" 
                    className="maintenance-task-detail-image"
                    onLoad={() => console.log('[PWA TaskDetail] Image loaded successfully:', task.imageUri)}
                    onError={(e) => console.error('[PWA TaskDetail] Image error:', e, 'URL:', task.imageUri)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="maintenance-task-detail-section">
              <p style={{ color: '#999', fontStyle: 'italic' }}>
                {(() => {
                  console.log('[PWA TaskDetail] No imageUri available for task:', task.id)
                  return 'אין תמונה או וידאו'
                })()}
              </p>
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
                <label className="maintenance-upload-image-button" style={{ opacity: isUploadingClose ? 0.6 : 1, pointerEvents: isUploadingClose ? 'none' : 'auto' }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e, setCloseModalImageUri, true)}
                    style={{ display: 'none' }}
                    disabled={isUploadingClose}
                  />
                  {isUploadingClose ? '⏳ מעלה...' : '+ העלה תמונה/וידאו'}
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
                <label className="maintenance-upload-image-button" style={{ opacity: isUploadingEdit ? 0.6 : 1, pointerEvents: isUploadingEdit ? 'none' : 'auto' }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelect(e, setEditMediaUri)}
                    style={{ display: 'none' }}
                    disabled={isUploadingEdit}
                  />
                  {isUploadingEdit ? '⏳ מעלה...' : '+ העלה תמונה/וידאו'}
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
                    disabled={isUploadingEdit}
                    style={{ opacity: isUploadingEdit ? 0.6 : 1 }}
                  >
                    {isUploadingEdit ? '⏳ מעלה...' : 'אישור'}
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

