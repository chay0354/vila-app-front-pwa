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

  useEffect(() => {
    loadInventoryOrders()
  }, [])

  const loadInventoryOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/orders`)
      if (!res.ok) return
      const data = await res.json()

      const list = (data || []).map((o: any): InventoryOrder => {
        const status = (o.status ?? 'מחכה להשלמת תשלום') as InventoryOrder['status']
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
      // Group by hotel (unitNumber) or 'ללא מלון' if no hotel
      const hotelKey = order.unitNumber || 'ללא מלון'
      if (!groups[hotelKey]) {
        groups[hotelKey] = []
      }
      groups[hotelKey].push(order)
    })
    // Sort orders within each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''))
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
              {Object.entries(groupedOrders).map(([hotelName, groupOrders]) => (
                <div key={hotelName} className="warehouse-screen-hotel-group">
                  <h3 className="warehouse-screen-hotel-group-title">
                    {hotelName} ({groupOrders.length} {groupOrders.length === 1 ? 'הזמנה' : 'הזמנות'})
                  </h3>
                  {groupOrders.map((order) => {
                    const groupId = order.id
                    const isExpanded = expandedOrderGroupId === groupId
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
                    </button>

                    <div className="warehouse-screen-order-card-actions">
                      <div className="warehouse-screen-order-type-badge">
                        <span className="warehouse-screen-order-type-text">{order.orderType}</span>
                      </div>
                    </div>
                  </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseScreen

