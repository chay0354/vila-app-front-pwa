import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order, OrderStatus, paymentOptions, UNIT_NAMES, UNIT_CATEGORIES } from '../types/orders'
import './OrderEditScreen.css'

type OrderEditScreenProps = {
  userName: string
}

function OrderEditScreen({ userName }: OrderEditScreenProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [isNewOrder, setIsNewOrder] = useState(false)
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState<OrderStatus>('חדש')
  const [paid, setPaid] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [total, setTotal] = useState('0')
  const [guestName, setGuestName] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [guestsCount, setGuestsCount] = useState('0')
  const [internalNotes, setInternalNotes] = useState('')
  const [addPayment, setAddPayment] = useState('')
  const [methodOpen, setMethodOpen] = useState(false)
  const [unitOpen, setUnitOpen] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  // Helper function to get Hebrew day name
  const getHebrewDayName = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    return dayNames[date.getDay()]
  }

  useEffect(() => {
    if (id) {
      loadOrder(id)
    } else {
      // New order
      setIsNewOrder(true)
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setArrivalDate(today)
      setDepartureDate(nextWeek)
      setLoading(false)
    }
  }, [id])

  const setOrderData = (loadedOrder: Order) => {
    setOrder(loadedOrder)
    setStatus(loadedOrder.status)
    setPaid(loadedOrder.paidAmount.toString())
    setPaymentMethod(loadedOrder.paymentMethod)
    setTotal(loadedOrder.totalAmount.toString())
    setGuestName(loadedOrder.guestName)
    setUnitNumber(loadedOrder.unitNumber)
    setArrivalDate(loadedOrder.arrivalDate)
    setDepartureDate(loadedOrder.departureDate)
    setGuestsCount(loadedOrder.guestsCount.toString())
    setInternalNotes(loadedOrder.internalNotes || '')
    setIsNewOrder(loadedOrder.totalAmount === 0 && loadedOrder.paidAmount === 0)
  }

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true)
      
      // First, try to load all orders and find the one we need (matching native app behavior)
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`)
        if (res.ok) {
          const data = await res.json()
          const list = (data || []).map((o: any): Order => ({
            id: o.id,
            guestName: o.guest_name ?? o.guestName ?? '',
            unitNumber: o.unit_number ?? o.unitNumber ?? '',
            arrivalDate: o.arrival_date ?? o.arrivalDate ?? '',
            departureDate: o.departure_date ?? o.departureDate ?? '',
            status: (o.status ?? 'חדש') as OrderStatus,
            guestsCount: Number(o.guests_count ?? o.guestsCount ?? 0),
            internalNotes: o.internal_notes ?? o.internalNotes ?? '',
            paidAmount: Number(o.paid_amount ?? o.paidAmount ?? 0),
            totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
            paymentMethod: o.payment_method ?? o.paymentMethod ?? 'לא צוין',
            createdBy: o.created_by ?? o.createdBy ?? undefined,
            openedBy: o.opened_by ?? o.openedBy ?? undefined,
          }))
          const foundOrder = list.find((o: Order) => o.id === orderId)
          if (foundOrder) {
            // Found in the list - use it (matching native app behavior)
            setOrderData(foundOrder)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to load orders list, trying individual fetch:', err)
      }
      
      // Fallback: try to fetch the individual order
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`)
      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        console.error('Failed to load order:', res.status, errorText)
        alert('לא ניתן לטעון את ההזמנה')
        navigate('/orders')
        return
      }
      const data = await res.json()
      const loadedOrder: Order = {
        id: data.id,
        guestName: data.guest_name ?? '',
        unitNumber: data.unit_number ?? '',
        arrivalDate: data.arrival_date ?? '',
        departureDate: data.departure_date ?? '',
        status: (data.status ?? 'חדש') as OrderStatus,
        guestsCount: Number(data.guests_count ?? 0),
        internalNotes: data.internal_notes ?? '',
        paidAmount: Number(data.paid_amount ?? 0),
        totalAmount: Number(data.total_amount ?? 0),
        paymentMethod: data.payment_method ?? 'לא צוין',
      }
      setOrderData(loadedOrder)
    } catch (err) {
      console.error('Error loading order:', err)
      alert('אירעה שגיאה בטעינת ההזמנה')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const paidNumber = Number(paid.replace(/,/g, '')) || 0
  const totalNumber = Number(total.replace(/,/g, '')) || 0
  const paidPercent = Math.min(
    100,
    totalNumber > 0 ? Math.round((paidNumber / totalNumber) * 100) : 0,
  )

  const addPaymentAmount = () => {
    const trimmed = addPayment.trim()
    if (!trimmed) {
      return true
    }
    const addVal = Number(trimmed.replace(/,/g, ''))
    if (Number.isNaN(addVal) || addVal <= 0) {
      alert('נא להזין סכום הוספה תקין וחיובי')
      return false
    }
    const next = paidNumber + addVal
    setPaid(next.toString())
    setAddPayment('')
    return true
  }

  const confirmPaymentModal = () => {
    if (Number.isNaN(totalNumber) || totalNumber <= 0) {
      alert('סכום מלא חייב להיות חיובי')
      return
    }
    if (paidNumber < 0) {
      alert('סכום ששולם חייב להיות חיובי')
      return
    }
    if (!addPaymentAmount()) return
    setShowAddPayment(false)
  }

  const saveEdit = async () => {
    if (!guestName.trim() || !unitNumber.trim()) {
      alert('יש למלא שם אורח ולבחור יחידת נופש')
      return
    }
    if (!UNIT_NAMES.includes(unitNumber.trim())) {
      alert('יש לבחור יחידת נופש מתוך הרשימה')
      return
    }
    if (Number.isNaN(totalNumber) || totalNumber <= 0) {
      alert('סכום מלא חייב להיות חיובי')
      return
    }
    const finalPaidAmount = isNewOrder ? 0 : paidNumber
    if (finalPaidAmount < 0) {
      alert('סכום ששולם חייב להיות חיובי')
      return
    }

    try {
      const orderId = id || order?.id
      const backendChanges: any = {
        status,
        paid_amount: finalPaidAmount,
        payment_method: paymentMethod || 'לא צוין',
        total_amount: totalNumber,
        guest_name: guestName.trim(),
        unit_number: unitNumber.trim(),
        arrival_date: arrivalDate.trim(),
        departure_date: departureDate.trim(),
        guests_count: Number(guestsCount) || 0,
        internal_notes: internalNotes.trim(),
        opened_by: userName || undefined,
      }

      // For new orders, use POST. For existing orders, use PATCH
      // Note: Create uses /orders, update uses /api/orders (matching front-native)
      const url = orderId
        ? `${API_BASE_URL}/api/orders/${orderId}`
        : `${API_BASE_URL}/orders`
      const httpMethod = orderId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method: httpMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendChanges),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
        alert(errorData.detail || (orderId ? 'לא ניתן לעדכן את ההזמנה' : 'לא ניתן ליצור הזמנה'))
        return
      }

      navigate('/orders')
    } catch (err: any) {
      console.error('Error saving order:', err)
      alert(err.message || 'אירעה שגיאה בשמירת ההזמנה')
    }
  }

  const handleDelete = async () => {
    if (isNewOrder) {
      // For new orders, just navigate back
      navigate('/orders')
      return
    }

    const orderId = id || order?.id
    if (!orderId) {
      alert('לא ניתן למחוק הזמנה ללא מזהה')
      return
    }

    if (!confirm('האם אתה בטוח שברצונך למחוק את ההזמנה? פעולה זו לא ניתנת לביטול.')) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        console.error('Failed to delete order:', res.status, errorText)
        alert(`לא ניתן למחוק את ההזמנה: ${res.status}`)
        return
      }

      alert('ההזמנה נמחקה בהצלחה')
      navigate('/orders')
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('לא ניתן למחוק את ההזמנה')
    }
  }

  if (loading) {
    return (
      <div className="order-edit-container">
        <div className="order-edit-loading">טוען...</div>
      </div>
    )
  }

  return (
    <div className="order-edit-container">
      <div className="order-edit-scroll">
        <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h1 className="order-edit-title">עריכת הזמנה</h1>
            <p className="order-edit-subtitle">
              שינוי מלא של פרטי הזמנה והוספת תשלום נוסף
            </p>
          </div>
          <button
            className="order-edit-back-button"
            onClick={() => navigate('/orders')}
            type="button"
          >
            ← חזרה
          </button>
        </div>

        <div className="order-edit-card">
          <label className="order-edit-label">שם אורח</label>
          <input
            className="order-edit-input"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="שם אורח"
            dir="rtl"
          />

          <label className="order-edit-label">יחידת נופש</label>
          <div className="order-edit-select-wrapper">
            <button
              className="order-edit-select"
              onClick={() => setUnitOpen(!unitOpen)}
              type="button"
            >
              <span className="order-edit-select-value">
                {unitNumber || 'בחרו יחידה'}
              </span>
              <span className="order-edit-select-caret">▾</span>
            </button>
            {unitOpen && (
              <div className="order-edit-select-list">
                {UNIT_CATEGORIES.map((category) => (
                  <div key={category.name}>
                    <div className="order-edit-select-category">
                      {category.name}
                    </div>
                    {category.units.map((option) => (
                      <button
                        key={option}
                        className={`order-edit-select-item ${
                          option === unitNumber ? 'active' : ''
                        }`}
                        onClick={() => {
                          setUnitNumber(option)
                          setUnitOpen(false)
                        }}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="order-edit-field-row">
            <div className="order-edit-field-half">
              <label className="order-edit-label">
                תאריך הגעה
                {arrivalDate && (
                  <span style={{ marginRight: '8px', color: '#3b82f6', fontWeight: '600' }}>
                    ({getHebrewDayName(arrivalDate)})
                  </span>
                )}
              </label>
              <input
                className="order-edit-input"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="order-edit-field-half">
              <label className="order-edit-label">
                תאריך עזיבה
                {departureDate && (
                  <span style={{ marginRight: '8px', color: '#3b82f6', fontWeight: '600' }}>
                    ({getHebrewDayName(departureDate)})
                  </span>
                )}
              </label>
              <input
                className="order-edit-input"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>

          <div className="order-edit-field-row">
            <div className="order-edit-field-half">
              <label className="order-edit-label">מספר אורחים</label>
              <input
                className="order-edit-input"
                type="number"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                placeholder="0"
                dir="rtl"
              />
            </div>
          </div>

          {isNewOrder ? (
            <div className="order-edit-field-row">
              <div className="order-edit-field-half">
                <label className="order-edit-label">סכום מלא (₪)</label>
                <input
                  className="order-edit-input"
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="0"
                  dir="rtl"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="order-edit-field-row">
                <div className="order-edit-field-half">
                  <label className="order-edit-label">סכום מלא (₪)</label>
                  <input
                    className="order-edit-input"
                    type="number"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0"
                    dir="rtl"
                  />
                </div>
                <div className="order-edit-field-half">
                  <label className="order-edit-label">סכום ששולם (₪)</label>
                  <input
                    className="order-edit-input"
                    type="number"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    placeholder="0"
                    dir="rtl"
                  />
                </div>
              </div>

            </>
          )}

          <label className="order-edit-label">הערות פנימיות</label>
          <textarea
            className="order-edit-textarea"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="הערות לצוות"
            dir="rtl"
            rows={3}
          />

          <div className="order-edit-actions">
            <button
              className="order-edit-primary-button"
              onClick={saveEdit}
              type="button"
            >
              שמירה
            </button>
            <button
              className="order-edit-outline-button"
              onClick={() => navigate('/orders')}
              type="button"
            >
              ביטול
            </button>
            {!isNewOrder && (
              <button
                className="order-edit-delete-button"
                onClick={handleDelete}
                type="button"
              >
                מחק הזמנה
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddPayment && (
        <div className="order-edit-modal-overlay" onClick={() => setShowAddPayment(false)}>
          <div className="order-edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="order-edit-modal-title">הוסף תשלום</h2>
            <label className="order-edit-label">סכום מלא (₪)</label>
            <input
              className="order-edit-input"
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0"
              dir="rtl"
            />
            <label className="order-edit-label">סכום ששולם (₪)</label>
            <input
              className="order-edit-input"
              type="number"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              placeholder="0"
              dir="rtl"
            />
            <label className="order-edit-label">אופן תשלום</label>
            <div className="order-edit-select-wrapper">
              <button
                className="order-edit-select"
                onClick={() => setMethodOpen(!methodOpen)}
                type="button"
              >
                <span className="order-edit-select-value">
                  {paymentMethod || 'בחרו אופן תשלום'}
                </span>
                <span className="order-edit-select-caret">▾</span>
              </button>
              {methodOpen && (
                <div className="order-edit-select-list">
                  {paymentOptions.map((option) => (
                    <button
                      key={option}
                      className={`order-edit-select-item ${
                        option === paymentMethod ? 'active' : ''
                      }`}
                      onClick={() => {
                        setPaymentMethod(option)
                        setMethodOpen(false)
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {totalNumber > 0 && (
              <>
                <label className="order-edit-label">הוסף תשלום נוסף (₪)</label>
                <div className="order-edit-add-payment-row">
                  <input
                    className="order-edit-input"
                    type="number"
                    value={addPayment}
                    onChange={(e) => setAddPayment(e.target.value)}
                    placeholder="0"
                    dir="rtl"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="order-edit-add-payment-trigger"
                    onClick={addPaymentAmount}
                    type="button"
                    style={{ minWidth: '90px', padding: '10px' }}
                  >
                    הוסף
                  </button>
                </div>
              </>
            )}

            <div className="order-edit-progress-wrap">
              <div className="order-edit-progress-header">
                <span className="order-edit-progress-label">
                  סכום מלא: ₪{totalNumber.toLocaleString('he-IL')}
                </span>
                <span className="order-edit-progress-value">שולם {paidPercent}%</span>
              </div>
              <div className="order-edit-progress-bar">
                <div
                  className="order-edit-progress-fill"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>

            <div className="order-edit-modal-buttons">
              <button
                className="order-edit-modal-button"
                onClick={confirmPaymentModal}
                type="button"
              >
                אישור
              </button>
              <button
                className="order-edit-modal-button-ghost"
                onClick={() => {
                  setShowAddPayment(false)
                  setAddPayment('')
                }}
                type="button"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderEditScreen

