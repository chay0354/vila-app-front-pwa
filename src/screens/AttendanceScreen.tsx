import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { AttendanceStatus, AttendanceLog } from '../types/attendance'
import './AttendanceScreen.css'

type AttendanceScreenProps = {
  userName: string
}

function AttendanceScreen({ userName }: AttendanceScreenProps) {
  const navigate = useNavigate()
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttendanceData()
    // Refresh status and logs every 10 seconds
    const interval = setInterval(() => {
      loadAttendanceData()
    }, 10000)
    return () => clearInterval(interval)
  }, [userName])

  const loadAttendanceData = async () => {
    await Promise.all([loadAttendanceStatus(), loadAttendanceLogs()])
  }

  const loadAttendanceStatus = async () => {
    if (!userName) return
    try {
      const url = `${API_BASE_URL}/attendance/status/${encodeURIComponent(userName)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setAttendanceStatus(data)
      }
    } catch (err) {
      console.error('Error loading attendance status:', err)
    }
  }

  const loadAttendanceLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/logs`)
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      setAttendanceLogs(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading attendance logs:', err)
      setLoading(false)
    }
  }

  const startAttendance = async () => {
    if (!userName) {
      alert('אנא התחברו תחילה')
      return
    }
    try {
      const url = `${API_BASE_URL}/attendance/start`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: userName }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן להתחיל את שעון הנוכחות')
        return
      }
      await loadAttendanceStatus()
      alert('הצלחה: התחלת עבודה נרשמה בהצלחה')
    } catch (err: any) {
      alert(err.message || 'אירעה שגיאה בהתחלת העבודה')
    }
  }

  const stopAttendance = async () => {
    if (!userName) {
      alert('אנא התחברו תחילה')
      return
    }
    try {
      const url = `${API_BASE_URL}/attendance/stop`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee: userName }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לסיים את שעון הנוכחות')
        return
      }
      await loadAttendanceStatus()
      await loadAttendanceLogs()
      alert('סיום עבודה נרשם בהצלחה')
    } catch (err: any) {
      alert(err.message || 'אירעה שגיאה בסיום העבודה')
    }
  }

  const handleRefresh = () => {
    loadAttendanceData()
  }

  const isClockedIn = attendanceStatus?.is_clocked_in || false
  const session = attendanceStatus?.session

  // Filter logs to show only current user's work periods
  const userWorkPeriods = useMemo(() => {
    if (!userName || !attendanceLogs) return []

    return (attendanceLogs || [])
      .filter((log: AttendanceLog) => {
        const emp = log.employee || log.emp || log.user || ''
        return emp.toString().toLowerCase() === userName.toLowerCase()
      })
      .map((log: AttendanceLog) => {
        const clockIn = log.clock_in ? new Date(log.clock_in) : null
        const clockOut = log.clock_out ? new Date(log.clock_out) : null

        let duration = '00:00'
        if (clockIn) {
          const end = clockOut || new Date()
          const diffMs = end.getTime() - clockIn.getTime()
          const hours = Math.floor(diffMs / (1000 * 60 * 60))
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        }

        return {
          id: log.id,
          clockIn: clockIn,
          clockOut: clockOut,
          duration: duration,
          isActive: !clockOut,
        }
      })
      .sort((a, b) => {
        // Sort by clock in time, newest first
        if (!a.clockIn || !b.clockIn) return 0
        return b.clockIn.getTime() - a.clockIn.getTime()
      })
  }, [attendanceLogs, userName])

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return ''
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return ''
    }
  }

  const calculateDuration = () => {
    if (!session?.clock_in) return '00:00'
    try {
      const start = new Date(session.clock_in)
      const end = session.clock_out ? new Date(session.clock_out) : new Date()
      const diffMs = end.getTime() - start.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return '00:00'
    }
  }

  // Update duration every second when clocked in
  const [currentDuration, setCurrentDuration] = useState(calculateDuration())
  useEffect(() => {
    if (isClockedIn && session?.clock_in) {
      const interval = setInterval(() => {
        setCurrentDuration(calculateDuration())
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCurrentDuration(calculateDuration())
    }
  }, [isClockedIn, session])

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <button className="attendance-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
        <h1 className="attendance-page-title">שעון נוכחות</h1>
      </div>

      <div className="attendance-scroll">
        <div className="attendance-header-section">
          <h2 className="attendance-user-name">שלום {userName}</h2>
          <p className="attendance-subtitle">ניהול שעות עבודה</p>
        </div>

        <div className="attendance-status-card">
          <div className="attendance-status-header">
            <div
              className="attendance-status-indicator"
              style={{ backgroundColor: isClockedIn ? '#22c55e' : '#94a3b8' }}
            >
              <span className="attendance-status-indicator-text">
                {isClockedIn ? '●' : '○'}
              </span>
            </div>
            <p className="attendance-status-text">
              {isClockedIn ? 'פעיל - בעבודה' : 'לא פעיל'}
            </p>
          </div>

          {isClockedIn && session && (
            <div className="attendance-session-info">
              <div className="attendance-info-row">
                <span className="attendance-info-label">התחלה:</span>
                <span className="attendance-info-value">
                  {formatDate(session.clock_in)} {formatTime(session.clock_in)}
                </span>
              </div>
              <div className="attendance-info-row">
                <span className="attendance-info-label">משך זמן:</span>
                <span className="attendance-info-value">{currentDuration}</span>
              </div>
            </div>
          )}
        </div>

        <div className="attendance-actions">
          {!isClockedIn ? (
            <button className="attendance-button attendance-button-start" onClick={startAttendance}>
              <span className="attendance-button-icon">▶</span>
              <span className="attendance-button-text">התחל עבודה</span>
            </button>
          ) : (
            <button className="attendance-button attendance-button-stop" onClick={stopAttendance}>
              <span className="attendance-button-icon">⏹</span>
              <span className="attendance-button-text">סיים עבודה</span>
            </button>
          )}

          <button className="attendance-button attendance-button-refresh" onClick={handleRefresh}>
            <span className="attendance-button-text">רענן</span>
          </button>
        </div>

        {/* Previous Work Periods - Only Current User */}
        <div className="attendance-history-section">
          <h2 className="attendance-history-title">תקופות עבודה קודמות</h2>
          {loading ? (
            <div className="attendance-empty-state">
              <p className="attendance-empty-state-text">טוען...</p>
            </div>
          ) : userWorkPeriods.length === 0 ? (
            <div className="attendance-empty-state">
              <p className="attendance-empty-state-text">אין תקופות עבודה קודמות</p>
            </div>
          ) : (
            <div className="attendance-history-list">
              {userWorkPeriods.map((period, index) => (
                <div key={period.id || index} className="attendance-history-item">
                  <div className="attendance-history-item-header">
                    <p className="attendance-history-item-date">
                      {period.clockIn ? formatDate(period.clockIn.toISOString()) : 'תאריך לא ידוע'}
                    </p>
                    {period.isActive && (
                      <div className="attendance-active-badge">
                        <span className="attendance-active-badge-text">פעיל</span>
                      </div>
                    )}
                  </div>
                  <div className="attendance-history-item-details">
                    <div className="attendance-history-detail-row">
                      <span className="attendance-history-detail-label">כניסה:</span>
                      <span className="attendance-history-detail-value">
                        {period.clockIn ? formatTime(period.clockIn.toISOString()) : '—'}
                      </span>
                    </div>
                    <div className="attendance-history-detail-row">
                      <span className="attendance-history-detail-label">יציאה:</span>
                      <span className="attendance-history-detail-value">
                        {period.clockOut ? formatTime(period.clockOut.toISOString()) : '—'}
                      </span>
                    </div>
                    <div className="attendance-history-detail-row">
                      <span className="attendance-history-detail-label">משך זמן:</span>
                      <span className="attendance-history-detail-value attendance-history-duration">
                        {period.duration}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceScreen

