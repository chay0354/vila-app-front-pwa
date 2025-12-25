import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Warehouse, WarehouseItem } from '../types/warehouse'
import './WarehouseInventoryDetailScreen.css'

type WarehouseInventoryDetailScreenProps = {
  userName: string
}

function WarehouseInventoryDetailScreen({}: WarehouseInventoryDetailScreenProps) {
  const navigate = useNavigate()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<string>('')

  useEffect(() => {
    if (warehouseId) {
      loadWarehouse()
      loadWarehouseItems(warehouseId)
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

  const loadWarehouseItems = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses/${id}/items`)
      if (res.ok) {
        const data = await res.json()
        setItems(data || [])
      }
    } catch (err) {
      console.error('Error loading warehouse items:', err)
    }
  }

  const handleEditQuantity = (item: WarehouseItem) => {
    setEditingItemId(item.id)
    setEditQuantity(item.quantity.toString())
  }

  const handleSaveQuantity = async (item: WarehouseItem) => {
    const quantity = parseInt(editQuantity)
    if (isNaN(quantity) || quantity < 0) {
      alert('אנא הזינו כמות תקינה')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses/${item.warehouse_id}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לעדכן את הכמות')
        return
      }
      if (warehouseId) {
        await loadWarehouseItems(warehouseId)
      }
      setEditingItemId(null)
      setEditQuantity('')
    } catch (err: any) {
      console.error('Error updating warehouse item:', err)
      alert(err.message || 'אירעה שגיאה בעדכון הכמות')
    }
  }

  if (!warehouse) {
    return (
      <div className="warehouse-inventory-detail-container">
        <div className="warehouse-inventory-detail-header">
          <button className="warehouse-inventory-detail-back-button" onClick={() => navigate('/warehouse/inventory')}>
            ← חזרה
          </button>
        </div>
        <div className="warehouse-inventory-detail-scroll">
          <p>טוען...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="warehouse-inventory-detail-container">
      <div className="warehouse-inventory-detail-header">
        <button className="warehouse-inventory-detail-back-button" onClick={() => navigate('/warehouse/inventory')}>
          ← חזרה
        </button>
      </div>
      <div className="warehouse-inventory-detail-scroll">
        <div className="warehouse-inventory-detail-title-section">
          <div>
            <h1 className="warehouse-inventory-detail-title">{warehouse.name}</h1>
            <p className="warehouse-inventory-detail-subtitle">
              {warehouse.location || 'מחסן'}
            </p>
          </div>
        </div>

        <div className="warehouse-inventory-detail-actions-row">
          <h2 className="warehouse-inventory-detail-section-title">מוצרים במחסן</h2>
          <button
            className="warehouse-inventory-detail-add-button"
            onClick={() => navigate(`/warehouse/inventory/${warehouseId}/new-item`)}
          >
            + מוצר חדש
          </button>
        </div>

        {items.length === 0 ? (
          <div className="warehouse-inventory-detail-empty-state">
            <p className="warehouse-inventory-detail-empty-state-text">אין מוצרים במחסן זה</p>
            <p className="warehouse-inventory-detail-empty-state-subtext">
              לחצו על "מוצר חדש" כדי להוסיף
            </p>
          </div>
        ) : (
          <div className="warehouse-inventory-detail-items-list">
            {items.map(item => (
              <div key={item.id} className="warehouse-inventory-detail-item-card">
                <div className="warehouse-inventory-detail-item-info">
                  <h3 className="warehouse-inventory-detail-item-name">{item.item_name}</h3>
                  <p className="warehouse-inventory-detail-item-unit">{item.unit}</p>
                </div>
                {editingItemId === item.id ? (
                  <div className="warehouse-inventory-detail-item-edit">
                    <input
                      type="number"
                      className="warehouse-inventory-detail-item-quantity-input"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      placeholder="כמות"
                    />
                    <button
                      className="warehouse-inventory-detail-item-save-button"
                      onClick={() => handleSaveQuantity(item)}
                    >
                      שמור
                    </button>
                    <button
                      className="warehouse-inventory-detail-item-cancel-button"
                      onClick={() => {
                        setEditingItemId(null)
                        setEditQuantity('')
                      }}
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div className="warehouse-inventory-detail-item-actions">
                    <span className="warehouse-inventory-detail-item-quantity">
                      כמות: {item.quantity}
                    </span>
                    <button
                      className="warehouse-inventory-detail-item-edit-button"
                      onClick={() => handleEditQuantity(item)}
                    >
                      ערוך
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WarehouseInventoryDetailScreen

