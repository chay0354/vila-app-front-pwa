import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Order, paymentOptions } from '../types/orders'
import './OrderCard.css'

type OrderCardProps = {
  order: Order
  onEdit: (id: string) => void
  onClose?: (id: string, paymentMethod: string, amount?: number) => void
}

function OrderCard({ order, onEdit, onClose }: OrderCardProps) {
  const navigate = useNavigate()
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showOtherPayment, setShowOtherPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)

  const paidPercent = Math.min(
    100,
    order.totalAmount > 0
      ? Math.round((order.paidAmount / order.totalAmount) * 100)
      : 0,
  )

  const remainingAmount = order.totalAmount - order.paidAmount
  
  // Check if order is open (not fully paid or cancelled)
  const isOpen = order.status !== 'שולם' && order.status !== 'בוטל'
  
  // Initialize payment amount when modal opens
  useEffect(() => {
    if (showCloseModal && !showOtherPayment) {
      setPaymentAmount(remainingAmount > 0 ? remainingAmount : order.totalAmount)
    }
  }, [showCloseModal, showOtherPayment, remainingAmount, order.totalAmount])
  
  const handleCloseOrder = (method: string, amount?: number) => {
    if (onClose) {
      onClose(order.id, method, amount)
    }
    setShowCloseModal(false)
    setShowOtherPayment(false)
    setSelectedPaymentMethod('')
    setPaymentAmount(0)
  }
  
  const handleCloseWithCreditCard = () => {
    // Close modal first
    setShowCloseModal(false)
    setShowOtherPayment(false)
    
    // Use the selected payment amount (from slider) or remaining amount
    const amountToPay = paymentAmount > 0 ? paymentAmount : (remainingAmount > 0 ? remainingAmount : order.totalAmount)
    
    // Check if unit is הודולה 1-5, use different payment URL
    const isHodula = order.unitNumber && (
      order.unitNumber === 'הודולה 1' ||
      order.unitNumber === 'הודולה 2' ||
      order.unitNumber === 'הודולה 3' ||
      order.unitNumber === 'הודולה 4' ||
      order.unitNumber === 'הודולה 5'
    )
    
    const cardcomUrl = isHodula
      ? 'https://secure.cardcom.solutions/EA/EA5/rEpuhCsHV0uqmqZNFTFFNw/PaymentSP'
      : 'https://secure.cardcom.solutions/EA/EA5/PgwM0wy1uEC4Ade0BLZHlA/PaymentSP'
    
    const successUrl = encodeURIComponent(`https://vila-app-front-pwa.vercel.app/payment-confirmation?method=אשראי&amount=${amountToPay}&orderId=${order.id}`)
    const failureUrl = encodeURIComponent(`https://vila-app-front-pwa.vercel.app/orders`)
    
    // Build Cardcom payment URL with parameters
    const paymentUrl = `${cardcomUrl}?Sum=${amountToPay}&Coin=1&SuccessRedirectUrl=${successUrl}&ErrorRedirectUrl=${failureUrl}&OrderId=${order.id}&Description=${encodeURIComponent(`תשלום הזמנה ${order.unitNumber}`)}`
    
    // Redirect to Cardcom payment page (opens in browser)
    window.location.href = paymentUrl
  }
  
  const handleCloseWithOther = () => {
    if (selectedPaymentMethod) {
      // Use the selected payment amount (from slider) or remaining amount
      const amountToPay = paymentAmount > 0 ? paymentAmount : (remainingAmount > 0 ? remainingAmount : order.totalAmount)
      handleCloseOrder(selectedPaymentMethod, amountToPay)
    }
  }

  return (
    <div className="order-card-enhanced">
      {/* Header with Unit */}
      <div className="order-card-header-enhanced">
        <div className="order-card-header-left">
          <span className={`order-status-badge ${isOpen ? 'order-status-open' : 'order-status-closed'}`}>
            {isOpen ? 'פתוח' : 'סגור'}
          </span>
          {isOpen && (
            <button
              className="order-close-button"
              onClick={() => setShowCloseModal(true)}
              type="button"
            >
              סגור הזמנה
            </button>
          )}
          {!isOpen && order.paymentMethod && (
            <span className="order-closed-method">
              נסגר ב-{order.paymentMethod}
            </span>
          )}
        </div>
        <div className="order-card-header-right">
          <div className="order-card-title-container">
            <h3 className="order-card-unit-title">{order.unitNumber}</h3>
          </div>
        </div>
      </div>

      {/* Guest Info Section */}
      <div className="order-info-section">
        <div className="order-info-row">
          <div className="order-info-stacked">
            {(order.createdBy || order.openedBy) && (
              <div className="order-info-content">
                <span className="order-info-label">נוצר על ידי</span>
                <span className="order-info-value">{order.openedBy || order.createdBy}</span>
              </div>
            )}
            <div className="order-info-content">
              <span className="order-info-label">אורח</span>
              <span className="order-info-value">{order.guestName}</span>
            </div>
          </div>
          <div className="order-info-content">
            <span className="order-info-label">מספר אורחים</span>
            <span className="order-info-value">{order.guestsCount} אנשים</span>
          </div>
        </div>

        {/* Dates */}
        <div className="order-info-row">
          <div className="order-info-content">
            <span className="order-info-label">תאריך הגעה</span>
            <span className="order-info-value">{order.arrivalDate}</span>
          </div>
          <div className="order-info-content">
            <span className="order-info-label">תאריך יציאה</span>
            <span className="order-info-value">{order.departureDate}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="order-payment-section">
          <div className="order-payment-row">
            <div className="order-payment-item">
              <span className="order-payment-label">סכום כולל</span>
              <span className="order-payment-total">
                ₪{order.totalAmount.toLocaleString('he-IL')}
              </span>
            </div>
            <div className="order-payment-item">
              <span className="order-payment-label">שולם</span>
              <span className="order-payment-paid">
                ₪{order.paidAmount.toLocaleString('he-IL')}
              </span>
            </div>
            {remainingAmount > 0 && (
              <div className="order-payment-item">
                <span className="order-payment-label">נותר</span>
                <span className="order-payment-remaining">
                  ₪{remainingAmount.toLocaleString('he-IL')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="order-info-row">
          <div className="order-info-content">
            <span className="order-info-label">אופן תשלום</span>
            <span className="order-info-value">
              {order.paymentMethod || 'לא צוין'}
            </span>
          </div>
        </div>

        {/* Special Requests */}
        {order.specialRequests && (
          <div className="order-special-section">
            <div className="order-special-content">
              <span className="order-special-label">בקשות מיוחדות</span>
              <p className="order-special-text">{order.specialRequests}</p>
            </div>
          </div>
        )}

        {/* Internal Notes */}
        {order.internalNotes && (
          <div className="order-notes-section">
            <div className="order-notes-content">
              <span className="order-notes-label">הערות פנימיות</span>
              <p className="order-notes-text">{order.internalNotes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="order-progress-wrap-enhanced">
        <div className="order-progress-header-enhanced">
          <span className="order-progress-label-enhanced">התקדמות תשלום</span>
          <span className="order-progress-value-enhanced">{paidPercent}%</span>
        </div>
        <div className="order-progress-bar-enhanced">
          <div
            className="order-progress-fill-enhanced"
            style={{
              width: `${paidPercent}%`,
              backgroundColor:
                paidPercent === 100
                  ? '#10b981'
                  : paidPercent >= 50
                    ? '#3b82f6'
                    : '#f59e0b',
            }}
          />
        </div>
        <div className="order-progress-footer">
          <span className="order-progress-footer-text">
            ₪{order.paidAmount.toLocaleString('he-IL')} מתוך ₪
            {order.totalAmount.toLocaleString('he-IL')}
          </span>
        </div>
      </div>

      {/* Edit Button */}
      <div className="order-edit-actions-enhanced">
        <button
          className="order-edit-button-enhanced"
          onClick={() => onEdit(order.id)}
          type="button"
        >
          עריכת הזמנה
        </button>
      </div>

      {/* Close Order Modal */}
      {showCloseModal && (
        <div className="order-close-modal-overlay" onClick={() => {
          setShowCloseModal(false)
          setShowOtherPayment(false)
          setSelectedPaymentMethod('')
          setPaymentAmount(0)
        }}>
          <div className="order-close-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="order-close-modal-title">סגירת הזמנה</h3>
            <p className="order-close-modal-subtitle">בחרו דרך תשלום לסגירת ההזמנה</p>
            
            {!showOtherPayment ? (
              <div className="order-close-modal-options">
                {/* Payment Amount Slider */}
                <div className="order-payment-amount-section">
                  <label className="order-payment-amount-label">
                    סכום לתשלום: ₪{paymentAmount > 0 ? paymentAmount.toLocaleString('he-IL') : remainingAmount.toLocaleString('he-IL')}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={remainingAmount}
                    step="100"
                    value={paymentAmount || remainingAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="order-payment-amount-slider"
                  />
                  <div className="order-payment-amount-info">
                    <span>₪0</span>
                    <span>₪{remainingAmount.toLocaleString('he-IL')}</span>
                  </div>
                </div>
                <button
                  className="order-close-option-button"
                  onClick={handleCloseWithCreditCard}
                  type="button"
                >
                  סגור בתשלום בכרטיס אשראי
                </button>
                <button
                  className="order-close-option-button"
                  onClick={() => setShowOtherPayment(true)}
                  type="button"
                >
                  סגור בדרך תשלום אחרת
                </button>
              </div>
            ) : (
              <div className="order-close-modal-other">
                {/* Payment Amount Slider */}
                <div className="order-payment-amount-section">
                  <label className="order-payment-amount-label">
                    סכום לתשלום: ₪{paymentAmount > 0 ? paymentAmount.toLocaleString('he-IL') : remainingAmount.toLocaleString('he-IL')}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={remainingAmount}
                    step="100"
                    value={paymentAmount || remainingAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="order-payment-amount-slider"
                  />
                  <div className="order-payment-amount-info">
                    <span>₪0</span>
                    <span>₪{remainingAmount.toLocaleString('he-IL')}</span>
                  </div>
                </div>
                <label className="order-close-modal-label">בחרו דרך תשלום:</label>
                <div className="order-close-payment-select">
                  {paymentOptions.filter(method => method !== 'אשראי').map((method) => (
                    <button
                      key={method}
                      className={`order-close-payment-option ${
                        selectedPaymentMethod === method ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedPaymentMethod(method)}
                      type="button"
                    >
                      {method}
                    </button>
                  ))}
                </div>
                <div className="order-close-modal-buttons">
                  <button
                    className="order-close-confirm-button"
                    onClick={handleCloseWithOther}
                    disabled={!selectedPaymentMethod}
                    type="button"
                  >
                    אישור
                  </button>
                  <button
                    className="order-close-cancel-button"
                    onClick={() => {
                      setShowOtherPayment(false)
                      setSelectedPaymentMethod('')
                    }}
                    type="button"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
            
            {!showOtherPayment && (
              <button
                className="order-close-modal-close"
                onClick={() => {
                  setShowCloseModal(false)
                  setShowOtherPayment(false)
                  setSelectedPaymentMethod('')
                  setPaymentAmount(0)
                }}
                type="button"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderCard

