import { useNavigate } from 'react-router-dom'
import './HomeScreen.css'

function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <div className="home-background">
        <div className="home-overlay" />
        
        <div className="home-top-bar">
          <div className="home-brand-badge">
            <div className="home-brand-dot" />
            <span className="home-brand-text">Seisignes</span>
          </div>
          <div className="home-top-chip">
            <span className="home-top-chip-text">מתחם נופש בוטיק</span>
          </div>
        </div>

        <div className="home-hero-scroll">
          <div className="home-hero-copy">
            <p className="home-kicker">חלון ניהול חכם</p>
            <h1 className="home-hero-heading">Seisignes Retreat</h1>
            <p className="home-hero-body">
              ניהול אורחים, הזמנות ותחזוקה מתוך ממשק אחד אלגנטי. שליטה מלאה
              במצב המתחם, תשלומים ועדכוני צוות בזמן אמת.
            </p>
          </div>

          <div className="home-cta-card">
            <h2 className="home-cta-title">התחברות מהירה</h2>
            <div className="home-cta-buttons">
              <button
                className="home-cta-primary"
                onClick={() => navigate('/signin')}
                type="button"
              >
                כניסה
              </button>
              <button
                className="home-cta-outline"
                onClick={() => navigate('/signup')}
                type="button"
              >
                הרשמה
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen

