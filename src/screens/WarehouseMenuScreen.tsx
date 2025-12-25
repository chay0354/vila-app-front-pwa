import { useNavigate } from 'react-router-dom'
import './WarehouseMenuScreen.css'

type WarehouseMenuScreenProps = {
  userName: string
}

function WarehouseMenuScreen({}: WarehouseMenuScreenProps) {
  const navigate = useNavigate()

  return (
    <div className="warehouse-menu-container">
      <div className="warehouse-menu-header">
        <button className="warehouse-menu-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
      </div>
      <div className="warehouse-menu-scroll">
        <div className="warehouse-menu-title-section">
          <div>
            <h1 className="warehouse-menu-title">מחסן</h1>
            <p className="warehouse-menu-subtitle">בחרו פעולה</p>
          </div>
        </div>

        <div className="warehouse-menu-options">
          <button
            className="warehouse-menu-option"
            onClick={() => navigate('/warehouse/orders')}
          >
            <div className="warehouse-menu-option-icon">
              <span className="warehouse-menu-option-icon-text">📑</span>
            </div>
            <div className="warehouse-menu-option-content">
              <h3 className="warehouse-menu-option-title">הזמנות</h3>
              <p className="warehouse-menu-option-subtitle">
                הזמנות פנימיות למלאי וצפייה בסטטוס
              </p>
            </div>
            <span className="warehouse-menu-option-arrow">›</span>
          </button>

          <button
            className="warehouse-menu-option"
            onClick={() => navigate('/warehouse/inventory')}
          >
            <div className="warehouse-menu-option-icon">
              <span className="warehouse-menu-option-icon-text">📦</span>
            </div>
            <div className="warehouse-menu-option-content">
              <h3 className="warehouse-menu-option-title">מלאים</h3>
              <p className="warehouse-menu-option-subtitle">
                צפייה במלאי המחסנים
              </p>
            </div>
            <span className="warehouse-menu-option-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WarehouseMenuScreen

