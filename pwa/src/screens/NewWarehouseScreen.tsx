import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './NewWarehouseScreen.css'

type NewWarehouseScreenProps = {
  userName: string
}

function NewWarehouseScreen({}: NewWarehouseScreenProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const handleSave = async () => {
    if (!name.trim()) {
      alert('אנא הזינו שם מחסן')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), location: location.trim() || undefined }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן ליצור מחסן')
        return
      }
      navigate('/warehouse/inventory')
    } catch (err: any) {
      console.error('Error creating warehouse:', err)
      alert(err.message || 'אירעה שגיאה ביצירת המחסן')
    }
  }

  return (
    <div className="new-warehouse-container">
      <div className="new-warehouse-header">
        <button className="new-warehouse-back-button" onClick={() => navigate('/warehouse/inventory')}>
          ← חזרה
        </button>
      </div>
      <div className="new-warehouse-scroll">
        <div className="new-warehouse-title-section">
          <div>
            <h1 className="new-warehouse-title">מחסן חדש</h1>
            <p className="new-warehouse-subtitle">
              הוספת מחסן חדש למערכת
            </p>
          </div>
        </div>

        <div className="new-warehouse-form-section">
          <label className="new-warehouse-form-label">שם מחסן *</label>
          <input
            type="text"
            className="new-warehouse-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: מחסן ראשי"
            dir="rtl"
          />

          <label className="new-warehouse-form-label">מיקום</label>
          <input
            type="text"
            className="new-warehouse-form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="לדוגמה: קומה 1, חדר 101"
            dir="rtl"
          />
        </div>

        <div className="new-warehouse-form-actions">
          <button
            className="new-warehouse-form-button new-warehouse-form-button-primary"
            onClick={handleSave}
          >
            שמור
          </button>
          <button
            className="new-warehouse-form-button new-warehouse-form-button-secondary"
            onClick={() => navigate('/warehouse/inventory')}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewWarehouseScreen

