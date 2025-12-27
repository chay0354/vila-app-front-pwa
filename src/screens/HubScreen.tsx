import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './HubScreen.css'

type Order = {
  id: string
  totalAmount: number
  paidAmount: number
  status: string
}

type Invoice = {
  id: string
  total_price?: number | null
  extracted_data?: any
}

type HubScreenProps = {
  userName: string
  userRole?: string | null
  userImageUrl?: string | null
}

function HubScreen({ userName, userRole, userImageUrl }: HubScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    loadOrders()
    loadInvoices()
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

  const loadInvoices = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices`)
      if (!res.ok) {
        console.error('Failed to load invoices:', res.status)
        return
      }
      const data = await res.json()
      // Parse extracted_data if it's a string
      const parsedInvoices = (data || []).map((inv: any) => {
        let extractedData = inv.extracted_data
        if (typeof extractedData === 'string') {
          try {
            extractedData = JSON.parse(extractedData)
          } catch {
            extractedData = null
          }
        }
        return {
          ...inv,
          extracted_data: extractedData,
        }
      })
      setInvoices(parsedInvoices)
    } catch (err) {
      console.error('Error loading invoices:', err)
    }
  }

  const totals = useMemo(() => {
    const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
    return { count: orders.length, totalPaid }
  }, [orders])

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.totalAmount, 0)
  }, [orders])

  const totalExpenses = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      // Try to get amount from extracted_data first (simplified schema)
      let amount = 0
      const extractedData = invoice.extracted_data
      if (extractedData) {
        if (typeof extractedData === 'object' && extractedData !== null) {
          amount = extractedData.total_price || 0
        }
      }
      // Fallback to invoice-level total_price
      if (!amount) {
        amount = invoice.total_price || 0
      }
      return sum + (typeof amount === 'number' ? amount : 0)
    }, 0)
  }, [invoices])


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

        {userRole === 'מנהל' && (
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
              <div className="hub-stat-value">₪{totalExpenses.toLocaleString('he-IL')}</div>
              <div className="hub-stat-label">הוצאות</div>
            </div>
          </div>
        )}

        <div className="hub-welcome-section">
          <div className="hub-welcome-card">
            <div className="hub-welcome-avatar">
              {userImageUrl ? (
                <img src={userImageUrl} alt={userName} className="hub-welcome-avatar-image" />
              ) : (
                <div className="hub-welcome-avatar-placeholder">
                  <span className="hub-welcome-avatar-icon">👤</span>
                </div>
              )}
            </div>
            <div className="hub-welcome-content">
              <h2 className="hub-welcome-title">שלום {userName}</h2>
              <p className="hub-welcome-subtitle">ברוך הבא למערכת הניהול</p>
            </div>
          </div>
        </div>

        <div className="hub-quick-actions">
          <h2 className="hub-section-title">אפשרויות</h2>
          <div className="hub-quick-actions-row">
            {userRole === 'מנהל' && (
              <button
                className="hub-quick-action-btn hub-quick-action-blue"
                onClick={() => navigate('/orders')}
                type="button"
              >
                <span className="hub-quick-action-icon">📑</span>
                <span className="hub-quick-action-text">הזמנות</span>
              </button>
            )}
            <button
              className="hub-quick-action-btn hub-quick-action-orange"
              onClick={() => navigate('/exit-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">🧹</span>
              <span className="hub-quick-action-text">ביקורת יציאה</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-lime"
              onClick={() => navigate('/cleaning-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">✨</span>
              <span className="hub-quick-action-text">ביקורת ניקיון</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-amber"
              onClick={() => navigate('/monthly-inspections')}
              type="button"
            >
              <span className="hub-quick-action-icon">📅</span>
              <span className="hub-quick-action-text">ביקורות חודשיות</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-purple"
              onClick={() => navigate('/warehouse')}
              type="button"
            >
              <span className="hub-quick-action-icon">📦</span>
              <span className="hub-quick-action-text">מחסן</span>
            </button>
            <button
              className="hub-quick-action-btn hub-quick-action-green"
              onClick={() => navigate('/maintenance')}
              type="button"
            >
              <span className="hub-quick-action-icon">🛠️</span>
              <span className="hub-quick-action-text">תחזוקה</span>
            </button>
            {userRole === 'מנהל' && (
              <>
                <button
                  className="hub-quick-action-btn hub-quick-action-indigo"
                  onClick={() => navigate('/reports')}
                  type="button"
                >
                  <span className="hub-quick-action-icon">📊</span>
                  <span className="hub-quick-action-text">דוחות</span>
                </button>
                <button
                  className="hub-quick-action-btn hub-quick-action-cyan"
                  onClick={() => navigate('/invoices')}
                  type="button"
                >
                  <span className="hub-quick-action-icon">🧾</span>
                  <span className="hub-quick-action-text">חשבוניות</span>
                </button>
              </>
            )}
            {userRole === 'מנהל' ? (
              <button
                className="hub-quick-action-btn hub-quick-action-pink"
                onClick={() => navigate('/employee-management')}
                type="button"
              >
                <span className="hub-quick-action-icon">👥</span>
                <span className="hub-quick-action-text">ניהול עובדים</span>
              </button>
            ) : (
              <button
                className="hub-quick-action-btn hub-quick-action-pink"
                onClick={() => navigate('/attendance')}
                type="button"
              >
                <span className="hub-quick-action-icon">⏱️</span>
                <span className="hub-quick-action-text">שעון נוכחות</span>
              </button>
            )}
            <button
              className="hub-quick-action-btn hub-quick-action-teal"
              onClick={() => navigate('/cleaning-schedule')}
              type="button"
            >
              <span className="hub-quick-action-icon">🧹</span>
              <span className="hub-quick-action-text">סידורי ניקיון</span>
            </button>
          </div>
        </div>

        {/* Chat button at bottom - full width */}
        <div className="hub-chat-section">
          <button
            className="hub-chat-button"
            onClick={() => navigate('/chat')}
            type="button"
          >
            <span className="hub-quick-action-icon">💬</span>
            <span className="hub-quick-action-text">צ׳אט פנימי</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HubScreen

