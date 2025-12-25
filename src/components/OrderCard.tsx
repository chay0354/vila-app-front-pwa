import { Order, OrderStatus } from '../types/orders'
import './OrderCard.css'

type OrderCardProps = {
  order: Order
  onEdit: (id: string) => void
}

function OrderCard({ order, onEdit }: OrderCardProps) {
  const paidPercent = Math.min(
    100,
    order.totalAmount > 0
      ? Math.round((order.paidAmount / order.totalAmount) * 100)
      : 0,
  )

  const remainingAmount = order.totalAmount - order.paidAmount

  return (
    <div className="order-card-enhanced">
      {/* Header with Unit */}
      <div className="order-card-header-enhanced">
        <div className="order-card-header-left">
          <div className="order-card-title-container">
            <h3 className="order-card-unit-title">{order.unitNumber}</h3>
            <span className="order-card-id">#{order.id}</span>
          </div>
        </div>
      </div>

      {/* Guest Info Section */}
      <div className="order-info-section">
        <div className="order-info-row">
          <div className="order-info-content">
            <span className="order-info-label">אורח</span>
            <span className="order-info-value">{order.guestName}</span>
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
    </div>
  )
}

export default OrderCard

