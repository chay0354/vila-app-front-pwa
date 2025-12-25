import { useNavigate } from 'react-router-dom'
import './InspectionsMenuScreen.css'

type InspectionsMenuScreenProps = {
  userName: string
}

function InspectionsMenuScreen({}: InspectionsMenuScreenProps) {
  const navigate = useNavigate()

  return (
    <div className="inspections-menu-container">
      <div className="inspections-menu-header">
        <button className="inspections-menu-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
      </div>
      <div className="inspections-menu-scroll">
        <div className="inspections-menu-title-section">
          <div>
            <h1 className="inspections-menu-title">ביקורות</h1>
            <p className="inspections-menu-subtitle">בחרו סוג ביקורת</p>
          </div>
        </div>

        <div className="inspections-menu-options">
          <button
            className="inspections-menu-option"
            onClick={() => navigate('/exit-inspections')}
          >
            <div className="inspections-menu-option-icon">
              <span className="inspections-menu-option-icon-text">🚪</span>
            </div>
            <div className="inspections-menu-option-content">
              <h3 className="inspections-menu-option-title">ביקורת יציאת אורח</h3>
              <p className="inspections-menu-option-subtitle">
                משימות ניקיון וביקורת לאחר עזיבת אורחים
              </p>
            </div>
            <span className="inspections-menu-option-arrow">›</span>
          </button>

          <button
            className="inspections-menu-option"
            onClick={() => navigate('/cleaning-inspections')}
          >
            <div className="inspections-menu-option-icon">
              <span className="inspections-menu-option-icon-text">🧹</span>
            </div>
            <div className="inspections-menu-option-content">
              <h3 className="inspections-menu-option-title">ביקורת ניקיון</h3>
              <p className="inspections-menu-option-subtitle">
                משימות ניקיון וביקורת לאחר עזיבת אורחים
              </p>
            </div>
            <span className="inspections-menu-option-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default InspectionsMenuScreen

