import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './EmployeeManagementScreen.css'

type Employee = {
  id: string
  username: string
  image_url?: string | null
  hourly_wage?: number | null
  role?: string | null
}

type AttendanceLog = {
  id: string
  employee: string
  clock_in: string
  clock_out?: string | null
}

type PendingApproval = {
  id: string
  username: string
  role?: string | null
  image_url?: string | null
  created_at?: string | null
}

type EmployeeManagementScreenProps = {
  userName: string
}

function EmployeeManagementScreen({ userName }: EmployeeManagementScreenProps) {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWage, setEditingWage] = useState<string | null>(null)
  const [wageInput, setWageInput] = useState<string>('')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editClockIn, setEditClockIn] = useState<string>('')
  const [editClockOut, setEditClockOut] = useState<string>('')
  const isAdmin = userName.toLowerCase() === 'admin'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const promises = [loadEmployees(), loadAttendanceLogs()]
    if (isAdmin) {
      promises.push(loadPendingApprovals())
    }
    await Promise.all(promises)
    setLoading(false)
  }

  const loadPendingApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/pending-approvals`)
      if (!res.ok) {
        console.error('Failed to load pending approvals:', res.status)
        return
      }
      const data = await res.json()
      setPendingApprovals(data || [])
    } catch (err) {
      console.error('Error loading pending approvals:', err)
    }
  }

  const loadEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/with-details`)
      if (!res.ok) {
        console.error('Failed to load employees:', res.status)
        return
      }
      const data = await res.json()
      setEmployees(data || [])
    } catch (err) {
      console.error('Error loading employees:', err)
    }
  }

  const loadAttendanceLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/logs/all`)
      if (!res.ok) {
        console.error('Failed to load attendance logs:', res.status)
        return
      }
      const data = await res.json()
      setAttendanceLogs(data || [])
    } catch (err) {
      console.error('Error loading attendance logs:', err)
    }
  }

  const updateWage = async (employeeId: string, wage: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${employeeId}/wage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourly_wage: wage }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לעדכן את השכר')
        return
      }
      await loadEmployees()
      setEditingWage(null)
      setWageInput('')
      alert('השכר עודכן בהצלחה')
    } catch (err: any) {
      alert(err.message || 'אירעה שגיאה בעדכון השכר')
    }
  }

  const handleStartEditWage = (employee: Employee) => {
    setEditingWage(employee.id)
    setWageInput(employee.hourly_wage?.toString() || '')
  }

  const updateAttendanceLog = async (logId: string, clockIn: string, clockOut: string | null) => {
    try {
      // Find the log to get the original date
      const log = attendanceLogs.find(l => l.id === logId)
      if (!log) {
        alert('לא נמצא רשומת נוכחות')
        return
      }

      // Parse the original clock_in to get the date
      const originalClockIn = new Date(log.clock_in)
      const [inHours, inMinutes] = clockIn.split(':').map(Number)
      const clockInDate = new Date(originalClockIn)
      clockInDate.setHours(inHours, inMinutes, 0, 0)

      let clockOutDate: Date | null = null
      if (clockOut && clockOut !== 'פתוח' && clockOut.trim() !== '') {
        const [outHours, outMinutes] = clockOut.split(':').map(Number)
        clockOutDate = new Date(originalClockIn)
        clockOutDate.setHours(outHours, outMinutes, 0, 0)
        // If clock out is before clock in, assume it's the next day
        if (clockOutDate < clockInDate) {
          clockOutDate.setDate(clockOutDate.getDate() + 1)
        }
      }

      const payload: any = {
        clock_in: clockInDate.toISOString(),
      }
      if (clockOutDate) {
        payload.clock_out = clockOutDate.toISOString()
      } else if (clockOut === null || clockOut === '' || clockOut === 'פתוח') {
        payload.clock_out = null
      }

      const res = await fetch(`${API_BASE_URL}/api/attendance/logs/${encodeURIComponent(logId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        throw new Error(errorText || 'לא ניתן לעדכן את רשומת הנוכחות')
      }

      // Reload attendance logs
      await loadAttendanceLogs()
      setEditingLogId(null)
      alert('רשומת הנוכחות עודכנה בהצלחה')
    } catch (err: any) {
      console.error('Error updating attendance log:', err)
      alert(err.message || 'לא ניתן לעדכן את רשומת הנוכחות')
    }
  }

  const startEditLog = (session: any) => {
    setEditingLogId(session.id)
    setEditClockIn(session.timeIn)
    setEditClockOut(session.isOpen ? '' : session.timeOut)
  }

  const cancelEditLog = () => {
    setEditingLogId(null)
    setEditClockIn('')
    setEditClockOut('')
  }

  const saveEditLog = async (logId: string) => {
    await updateAttendanceLog(logId, editClockIn, editClockOut || null)
  }

  const handleSaveWage = (employeeId: string) => {
    const wage = parseFloat(wageInput)
    if (isNaN(wage) || wage < 0) {
      alert('אנא הזן שכר שעתי תקין')
      return
    }
    updateWage(employeeId, wage)
  }

  const handleCancelEdit = () => {
    setEditingWage(null)
    setWageInput('')
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/approve`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לאשר את המשתמש')
        return
      }
      await loadPendingApprovals()
      alert('המשתמש אושר בהצלחה')
    } catch (err: any) {
      alert(err.message || 'אירעה שגיאה באישור המשתמש')
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך לדחות את המשתמש? פעולה זו תמחק את המשתמש.')) {
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/reject`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לדחות את המשתמש')
        return
      }
      await loadPendingApprovals()
      alert('המשתמש נדחה והוסר בהצלחה')
    } catch (err: any) {
      alert(err.message || 'אירעה שגיאה בדחיית המשתמש')
    }
  }

  const getFilteredLogs = (employeeUsername: string) => {
    return attendanceLogs.filter(log => log.employee === employeeUsername)
  }

  const calculateHours = (logs: AttendanceLog[]) => {
    return logs.reduce((total, log) => {
      const clockIn = new Date(log.clock_in)
      const clockOut = log.clock_out ? new Date(log.clock_out) : new Date()
      const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
      return total + Math.max(0, hours)
    }, 0)
  }

  const employeesWithStats = useMemo(() => {
    // Filter to show only employees (not managers)
    const managerRoles = ['מנהל', 'מנהל ראשי', 'מנהל הזמנות', 'מנהל מתחם'];
    const employeeAccounts = employees.filter(emp => emp.role && !managerRoles.includes(emp.role))
    
    return employeeAccounts.map(emp => {
      const logs = getFilteredLogs(emp.username)
      const hours = calculateHours(logs)
      const wage = emp.hourly_wage || 0
      const earnings = hours * wage
      
      return {
        ...emp,
        hours: hours.toFixed(2),
        earnings: earnings.toFixed(2),
        sessionsCount: logs.length,
      }
    })
  }, [employees, attendanceLogs])

  const selectedEmployeeData = useMemo(() => {
    if (!selectedEmployee) return null
    const emp = employees.find(e => e.id === selectedEmployee)
    if (!emp) return null
    
    const logs = getFilteredLogs(emp.username)
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.clock_in).getTime() - new Date(a.clock_in).getTime()
    )
    
    return {
      ...emp,
      logs: sortedLogs.map(log => {
        const clockIn = new Date(log.clock_in)
        const clockOut = log.clock_out ? new Date(log.clock_out) : null
        const hours = clockOut 
          ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
          : (new Date().getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        
        return {
          ...log,
          date: clockIn.toLocaleDateString('he-IL'),
          timeIn: clockIn.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          timeOut: clockOut?.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) || 'פתוח',
          hours: hours.toFixed(2),
          isOpen: !clockOut,
        }
      }),
    }
  }, [selectedEmployee, employees, attendanceLogs])

  if (loading) {
    return (
      <div className="employee-management-container">
        <div className="employee-management-header">
          <button
            className="employee-management-back-button"
            onClick={() => navigate('/hub')}
            type="button"
          >
            ← חזרה
          </button>
        </div>
        <div className="employee-management-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="employee-management-container">
      <div className="employee-management-header">
        <button
          className="employee-management-back-button"
          onClick={() => navigate('/hub')}
          type="button"
        >
          ← חזרה
        </button>
      </div>
      <div className="employee-management-scroll">
        <div className="employee-management-title-section">
          <h1 className="employee-management-title">ניהול עובדים</h1>
        </div>

        {isAdmin && pendingApprovals.length > 0 && (
          <div className="employee-approvals-section">
            <h2 className="employee-approvals-title">אישורי כניסה למערכת</h2>
            <div className="employee-approvals-list">
              {pendingApprovals.map(approval => (
                <div key={approval.id} className="employee-approval-card">
                  <div className="employee-approval-header">
                    <div className="employee-approval-avatar">
                      {approval.image_url ? (
                        <img src={approval.image_url} alt={approval.username} className="employee-approval-avatar-image" />
                      ) : (
                        <div className="employee-approval-avatar-placeholder">
                          <span className="employee-approval-avatar-icon">👤</span>
                        </div>
                      )}
                    </div>
                    <div className="employee-approval-info">
                      <h3 className="employee-approval-name">{approval.username}</h3>
                      {approval.role && (
                        <p className="employee-approval-role">{approval.role}</p>
                      )}
                      {approval.created_at && (
                        <p className="employee-approval-date">
                          נרשם: {new Date(approval.created_at).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="employee-approval-actions">
                    <button
                      className="employee-approval-approve"
                      onClick={() => handleApproveUser(approval.id)}
                      type="button"
                    >
                      ✓ אישר
                    </button>
                    <button
                      className="employee-approval-reject"
                      onClick={() => handleRejectUser(approval.id)}
                      type="button"
                    >
                      ✗ דחה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="employee-management-grid">
          {employeesWithStats.map(emp => (
            <div
              key={emp.id}
              className={`employee-card ${selectedEmployee === emp.id ? 'employee-card-selected' : ''}`}
              onClick={() => setSelectedEmployee(selectedEmployee === emp.id ? null : emp.id)}
            >
              <div className="employee-card-header">
                <div className="employee-avatar">
                  {emp.image_url ? (
                    <img src={emp.image_url} alt={emp.username} className="employee-avatar-image" />
                  ) : (
                    <div className="employee-avatar-placeholder">
                      <span className="employee-avatar-icon">👤</span>
                    </div>
                  )}
                </div>
                <div className="employee-info">
                  <h3 className="employee-name">{emp.username}</h3>
                  <div className="employee-time-info">
                    <span className="employee-time-label">שעות עבודה:</span>
                    <span className="employee-time-value">{emp.hours} שעות</span>
                  </div>
                </div>
              </div>

              <div className="employee-wage-section">
                {editingWage === emp.id ? (
                  <div className="employee-wage-edit">
                    <input
                      type="number"
                      className="employee-wage-input"
                      value={wageInput}
                      onChange={(e) => setWageInput(e.target.value)}
                      placeholder="שכר שעתי"
                      min="0"
                      step="0.01"
                      dir="ltr"
                    />
                    <div className="employee-wage-actions">
                      <button
                        className="employee-wage-save"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveWage(emp.id)
                        }}
                        type="button"
                      >
                        שמור
                      </button>
                      <button
                        className="employee-wage-cancel"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelEdit()
                        }}
                        type="button"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="employee-wage-display">
                    <span className="employee-wage-label">שכר שעתי:</span>
                    <span className="employee-wage-value">
                      {emp.hourly_wage ? `₪${emp.hourly_wage.toLocaleString('he-IL')}` : 'לא הוגדר'}
                    </span>
                    <button
                      className="employee-wage-edit-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEditWage(emp)
                      }}
                      type="button"
                    >
                      ערוך
                    </button>
                  </div>
                )}
              </div>

              {emp.hourly_wage && parseFloat(emp.hours) > 0 && (
                <div className="employee-earnings">
                  <span className="employee-earnings-label">סה״כ רווחים:</span>
                  <span className="employee-earnings-value">₪{parseFloat(emp.earnings).toLocaleString('he-IL')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedEmployeeData && (
          <div className="employee-details-modal-overlay" onClick={() => setSelectedEmployee(null)}>
            <div className="employee-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="employee-details-header">
                <div className="employee-details-header-content">
                  <div className="employee-details-avatar">
                    {selectedEmployeeData.image_url ? (
                      <img src={selectedEmployeeData.image_url} alt={selectedEmployeeData.username} className="employee-details-avatar-image" />
                    ) : (
                      <div className="employee-details-avatar-placeholder">
                        <span className="employee-details-avatar-icon">👤</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="employee-details-title">{selectedEmployeeData.username}</h2>
                    <p className="employee-details-subtitle">פירוט שעות עבודה</p>
                  </div>
                </div>
                <button
                  className="employee-details-close"
                  onClick={() => setSelectedEmployee(null)}
                  type="button"
                >
                  ✕
                </button>
              </div>
              
              <div className="employee-details-content">
                {selectedEmployeeData.logs.length === 0 ? (
                  <p className="employee-details-empty">אין שעות עבודה</p>
                ) : (
                  <div className="employee-sessions-list">
                    {selectedEmployeeData.logs.map((session, idx) => (
                      <div key={session.id || idx} className="employee-session-item">
                        <div className="employee-session-header">
                          <div className="employee-session-date">{session.date}</div>
                          <div className="employee-session-hours-badge">
                            <span className="employee-session-hours-value">{session.hours} שעות</span>
                            {session.isOpen && (
                              <span className="employee-session-open-badge">פתוח</span>
                            )}
                          </div>
                        </div>
                        {editingLogId === session.id ? (
                          <div className="employee-session-edit">
                            <div className="employee-session-edit-row">
                              <label className="employee-session-edit-label">כניסה:</label>
                              <input
                                type="time"
                                className="employee-session-edit-input"
                                value={editClockIn}
                                onChange={(e) => setEditClockIn(e.target.value)}
                              />
                            </div>
                            <div className="employee-session-edit-row">
                              <label className="employee-session-edit-label">יציאה:</label>
                              <input
                                type="time"
                                className="employee-session-edit-input"
                                value={editClockOut}
                                onChange={(e) => setEditClockOut(e.target.value)}
                                placeholder="פתוח"
                              />
                            </div>
                            <div className="employee-session-edit-actions">
                              <button
                                className="employee-session-edit-save"
                                onClick={() => saveEditLog(session.id)}
                                type="button"
                              >
                                שמור
                              </button>
                              <button
                                className="employee-session-edit-cancel"
                                onClick={cancelEditLog}
                                type="button"
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="employee-session-times">
                              <div className="employee-session-time-item">
                                <span className="employee-session-time-label">כניסה:</span>
                                <span className="employee-session-time-value">{session.timeIn}</span>
                              </div>
                              <div className="employee-session-time-item">
                                <span className="employee-session-time-label">יציאה:</span>
                                <span className="employee-session-time-value">{session.timeOut}</span>
                              </div>
                            </div>
                            <button
                              className="employee-session-edit-button"
                              onClick={() => startEditLog(session)}
                              type="button"
                            >
                              ערוך
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeManagementScreen

