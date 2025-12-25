import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order } from '../types/orders'
import OrderCard from '../components/OrderCard'
import './OrdersScreen.css'

type OrdersScreenProps = {
  userName: string
}

function OrdersScreen({ userName }: OrdersScreenProps) {
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
        guestName: o.guest_name ?? o.guestName ?? '',
        unitNumber: o.unit_number ?? o.unitNumber ?? '',
        arrivalDate: o.arrival_date ?? o.arrivalDate ?? '',
        departureDate: o.departure_date ?? o.departureDate ?? '',
        status: (o.status ?? 'חדש') as Order['status'],
        guestsCount: Number(o.guests_count ?? o.guestsCount ?? 0),
        specialRequests: o.special_requests ?? o.specialRequests ?? '',
        internalNotes: o.internal_notes ?? o.internalNotes ?? '',
        paidAmount: Number(o.paid_amount ?? o.paidAmount ?? 0),
        totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
        paymentMethod: o.payment_method ?? o.paymentMethod ?? 'לא צוין',
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

  const createOrder = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const newOrderData = {
        guest_name: '',
        unit_number: '',
        arrival_date: today,
        departure_date: nextWeek,
        status: 'חדש',
        guests_count: 0,
        special_requests: '',
        internal_notes: '',
        paid_amount: 0,
        total_amount: 0,
        payment_method: null,
      }

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן ליצור הזמנה')
        return
      }

      const createdOrder = await res.json()

      // Map backend order to frontend order format
      const mappedOrder: Order = {
        id: createdOrder.id,
        guestName: createdOrder.guest_name || '',
        unitNumber: createdOrder.unit_number || '',
        arrivalDate: createdOrder.arrival_date || today,
        departureDate: createdOrder.departure_date || nextWeek,
        status: (createdOrder.status || 'חדש') as Order['status'],
        guestsCount: createdOrder.guests_count || 0,
        specialRequests: createdOrder.special_requests || '',
        internalNotes: createdOrder.internal_notes || '',
        paidAmount: createdOrder.paid_amount || 0,
        totalAmount: createdOrder.total_amount || 0,
        paymentMethod: createdOrder.payment_method || 'לא צוין',
      }

      setOrders(prev => [...prev, mappedOrder])
      navigate(`/orders/${mappedOrder.id}`)
    } catch (err: any) {
      console.error('Error creating order:', err)
      alert(err.message || 'אירעה שגיאה ביצירת ההזמנה')
    }
  }


  return (
    <div className="orders-container">
      <div className="orders-header">
        <button
          className="orders-back-button"
          onClick={() => navigate('/hub')}
          type="button"
        >
          ← חזרה
        </button>
      </div>
      <div className="orders-scroll">
        <div className="orders-page-header">
          <h1 className="orders-page-title">הזמנות</h1>
          <p className="orders-page-subtitle">
            שלום {userName}, ניהול הזמנות, תשלומים וסטטוסים
          </p>
          <button
            className="orders-add-button"
            onClick={createOrder}
            type="button"
          >
            + יצירת הזמנה חדשה
          </button>
        </div>

        <div className="orders-summary-card-enhanced">
          <div className="orders-summary-card-header">
            <h2 className="orders-summary-title-enhanced">סיכום מהיר</h2>
          </div>
          <div className="orders-summary-stats-row">
            <div className="orders-summary-stat-item">
              <div className="orders-summary-stat-value">{totals.count}</div>
              <div className="orders-summary-stat-label">הזמנות</div>
            </div>
            <div className="orders-summary-stat-divider" />
            <div className="orders-summary-stat-item">
              <div className="orders-summary-stat-value">
                ₪{totals.totalPaid.toLocaleString('he-IL')}
              </div>
              <div className="orders-summary-stat-label">שולם עד כה</div>
            </div>
          </div>
          <div className="orders-summary-note-container">
            <p className="orders-summary-note-enhanced">
              יצוא לאקסל ודו״ח הוצאות יתווספו בהמשך
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty-state">
            <p className="orders-empty-text">אין הזמנות כרגע</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onEdit={(id) => navigate(`/orders/${id}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default OrdersScreen

