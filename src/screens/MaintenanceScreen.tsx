import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { MaintenanceUnit, MaintenanceTask } from '../types/maintenance'
import { getInitialMaintenanceUnits, normalizeMaintenanceUnitId } from '../utils/maintenanceUtils'
import './MaintenanceScreen.css'

type MaintenanceScreenProps = {
  userName: string
}

function MaintenanceScreen({}: MaintenanceScreenProps) {
  const navigate = useNavigate()
  const [units, setUnits] = useState<MaintenanceUnit[]>(getInitialMaintenanceUnits())

  useEffect(() => {
    loadMaintenanceUnits()
  }, [])

  const loadMaintenanceUnits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) return
      const data = (await res.json()) || []

      // Keep the 10 units always visible, and attach tasks by unit_id
      const baseUnits = getInitialMaintenanceUnits()
      const byId = new Map<string, MaintenanceUnit>()
      baseUnits.forEach(u => byId.set(u.id, u))

      ;(data || []).forEach((t: any) => {
        const unitId = normalizeMaintenanceUnitId(t.unit_id || t.unitId || t.unit)
        const unit = byId.get(unitId) || byId.get('unit-1')
        if (!unit) return

        const task = {
          id: (t.id || `task-${Date.now()}`).toString(),
          unitId,
          title: (t.title || '').toString(),
          description: (t.description || '').toString(),
          status: (t.status || 'פתוח') as MaintenanceUnit['tasks'][0]['status'],
          createdDate: (t.created_date || t.createdDate || new Date().toISOString().split('T')[0]).toString(),
          assignedTo: (t.assigned_to || t.assignedTo || undefined)?.toString(),
          imageUri: (t.image_uri || t.imageUri || undefined)?.toString(),
        }

        unit.tasks.push(task)
      })

      // Sort tasks newest first per unit
      baseUnits.forEach(u => {
        u.tasks.sort((a: MaintenanceTask, b: MaintenanceTask) => (b.createdDate || '').localeCompare(a.createdDate || ''))
      })

      setUnits(baseUnits)
    } catch (err) {
      console.error('Error loading maintenance units:', err)
    }
  }

  const getUnitStats = (unit: MaintenanceUnit) => {
    const open = unit.tasks.filter(t => t.status === 'פתוח').length
    const closed = unit.tasks.filter(t => t.status === 'סגור').length
    return { open, closed, total: unit.tasks.length }
  }

  return (
    <div className="maintenance-container">
      <div className="maintenance-header">
        <button className="maintenance-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
      </div>
      <div className="maintenance-scroll">
        <div className="maintenance-title-section">
          <div>
            <h1 className="maintenance-title">תחזוקה</h1>
            <p className="maintenance-subtitle">ניהול משימות תחזוקה ליחידות נופש</p>
          </div>
        </div>

        <div className="maintenance-units-grid">
          {units.map(unit => {
            const stats = getUnitStats(unit)
            return (
              <div
                key={unit.id}
                className="maintenance-unit-card"
                onClick={() => navigate(`/maintenance/${unit.id}/tasks`)}
              >
                <div className="maintenance-unit-card-header">
                  <div className="maintenance-unit-icon">
                    <span className="maintenance-unit-icon-text">
                      {unit.type === 'יחידה' ? '🏠' : '🏡'}
                    </span>
                  </div>
                  <div className="maintenance-unit-card-content">
                    <h3 className="maintenance-unit-card-name">{unit.name}</h3>
                    <p className="maintenance-unit-card-type">{unit.type}</p>
                  </div>
                </div>
                <div className="maintenance-unit-stats">
                  <div className="maintenance-unit-stat-item">
                    <span className="maintenance-unit-stat-value">{stats.total}</span>
                    <span className="maintenance-unit-stat-label">סה״כ משימות</span>
                  </div>
                  <div className="maintenance-unit-stat-item">
                    <span className="maintenance-unit-stat-value" style={{ color: '#f59e0b' }}>
                      {stats.open}
                    </span>
                    <span className="maintenance-unit-stat-label">פתוחות</span>
                  </div>
                  <div className="maintenance-unit-stat-item">
                    <span className="maintenance-unit-stat-value" style={{ color: '#22c55e' }}>
                      {stats.closed}
                    </span>
                    <span className="maintenance-unit-stat-label">סגורות</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MaintenanceScreen

