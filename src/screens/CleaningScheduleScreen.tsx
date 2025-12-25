import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { CleaningScheduleEntry } from '../types/cleaningSchedule'
import './CleaningScheduleScreen.css'

type CleaningScheduleScreenProps = {
  userName: string
}

function CleaningScheduleScreen({}: CleaningScheduleScreenProps) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<CleaningScheduleEntry[]>([])
  const [, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [cleanerName, setCleanerName] = useState<string>('')
  const [editingEntry, setEditingEntry] = useState<CleaningScheduleEntry | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  useEffect(() => {
    loadScheduleEntries()
  }, [])

  const loadScheduleEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/cleaning-schedule`)
      if (!response.ok) {
        // If 404 or 500, the table might not exist yet - just use empty array
        if (response.status === 404 || response.status === 500) {
          console.log('Cleaning schedule table may not exist yet, using empty array')
          setEntries([])
          return
        }
        throw new Error(`Failed to load schedule: ${response.status}`)
      }
      const data = await response.json()
      setEntries(data || [])
    } catch (err: any) {
      console.error('Error loading schedule:', err)
      // Don't show alert for network errors or 404 - just use empty array
      if (err.message && (err.message.includes('Network') || err.message.includes('fetch'))) {
        console.log('Network error loading schedule, using empty array')
        setEntries([])
      } else if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {
        console.log('Cleaning schedule table does not exist yet, using empty array')
        setEntries([])
      } else {
        // Only show alert for unexpected errors
        let errorMessage = 'לא ניתן לטעון את לוח הזמנים'
        try {
          if (err.message) {
            const errorMatch = err.message.match(/\{.*\}/)
            if (errorMatch) {
              const errorJson = JSON.parse(errorMatch[0])
              if (errorJson.detail && errorJson.detail.includes('404')) {
                // Table doesn't exist - don't show error, just use empty array
                setEntries([])
                return
              }
            }
          }
        } catch {
          // Keep default error message
        }
        alert(errorMessage)
        setEntries([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async () => {
    // When adding, selectedDate is already set from the day selection
    // When editing, selectedDate should be set from the entry
    if (!selectedDate || !startTime || !endTime || !cleanerName.trim()) {
      alert('יש למלא את כל השדות')
      return
    }

    try {
      const entryData = {
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        cleaner_name: cleanerName.trim(),
      }

      let response
      if (editingEntry) {
        // Update existing entry
        response = await fetch(`${API_BASE_URL}/api/cleaning-schedule/${editingEntry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        })
      } else {
        // Create new entry
        response = await fetch(`${API_BASE_URL}/api/cleaning-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        })
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        let errorMessage = errorText || 'Failed to save entry'
        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.detail) {
            errorMessage = errorJson.detail
          }
        } catch {
          // Keep original errorMessage
        }
        // Don't show alert for 404 (table doesn't exist) - just log it
        if (response.status === 404) {
          console.log('Cleaning schedule table does not exist yet')
          alert('טבלת סידורי הניקיון לא קיימת. יש ליצור את הטבלה ב-Supabase תחילה.')
        } else {
          throw new Error(errorMessage)
        }
        return
      }

      await loadScheduleEntries()
      setShowAddModal(false)
      setSelectedDate('')
      setStartTime('')
      setEndTime('')
      setCleanerName('')
      setEditingEntry(null)
    } catch (err: any) {
      let errorMessage = err.message || 'לא ניתן לשמור את הרשומה'
      // Parse JSON error if present
      try {
        if (err.message) {
          const errorMatch = err.message.match(/\{.*\}/)
          if (errorMatch) {
            const errorJson = JSON.parse(errorMatch[0])
            if (errorJson.detail) {
              if (errorJson.detail.includes('404') || errorJson.detail.includes('Not Found')) {
                errorMessage = 'טבלת סידורי הניקיון לא קיימת. יש ליצור את הטבלה ב-Supabase תחילה.'
              } else {
                errorMessage = errorJson.detail
              }
            }
          }
        }
      } catch {
        // Keep original error message
      }
      alert(errorMessage)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הרשומה?')) {
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/cleaning-schedule/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      await loadScheduleEntries()
    } catch (err: any) {
      alert('לא ניתן למחוק את הרשומה')
    }
  }

  const handleEditEntry = (entry: CleaningScheduleEntry) => {
    setEditingEntry(entry)
    setSelectedDate(entry.date)
    setStartTime(entry.start_time)
    setEndTime(entry.end_time)
    setCleanerName(entry.cleaner_name)
    setShowAddModal(true)
  }

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getEntriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return entries.filter(e => e.date === dateStr).sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    )
  }

  const formatDate = (date: Date) => {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    return dayNames[date.getDay()]
  }

  const formatDateShort = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newDate)
  }

  const weekDays = getWeekDays()

  return (
    <div className="cleaning-schedule-container">
      <div className="cleaning-schedule-header">
        <button className="cleaning-schedule-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
        <h1 className="cleaning-schedule-page-title">סידורי ניקיון</h1>
      </div>

      <div className="cleaning-schedule-scroll">
        <div className="cleaning-schedule-container-inner">
          {/* Week Navigation */}
          <div className="week-navigation">
            <button className="week-nav-button" onClick={() => navigateWeek('prev')}>
              ← שבוע קודם
            </button>
            <span className="week-title">
              {formatDateShort(weekDays[0])} - {formatDateShort(weekDays[6])}
            </span>
            <button className="week-nav-button" onClick={() => navigateWeek('next')}>
              שבוע הבא →
            </button>
          </div>

          {/* Schedule Grid */}
          <div className="schedule-grid">
            {weekDays.map((day, index) => {
              const dayEntries = getEntriesForDate(day)
              const isToday = day.toDateString() === new Date().toDateString()
              
              return (
                <div key={index} className="schedule-day">
                  <div className={`schedule-day-header ${isToday ? 'schedule-day-header-today' : ''}`}>
                    <p className={`schedule-day-name ${isToday ? 'schedule-day-name-today' : ''}`}>
                      {formatDate(day)}
                    </p>
                    <p className={`schedule-day-date ${isToday ? 'schedule-day-date-today' : ''}`}>
                      {formatDateShort(day)}
                    </p>
                  </div>
                  <div className="schedule-day-content">
                    {dayEntries.length === 0 ? (
                      <p className="schedule-empty-text">אין תורים</p>
                    ) : (
                      dayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="schedule-entry"
                          onClick={() => handleEditEntry(entry)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            handleDeleteEntry(entry.id)
                          }}
                        >
                          <p className="schedule-entry-time">
                            {entry.start_time} - {entry.end_time}
                          </p>
                          <p className="schedule-entry-cleaner">{entry.cleaner_name}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    className="add-entry-button"
                    onClick={() => {
                      setSelectedDate(day.toISOString().split('T')[0])
                      setEditingEntry(null)
                      setStartTime('')
                      setEndTime('')
                      setCleanerName('')
                      setShowAddModal(true)
                    }}
                  >
                    + הוסף
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false)
          setEditingEntry(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingEntry ? 'ערוך רשומה' : 'הוסף רשומה חדשה'}
            </h2>

            {/* Only show date field when editing, not when adding (date is already selected) */}
            {editingEntry && (
              <div className="field">
                <label className="label">תאריך *</label>
                <input
                  className="input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}

            {!editingEntry && selectedDate && (
              <div className="field">
                <label className="label">תאריך נבחר</label>
                <p className="input-readonly">{selectedDate}</p>
              </div>
            )}

            <div className="field">
              <label className="label">שעת התחלה *</label>
              <input
                className="input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="HH:MM (לדוגמה: 09:00)"
              />
            </div>

            <div className="field">
              <label className="label">שעת סיום *</label>
              <input
                className="input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="HH:MM (לדוגמה: 12:00)"
              />
            </div>

            <div className="field">
              <label className="label">שם מנקה *</label>
              <input
                className="input"
                type="text"
                value={cleanerName}
                onChange={(e) => setCleanerName(e.target.value)}
                placeholder="הזן שם מנקה"
                dir="rtl"
              />
            </div>

            <div className="modal-buttons">
              <button
                className="modal-button form-button-primary"
                onClick={handleSaveEntry}
              >
                שמור
              </button>
              <button
                className="modal-button form-button-secondary"
                onClick={() => {
                  setShowAddModal(false)
                  setEditingEntry(null)
                  setSelectedDate('')
                  setStartTime('')
                  setEndTime('')
                  setCleanerName('')
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CleaningScheduleScreen

