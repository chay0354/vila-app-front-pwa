import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './HomeScreen.css'

type Order = {
  id: string
  paidAmount: number
}

function HomeScreen() {
  const navigate = useNavigate()
  const [ordersCount, setOrdersCount] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    // Try to load orders for stats (may fail if not authenticated)
    const loadOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`)
        if (!res.ok) return
        const data = await res.json()
        const orders = (data || []) as Order[]
        setOrdersCount(orders.length)
        const paid = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0)
        setTotalPaid(paid)
      } catch (err) {
        // Silently fail - user might not be logged in
        console.log('Could not load orders for stats:', err)
      }
    }
    loadOrders()
  }, [])

  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('בדיקת התראות', {
        body: 'זוהי הודעת בדיקה. התראות פועלות כהלכה!',
        icon: '/vite.svg',
        dir: 'rtl',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('בדיקת התראות', {
            body: 'זוהי הודעת בדיקה. התראות פועלות כהלכה!',
            icon: '/vite.svg',
            dir: 'rtl',
          })
        }
      })
    } else {
      alert('בדיקת התראות: זוהי הודעת בדיקה. התראות פועלות כהלכה!')
    }
  }

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

          <div className="home-glass-row">
            <div className="home-glass-card">
              <p className="home-glass-title">הזמנות פעילות</p>
              <p className="home-glass-value">{ordersCount}</p>
              <p className="home-glass-small">היום במערכת</p>
            </div>
            <div className="home-glass-card">
              <p className="home-glass-title">תשלומים מאושרים</p>
              <p className="home-glass-value">
                ₪{totalPaid.toLocaleString('he-IL')}
              </p>
              <p className="home-glass-small">עדכון חי</p>
            </div>
          </div>

          <div className="home-cta-card">
            <h2 className="home-cta-title">התחברות מהירה</h2>
            <p className="home-cta-text">
              המשיכו לניהול מלא של Seisignes: ביקורות יציאה, חשבוניות, מחסן
              ותקשורת צוות.
            </p>
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
            <button
              className="home-test-notification-button"
              onClick={handleTestNotification}
              type="button"
            >
              🔔 בדיקת התראות
            </button>
          </div>

          <div className="home-tag-row">
            <div className="home-tag">
              <span className="home-tag-text">זמני הגעה</span>
            </div>
            <div className="home-tag">
              <span className="home-tag-text">ביקורות יציאה</span>
            </div>
            <div className="home-tag">
              <span className="home-tag-text">צ׳אט צוות</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen

