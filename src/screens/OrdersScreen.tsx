import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order, UNIT_NAMES } from '../types/orders'
import OrderCard from '../components/OrderCard'
import './OrdersScreen.css'

type OrdersScreenProps = {
  userName: string
}

function OrdersScreen({ userName }: OrdersScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

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
        createdBy: o.created_by ?? o.createdBy ?? undefined,
        openedBy: o.opened_by ?? o.openedBy ?? undefined,
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

  // Group orders by unit (hotel)
  const ordersByUnit = useMemo(() => {
    // Start with all known units from UNIT_NAMES
    const unitMap = new Map<string, { unitName: string; orders: Order[] }>()
    
    // Initialize all units
    UNIT_NAMES.forEach(unitName => {
      unitMap.set(unitName, { unitName, orders: [] })
    })
    
    // Add orders to their respective units
    orders.forEach(order => {
      const unitName = order.unitNumber || 'לא צוין'
      const unit = unitMap.get(unitName) || { unitName, orders: [] }
      unit.orders.push(order)
      unitMap.set(unitName, unit)
    })
    
    // Convert to array and filter out units with no orders (or keep all units)
    return Array.from(unitMap.values())
      .filter(unit => unit.orders.length > 0) // Only show units with orders
      .sort((a, b) => a.unitName.localeCompare(b.unitName))
  }, [orders])

  const getUnitStats = (unitOrders: Order[]) => {
    const total = unitOrders.length
    const paid = unitOrders.filter(o => 
      o.status === 'שולם' || (o.totalAmount > 0 && o.paidAmount >= o.totalAmount)
    ).length
    const unpaid = total - paid
    return { total, paid, unpaid }
  }

  const handleCloseOrder = async (orderId: string, paymentMethod: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'שולם',
          payment_method: paymentMethod,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || 'לא ניתן לסגור את ההזמנה')
        return
      }

      // Reload orders to reflect the change
      await loadOrders()
    } catch (err: any) {
      console.error('Error closing order:', err)
      alert(err.message || 'אירעה שגיאה בסגירת ההזמנה')
    }
  }

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
        opened_by: userName || undefined,
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
          onClick={() => {
            if (selectedUnit) {
              setSelectedUnit(null)
            } else {
              navigate('/hub')
            }
          }}
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
        ) : selectedUnit ? (
          <div>
            <div className="orders-unit-header">
              <h2 className="orders-unit-title">הזמנות - {selectedUnit}</h2>
            </div>
            <div className="orders-list">
              {orders
                .filter(order => order.unitNumber === selectedUnit)
                .map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onEdit={(id) => navigate(`/orders/${id}`)}
                    onClose={handleCloseOrder}
                  />
                ))}
            </div>
          </div>
        ) : (
          <div className="orders-units-grid">
            {ordersByUnit.map(unit => {
              const stats = getUnitStats(unit.orders)
              return (
                <div
                  key={unit.unitName}
                  className="orders-unit-card"
                  onClick={() => setSelectedUnit(unit.unitName)}
                >
                  <div className="orders-unit-card-header">
                    <div className="orders-unit-icon">
                      <span className="orders-unit-icon-text">🏠</span>
                    </div>
                    <div className="orders-unit-card-content">
                      <h3 className="orders-unit-card-name">{unit.unitName}</h3>
                      <p className="orders-unit-card-type">יחידת נופש</p>
                    </div>
                  </div>
                  <div className="orders-unit-stats">
                    <div className="orders-unit-stat-item">
                      <span className="orders-unit-stat-value">{stats.total}</span>
                      <span className="orders-unit-stat-label">סה״כ הזמנות</span>
                    </div>
                    <div className="orders-unit-stat-item">
                      <span className="orders-unit-stat-value" style={{ color: '#22c55e' }}>
                        {stats.paid}
                      </span>
                      <span className="orders-unit-stat-label">שולם</span>
                    </div>
                    <div className="orders-unit-stat-item">
                      <span className="orders-unit-stat-value" style={{ color: '#f59e0b' }}>
                        {stats.unpaid}
                      </span>
                      <span className="orders-unit-stat-label">לא שולם</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersScreen

