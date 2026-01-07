import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './PaymentConfirmationScreen.css'

function PaymentConfirmationScreen() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const paymentMethod = searchParams.get('method') || 'אשראי'
  const [isProcessing, setIsProcessing] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('מספר הזמנה לא נמצא')
      setIsProcessing(false)
      return
    }

    // Update order status in DB
    const confirmPayment = async () => {
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
          throw new Error(errorData.detail || 'לא ניתן לעדכן את ההזמנה')
        }

        setIsSuccess(true)
        setIsProcessing(false)
        
        // Redirect to orders page after 2 seconds
        setTimeout(() => {
          navigate('/orders')
        }, 2000)
      } catch (err: any) {
        console.error('Error confirming payment:', err)
        setError(err.message || 'אירעה שגיאה באישור התשלום')
        setIsProcessing(false)
      }
    }

    confirmPayment()
  }, [orderId, paymentMethod, navigate])

  return (
    <div className="payment-confirmation-container">
      <div className="payment-confirmation-content">
        {isProcessing ? (
          <>
            <div className="payment-confirmation-spinner"></div>
            <h1 className="payment-confirmation-title">מעבד תשלום...</h1>
            <p className="payment-confirmation-subtitle">אנא המתן</p>
          </>
        ) : isSuccess ? (
          <>
            <div className="payment-confirmation-success-icon">✓</div>
            <h1 className="payment-confirmation-title">תשלום אושר בהצלחה!</h1>
            <p className="payment-confirmation-subtitle">
              ההזמנה נסגרה בהצלחה באמצעות {paymentMethod}
            </p>
            <p className="payment-confirmation-note">
              מועבר לדף ההזמנות...
            </p>
          </>
        ) : (
          <>
            <div className="payment-confirmation-error-icon">✗</div>
            <h1 className="payment-confirmation-title">שגיאה באישור התשלום</h1>
            <p className="payment-confirmation-subtitle">{error}</p>
            <button
              className="payment-confirmation-button"
              onClick={() => navigate('/orders')}
              type="button"
            >
              חזרה להזמנות
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentConfirmationScreen



