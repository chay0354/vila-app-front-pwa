import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './HubScreen.css'

type HubScreenProps = {
  userName: string
  userRole?: string | null
  userImageUrl?: string | null
  onSignOut?: () => void
}

function HubScreen({ userName, userRole, userImageUrl, onSignOut }: HubScreenProps) {
  // Helper function to check if user is a manager (can see everything)
  const isManager = (role: string | null | undefined): boolean => {
    if (!role) return false;
    return role === 'מנהל ראשי' || role === 'מנהל הזמנות' || role === 'מנהל מתחם' || role === 'מנהל';
  };
  
  const canSeeEverything = isManager(userRole);
  
  const navigate = useNavigate()
  const [openMaintenanceTasksCount, setOpenMaintenanceTasksCount] = useState<number>(0)

  useEffect(() => {
    loadMaintenanceTasksCount()
  }, [])


  const loadMaintenanceTasksCount = async () => {
    try {
      // Load all tasks and count them the same way as MaintenanceScreen does
      // MaintenanceScreen uses: unit.tasks.filter(t => t.status === 'פתוח').length
      // So we do the same - count only tasks where status is exactly 'פתוח'
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) {
        console.error('Failed to load maintenance tasks:', res.status)
        return
      }
      const tasks = await res.json() || []
      // Count only tasks with status exactly 'פתוח' - same logic as MaintenanceScreen.getUnitStats()
      const totalOpen = tasks.filter((t: any) => (t.status || '').toString().trim() === 'פתוח').length
      setOpenMaintenanceTasksCount(totalOpen)
    } catch (err) {
      console.error('Error loading maintenance tasks count:', err)
    }
  }

  return (
    <div className="hub-container">
      <div className="hub-scroll">
        <div className="hub-top-row">
          <button
            className="hub-signout-button"
            onClick={() => {
              if (onSignOut) {
                onSignOut()
              }
              navigate('/signin')
            }}
            type="button"
          >
            <span className="hub-signout-icon">🛑</span>
            <span className="hub-signout-text">יציאה</span>
          </button>
          <div className="hub-user-chip">
            <span className="hub-user-chip-text">שלום {userName}</span>
          </div>
        </div>

        <div className="hub-welcome-section">
          <div className="hub-welcome-card">
            <div className="hub-welcome-avatar">
              {userImageUrl ? (
                <img src={userImageUrl} alt={userName} className="hub-welcome-avatar-image" />
              ) : (
                <div className="hub-welcome-avatar-placeholder">
                  <span className="hub-welcome-avatar-icon">👤</span>
                </div>
              )}
            </div>
            <button
              className="hub-welcome-chat-button"
              onClick={() => navigate('/chat')}
              type="button"
            >
              <span className="hub-welcome-chat-icon">💬</span>
            </button>
            <div className="hub-welcome-content">
              <h2 className="hub-welcome-title">שלום {userName}</h2>
              <p className="hub-welcome-subtitle">ברוך הבא למערכת הניהול</p>
            </div>
          </div>
        </div>

        <div className="hub-quick-actions">
          <h2 className="hub-section-title">אפשרויות</h2>
          <div className="hub-quick-actions-row">
            {canSeeEverything && (
              <button
                className="hub-quick-action-btn hub-quick-action-blue"
                onClick={() => navigate('/orders')}
                type="button"
              >
                <span className="hub-quick-action-icon">📑</span>
                <span className="hub-quick-action-text">הזמנות</span>
              </button>
            )}
            <button
              className="hub-quick-action-btn hub-quick-action-orange"
              onClick={() => navigate('/exit-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">🧹</span>
              <span className="hub-quick-action-text">ביקורת יציאה</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-lime"
              onClick={() => navigate('/cleaning-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">✨</span>
              <span className="hub-quick-action-text">ביקורת ניקיון</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-amber"
              onClick={() => navigate('/monthly-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">📅</span>
              <span className="hub-quick-action-text">ביקורות חודשיות</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-purple"
              onClick={() => navigate('/warehouse')}
              type="button"
            >
              <span className="hub-quick-action-icon">📦</span>
              <span className="hub-quick-action-text">מחסן</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-green"
              onClick={() => navigate('/maintenance')}
              type="button"
              style={{ position: 'relative' }}
            >
              {openMaintenanceTasksCount > 0 && (
                <span className="hub-maintenance-badge">{openMaintenanceTasksCount}</span>
              )}
              <span className="hub-quick-action-icon">🛠️</span>
              <span className="hub-quick-action-text">תחזוקה</span>
            </button>
            {canSeeEverything && (
              <>
                <button
                  className="hub-quick-action-btn hub-quick-action-indigo"
                  onClick={() => navigate('/reports')}
                  type="button"
                >
                  <span className="hub-quick-action-icon">📊</span>
                  <span className="hub-quick-action-text">דוחות</span>
                </button>
                <button
                  className="hub-quick-action-btn hub-quick-action-cyan"
                  onClick={() => navigate('/invoices')}
                  type="button"
                >
                  <span className="hub-quick-action-icon">🧾</span>
                  <span className="hub-quick-action-text">חשבוניות</span>
                </button>
              </>
            )}
            {canSeeEverything ? (
              <button
                className="hub-quick-action-btn hub-quick-action-pink"
                onClick={() => navigate('/employee-management')}
                type="button"
              >
                <span className="hub-quick-action-icon">👥</span>
                <span className="hub-quick-action-text">ניהול עובדים</span>
              </button>
            ) : (
              <button
                className="hub-quick-action-btn hub-quick-action-pink"
                onClick={() => navigate('/attendance')}
                type="button"
              >
                <span className="hub-quick-action-icon">⏱️</span>
                <span className="hub-quick-action-text">שעון נוכחות</span>
              </button>
            )}
            <button
              className="hub-quick-action-btn hub-quick-action-teal"
              onClick={() => navigate('/cleaning-schedule')}
              type="button"
            >
              <span className="hub-quick-action-icon">🧹</span>
              <span className="hub-quick-action-text">סידורי ניקיון</span>
            </button>
          </div>
        </div>

        {/* Chat button at bottom - full width */}
        <div className="hub-chat-section">
          <button
            className="hub-chat-button"
            onClick={() => navigate('/chat')}
            type="button"
          >
            <span className="hub-quick-action-icon">💬</span>
            <span className="hub-quick-action-text">צ׳אט פנימי</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HubScreen

