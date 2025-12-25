import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { InventoryOrder } from '../types/warehouse'
import './WarehouseScreen.css'

type WarehouseScreenProps = {
  userName: string
}

function WarehouseScreen({}: WarehouseScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<InventoryOrder[]>([])
  const [expandedOrderGroupId, setExpandedOrderGroupId] = useState<string | null>(null)
  const [statusChangeGroupId, setStatusChangeGroupId] = useState<string | null>(null)

  useEffect(() => {
    loadInventoryOrders()
  }, [])

  const loadInventoryOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/orders`)
      if (!res.ok) return
      const data = await res.json()

      const list = (data || []).map((o: any): InventoryOrder => {
        const status = (o.status ?? 'ממתין לאישור') as InventoryOrder['status']
        const orderType = (o.order_type ?? o.orderType ?? 'הזמנה כללית') as InventoryOrder['orderType']

        if (o.items && Array.isArray(o.items)) {
          return {
            id: o.id,
            orderDate: o.order_date ?? o.orderDate ?? '',
            deliveryDate: o.delivery_date ?? o.deliveryDate ?? undefined,
            status,
            orderType,
            orderedBy: o.ordered_by ?? o.orderedBy ?? undefined,
            unitNumber: o.unit_number ?? o.unitNumber ?? undefined,
            items: o.items.map((item: any) => ({
              id: item.id,
              itemId: item.item_id ?? item.itemId,
              itemName: item.item_name ?? item.itemName ?? '',
              quantity: Number(item.quantity ?? 0),
              unit: item.unit ?? '',
            })),
          }
        }

        return {
          id: o.id,
          orderDate: o.order_date ?? o.orderDate ?? '',
          deliveryDate: o.delivery_date ?? o.deliveryDate ?? undefined,
          status,
          orderType,
          orderedBy: o.ordered_by ?? o.orderedBy ?? undefined,
          unitNumber: o.unit_number ?? o.unitNumber ?? undefined,
          items: [],
        }
      })

      setOrders(list)
    } catch (err) {
      console.error('Error loading inventory orders:', err)
    }
  }

  const groupedOrders = useMemo(() => {
    const groups: Record<string, InventoryOrder[]> = {}
    orders.forEach(order => {
      groups[order.id] = [order]
    })
    return groups
  }, [orders])

  const handleToggleOrder = (groupId: string) => {
    if (expandedOrderGroupId === groupId) {
      setExpandedOrderGroupId(null)
    } else {
      setExpandedOrderGroupId(groupId)
    }
  }

  const handleStatusChange = async (groupId: string, newStatus: InventoryOrder['status']) => {
    const groupOrders = groupedOrders[groupId] || []
    if (groupOrders.length > 0) {
      const order = groupOrders[0]
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventory/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            delivery_date: order.deliveryDate,
          }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
          alert(errorData.detail || 'לא ניתן לעדכן את ההזמנה')
          return
        }
        await loadInventoryOrders()
        setStatusChangeGroupId(null)
      } catch (err: any) {
        console.error('Error updating inventory order:', err)
        alert(err.message || 'אירעה שגיאה בעדכון ההזמנה')
      }
    }
  }

  const getStatusColor = (status: InventoryOrder['status']) => {
    switch (status) {
      case 'ממתין לאישור':
        return '#f59e0b'
      case 'מאושר':
        return '#3b82f6'
      case 'בהזמנה':
        return '#8b5cf6'
      case 'התקבל':
        return '#22c55e'
      case 'בוטל':
        return '#ef4444'
      default:
        return '#64748b'
    }
  }

  return (
    <div className="warehouse-screen-container">
      <div className="warehouse-screen-header">
        <button className="warehouse-screen-back-button" onClick={() => navigate('/warehouse')}>
          ← חזרה
        </button>
      </div>
      <div className="warehouse-screen-scroll">
        <div className="warehouse-screen-title-section">
          <div>
            <h1 className="warehouse-screen-title">מחסן</h1>
            <p className="warehouse-screen-subtitle">
              הזמנות פנימיות למלאי וצפייה בסטטוס
            </p>
          </div>
        </div>

        <div className="warehouse-screen-orders-section">
          <div className="warehouse-screen-orders-header-row">
            <h2 className="warehouse-screen-section-title">הזמנות פנימיות</h2>
            <button
              className="warehouse-screen-add-order-button"
              onClick={() => navigate('/warehouse/orders/new')}
            >
              + הזמנה חדשה
            </button>
          </div>

          {Object.keys(groupedOrders).length === 0 ? (
            <div className="warehouse-screen-empty-state">
              <p className="warehouse-screen-empty-state-text">אין הזמנות כרגע</p>
            </div>
          ) : (
            <div className="warehouse-screen-orders-list">
              {Object.entries(groupedOrders).map(([groupId, groupOrders]) => {
                const order = groupOrders[0]
                const isExpanded = expandedOrderGroupId === groupId
                const isChangingStatus = statusChangeGroupId === groupId
                const itemCount = order.items?.length || 0

                return (
                  <div key={groupId} className="warehouse-screen-order-card">
                    <button
                      onClick={() => handleToggleOrder(groupId)}
                      className="warehouse-screen-order-card-header"
                    >
                      <div className="warehouse-screen-order-card-content">
                        <div className="warehouse-screen-order-card-title-row">
                          <span className="warehouse-screen-order-item-name">
                            הזמנה #{order.id.slice(-8)}
                          </span>
                          <span className="warehouse-screen-order-item-count">
                            ({itemCount} {itemCount === 1 ? 'פריט' : 'פריטים'})
                          </span>
                        </div>
                        <p className="warehouse-screen-order-details">
                          תאריך הזמנה: {order.orderDate}
                        </p>
                        {order.orderedBy && (
                          <p className="warehouse-screen-order-details">
                            הוזמן על ידי: {order.orderedBy}
                          </p>
                        )}
                        {order.deliveryDate && (
                          <p className="warehouse-screen-order-details">
                            תאריך אספקה: {order.deliveryDate}
                          </p>
                        )}
                        {isExpanded && order.items && order.items.length > 0 && (
                          <div className="warehouse-screen-order-items-expanded">
                            {order.items.map((item, idx) => (
                              <div key={item.id || idx} className="warehouse-screen-order-item-row">
                                <span className="warehouse-screen-order-item-name">{item.itemName}</span>
                                <span className="warehouse-screen-order-details">
                                  כמות: {item.quantity} {item.unit || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className="warehouse-screen-order-status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) + '22' }}
                      >
                        <span
                          className="warehouse-screen-order-status-text"
                          style={{ color: getStatusColor(order.status) }}
                        >
                          {order.status}
                        </span>
                      </div>
                    </button>

                    <div className="warehouse-screen-order-card-actions">
                      <div className="warehouse-screen-order-type-badge">
                        <span className="warehouse-screen-order-type-text">{order.orderType}</span>
                      </div>
                      {!isChangingStatus ? (
                        <button
                          onClick={() => setStatusChangeGroupId(groupId)}
                          className="warehouse-screen-change-status-button"
                        >
                          שינוי סטטוס
                        </button>
                      ) : (
                        <div className="warehouse-screen-status-change-buttons">
                          {(['ממתין לאישור', 'מאושר', 'בהזמנה', 'התקבל', 'בוטל'] as InventoryOrder['status'][]).map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(groupId, status)}
                              className={`warehouse-screen-status-option-button ${
                                order.status === status ? 'active' : ''
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                          <button
                            onClick={() => setStatusChangeGroupId(null)}
                            className="warehouse-screen-cancel-status-button"
                          >
                            ביטול
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseScreen

