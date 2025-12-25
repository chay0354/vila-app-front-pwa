import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Warehouse } from '../types/warehouse'
import './WarehouseInventoryScreen.css'

type WarehouseInventoryScreenProps = {
  userName: string
}

function WarehouseInventoryScreen({}: WarehouseInventoryScreenProps) {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/warehouses`)
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data || [])
      }
    } catch (err) {
      console.error('Error loading warehouses:', err)
    }
  }

  return (
    <div className="warehouse-inventory-container">
      <div className="warehouse-inventory-header">
        <button className="warehouse-inventory-back-button" onClick={() => navigate('/warehouse')}>
          ← חזרה
        </button>
      </div>
      <div className="warehouse-inventory-scroll">
        <div className="warehouse-inventory-title-section">
          <div>
            <h1 className="warehouse-inventory-title">מלאים</h1>
            <p className="warehouse-inventory-subtitle">
              ניהול מלאי המחסנים
            </p>
          </div>
        </div>

        <div className="warehouse-inventory-actions-row">
          <h2 className="warehouse-inventory-section-title">מחסנים</h2>
          <button
            className="warehouse-inventory-add-button"
            onClick={() => navigate('/warehouse/inventory/new')}
          >
            + מחסן חדש
          </button>
        </div>

        {warehouses.length === 0 ? (
          <div className="warehouse-inventory-empty-state">
            <p className="warehouse-inventory-empty-state-text">אין מחסנים כרגע</p>
            <p className="warehouse-inventory-empty-state-subtext">
              לחצו על "מחסן חדש" כדי להתחיל
            </p>
          </div>
        ) : (
          <div className="warehouse-inventory-list">
            {warehouses.map(warehouse => (
              <button
                key={warehouse.id}
                className="warehouse-inventory-card"
                onClick={() => navigate(`/warehouse/inventory/${warehouse.id}`)}
              >
                <div className="warehouse-inventory-card-icon">
                  <span className="warehouse-inventory-card-icon-text">📦</span>
                </div>
                <div className="warehouse-inventory-card-content">
                  <h3 className="warehouse-inventory-card-name">{warehouse.name}</h3>
                  {warehouse.location && (
                    <p className="warehouse-inventory-card-location">{warehouse.location}</p>
                  )}
                </div>
                <span className="warehouse-inventory-card-arrow">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WarehouseInventoryScreen

