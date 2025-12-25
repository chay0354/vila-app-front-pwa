import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import OptionCard from '../components/OptionCard'
import './HubScreen.css'

type Order = {
  id: string
  totalAmount: number
  paidAmount: number
  status: string
}

type HubScreenProps = {
  userName: string
}

function HubScreen({ userName }: HubScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (!res.ok) {
        console.error('Failed to load orders:', res.status)
        return
      }
      const data = await res.json()
      const list = (data || []).map((o: any): Order => ({
        id: o.id,
        totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
        paidAmount: Number(o.paid_amount ?? o.paidAmount ?? 0),
        status: o.status ?? 'חדש',
      }))
      setOrders(list)
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  const totals = useMemo(() => {
    const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
    return { count: orders.length, totalPaid }
  }, [orders])

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalAmount, 0)
  }, [orders])

  const paymentPercent = totalRevenue > 0 ? Math.round((totals.totalPaid / totalRevenue) * 100) : 0

  return (
    <div className="hub-container">
      <div className="hub-scroll">
        <div className="hub-top-row">
          <div className="hub-brand-badge">
            <div className="hub-brand-dot" />
            <span className="hub-brand-text">Seisignes</span>
          </div>
          <div className="hub-user-chip">
            <span className="hub-user-chip-text">שלום {userName}</span>
          </div>
        </div>

        <div className="hub-stats-grid">
          <div className="hub-stat-card hub-stat-card-blue">
            <div className="hub-stat-value">{totals.count}</div>
            <div className="hub-stat-label">מספר הזמנות</div>
          </div>
          <div className="hub-stat-card hub-stat-card-green">
            <div className="hub-stat-value">₪{totalRevenue.toLocaleString('he-IL')}</div>
            <div className="hub-stat-label">הכנסות</div>
          </div>
          <div className="hub-stat-card hub-stat-card-red">
            <div className="hub-stat-value">₪0</div>
            <div className="hub-stat-label">הוצאות</div>
          </div>
        </div>

        <div className="hub-progress-section">
          <h2 className="hub-section-title">סטטוס תשלומים</h2>
          <div className="hub-progress-card">
            <div className="hub-progress-info">
              <span className="hub-progress-label">שולם: ₪{totals.totalPaid.toLocaleString('he-IL')}</span>
              <span className="hub-progress-percent">{paymentPercent}%</span>
            </div>
            <div className="hub-progress-bar-large">
              <div
                className="hub-progress-fill-large"
                style={{ width: `${paymentPercent}%` }}
              />
            </div>
            <div className="hub-progress-note">
              מתוך ₪{totalRevenue.toLocaleString('he-IL')} סה״כ
            </div>
          </div>
        </div>

        <div className="hub-quick-actions">
          <h2 className="hub-section-title">פעולות מהירות</h2>
          <div className="hub-quick-actions-row">
            <button
              className="hub-quick-action-btn hub-quick-action-blue"
              onClick={() => navigate('/orders')}
              type="button"
            >
              <span className="hub-quick-action-icon">📑</span>
              <span className="hub-quick-action-text">הזמנות</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-green"
              onClick={() => navigate('/inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">🧹</span>
              <span className="hub-quick-action-text">ביקורת</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-orange"
              onClick={() => navigate('/maintenance')}
              type="button"
            >
              <span className="hub-quick-action-icon">🛠️</span>
              <span className="hub-quick-action-text">תחזוקה</span>
            </button>
          </div>
        </div>

        <div className="hub-option-grid">
          <OptionCard
            title="הזמנות"
            icon="📑"
            accent="#38bdf8"
            details={[
              'רשימת הזמנות מלאה, פרטי אורח ומספר יחידה',
              'עדכון סכום ששולם, אופן תשלום וסטטוס',
              'סיכום מלא והוצאות כולל יצוא לאקסל',
            ]}
            cta="פתח הזמנות"
            onPress={() => navigate('/orders')}
          />
          <OptionCard
            title="ביקורת יציאה"
            icon="🧹"
            accent="#f97316"
            details={[
              'משימות ניקיון לאחר עזיבה',
              'סטטוסים: צריך ביקורת / בביצוע / הושלם',
            ]}
            cta="פתח ביקורות"
            onPress={() => navigate('/inspections')}
          />
          <OptionCard
            title="מחסן"
            icon="📦"
            accent="#a78bfa"
            details={[
              'רשימת פריטי מלאי: מצעים, מוצרי ניקיון, ציוד מתכלה',
              'יצירת הזמנות פנימיות וצפייה בסטטוס',
              'הזמנות עתידיות ובחירת מתחם',
            ]}
            cta="פתח מחסן"
            onPress={() => navigate('/warehouse')}
          />
          <OptionCard
            title="תחזוקה"
            icon="🛠️"
            accent="#22c55e"
            details={[
              'רשימת יחידות נופש והמצב התחזוקתי',
              'משימות תחזוקה עם תמונות וסטטוס',
              'יצירת משימות חדשות ועדכון קיימות',
            ]}
            cta="פתח תחזוקה"
            onPress={() => navigate('/maintenance')}
          />
          <OptionCard
            title="דוחות"
            icon="דוח"
            accent="#6366f1"
            details={[
              'דוח הזמנות, ביקורות, מחסן, תחזוקה ונוכחות',
              'הכנסות/שולם/הוצאות מהשרת',
            ]}
            cta="פתח דוחות"
            onPress={() => navigate('/reports')}
          />
          <OptionCard
            title="חשבוניות"
            icon="🧾"
            accent="#0ea5e9"
            details={['העלאת PDF/תמונה', 'OCR לזיהוי ספק, תאריך וסכום']}
            cta="פתח חשבוניות"
            onPress={() => navigate('/invoices')}
          />
          <OptionCard
            title="צ׳אט פנימי"
            icon="💬"
            accent="#eab308"
            details={['תקשורת צוות והתראות']}
            cta="פתח צ'אט"
            onPress={() => navigate('/chat')}
          />
          <OptionCard
            title="שעון נוכחות"
            icon="⏱️"
            accent="#ec4899"
            details={['התחלה וסיום עבודה', 'מעקב שעות עבודה']}
            cta="פתח שעון נוכחות"
            onPress={() => navigate('/attendance')}
          />
          <OptionCard
            title="סידורי ניקיון"
            icon="🧹"
            accent="#10b981"
            details={['לוח זמנים לניקיון', 'הוספת מנקים ושעות עבודה']}
            cta="פתח סידורי ניקיון"
            onPress={() => navigate('/cleaning-schedule')}
          />
        </div>
      </div>
    </div>
  )
}

export default HubScreen

