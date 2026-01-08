import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order, OrderStatus, UNIT_NAMES } from '../types/orders'
import OrderCard from '../components/OrderCard'
import './OrdersScreen.css'

type OrdersScreenProps = {
  userName: string
}

function OrdersScreen({ userName }: OrdersScreenProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  // Reload orders when navigating to this page (e.g., returning from payment confirmation)
  useEffect(() => {
    if (location.pathname === '/orders') {
      // Small delay to allow webhook to process payment
      const timer = setTimeout(() => {
        loadOrders()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, location.state])

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
    
    // Convert to array and show all units (not just ones with orders)
    // Filter out "לא צוין" (Not Specified) unit
    return Array.from(unitMap.values())
      .filter(unit => unit.unitName !== 'לא צוין')
      .sort((a, b) => a.unitName.localeCompare(b.unitName))
  }, [orders])

  const getUnitStats = (unitOrders: Order[]) => {
    const total = unitOrders.length
    // Count orders that aren't closed (not "שולם" and not "בוטל")
    const open = unitOrders.filter(o => 
      o.status !== 'שולם' && o.status !== 'בוטל'
    ).length
    return { total, open }
  }

  const handleCloseOrder = async (orderId: string, paymentMethod: string, paymentAmount?: number) => {
    try {
      // Find the order to get current paid_amount
      const currentOrder = orders.find(o => o.id === orderId)
      const currentPaidAmount = currentOrder?.paidAmount || 0
      const totalAmount = currentOrder?.totalAmount || 0
      
      // Calculate new paid amount (add payment amount to existing)
      const newPaidAmount = paymentAmount 
        ? currentPaidAmount + paymentAmount 
        : totalAmount // If no amount specified, pay full amount
      
      // Determine the correct status based on payment amount
      let newStatus: OrderStatus
      if (newPaidAmount >= totalAmount) {
        // Fully paid
        newStatus = 'שולם'
      } else if (newPaidAmount > 0) {
        // Partially paid
        newStatus = 'שולם חלקית'
      } else {
        // No payment, keep current status or default to 'חדש'
        newStatus = (currentOrder?.status || 'חדש') as OrderStatus
      }
      
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paid_amount: newPaidAmount,
          status: newStatus,
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
        </div>

        {selectedUnit ? (
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
          <div>
            <button
              className="orders-add-button"
              onClick={createOrder}
              type="button"
              style={{ marginBottom: 16 }}
            >
              + יצירת הזמנה חדשה
            </button>
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
                      <span className="orders-unit-stat-value" style={{ color: '#22c55e' }}>
                        {stats.open}
                      </span>
                      <span className="orders-unit-stat-label">הזמנות פתוחות</span>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersScreen

