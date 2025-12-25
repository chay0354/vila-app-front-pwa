import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Warehouse } from '../types/warehouse'
import './NewWarehouseItemScreen.css'

type NewWarehouseItemScreenProps = {
  userName: string
}

function NewWarehouseItemScreen({}: NewWarehouseItemScreenProps) {
  const navigate = useNavigate()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [unit, setUnit] = useState('יחידה')

  useEffect(() => {
    if (warehouseId) {
      loadWarehouse()
    }
  }, [warehouseId])

  const loadWarehouse = async () => {
    if (!warehouseId) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses`)
      if (res.ok) {
        const data = await res.json()
        const found = (data || []).find((w: Warehouse) => w.id === warehouseId)
        setWarehouse(found || null)
      }
    } catch (err) {
      console.error('Error loading warehouse:', err)
    }
  }

  const handleSave = async () => {
    if (!itemName.trim()) {
      alert('אנא הזינו שם מוצר')
      return
    }
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty < 0) {
      alert('אנא הזינו כמות תקינה')
      return
    }
    if (!unit.trim()) {
      alert('אנא הזינו יחידה')
      return
    }
    if (!warehouseId) {
      alert('שגיאה: מחסן לא נמצא')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses/${warehouseId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName.trim(),
          quantity: qty,
          unit: unit.trim(),
        }),
      })
      if (!res.ok) {
        const errorText = await res.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText || 'שגיאה לא ידועה' }
        }
        const errorMsg = errorData.detail || errorData.message || 'לא ניתן להוסיף מוצר'
        alert(errorMsg)
        return
      }
      navigate(`/warehouse/inventory/${warehouseId}`)
    } catch (err: any) {
      console.error('Error creating warehouse item:', err)
      alert(err.message || 'אירעה שגיאה בהוספת המוצר')
    }
  }

  if (!warehouse) {
    return (
      <div className="new-warehouse-item-container">
        <div className="new-warehouse-item-header">
          <button className="new-warehouse-item-back-button" onClick={() => navigate('/warehouse/inventory')}>
            ← חזרה
          </button>
        </div>
        <div className="new-warehouse-item-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="new-warehouse-item-container">
      <div className="new-warehouse-item-header">
        <button className="new-warehouse-item-back-button" onClick={() => navigate(`/warehouse/inventory/${warehouseId}`)}>
          ← חזרה
        </button>
      </div>
      <div className="new-warehouse-item-scroll">
        <div className="new-warehouse-item-title-section">
          <div>
            <h1 className="new-warehouse-item-title">מוצר חדש</h1>
            <p className="new-warehouse-item-subtitle">
              הוספת מוצר ל{warehouse.name}
            </p>
          </div>
        </div>

        <div className="new-warehouse-item-form-section">
          <label className="new-warehouse-item-form-label">שם מוצר *</label>
          <input
            type="text"
            className="new-warehouse-item-form-input"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="לדוגמה: חומר ניקוי"
            dir="rtl"
          />

          <label className="new-warehouse-item-form-label">כמות *</label>
          <input
            type="number"
            className="new-warehouse-item-form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            dir="rtl"
          />

          <label className="new-warehouse-item-form-label">יחידה *</label>
          <input
            type="text"
            className="new-warehouse-item-form-input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="לדוגמה: ליטר, יחידה, קילוגרם"
            dir="rtl"
          />
          <p className="new-warehouse-item-form-hint">
            דוגמאות: ליטר, יחידה, קילוגרם, רול, חבילה
          </p>
        </div>

        <div className="new-warehouse-item-form-actions">
          <button
            className="new-warehouse-item-form-button new-warehouse-item-form-button-primary"
            onClick={handleSave}
          >
            שמור
          </button>
          <button
            className="new-warehouse-item-form-button new-warehouse-item-form-button-secondary"
            onClick={() => navigate(`/warehouse/inventory/${warehouseId}`)}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewWarehouseItemScreen

