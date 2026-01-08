import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './PaymentConfirmationScreen.css'

function PaymentConfirmationScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentMethod = searchParams.get('method') || 'אשראי'
  const paymentAmount = searchParams.get('amount')
  const [isProcessing, setIsProcessing] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Payment gateway webhook will handle DB update
    // This page just shows success message to user
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
      
      // Redirect to orders page after 3 seconds
      // Give webhook time to process payment
      setTimeout(() => {
        navigate('/orders', { replace: true, state: { refresh: true } })
      }, 3000)
    }, 1000)
  }, [navigate])

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
            {paymentAmount && (
              <p className="payment-confirmation-amount">
                סכום התשלום: ₪{Number(paymentAmount).toLocaleString('he-IL')}
              </p>
            )}
            <p className="payment-confirmation-note">
              מועבר לדף ההזמנות...
            </p>
          </>
        ) : (
          <>
            <div className="payment-confirmation-error-icon">✗</div>
            <h1 className="payment-confirmation-title">שגיאה באישור התשלום</h1>
            <p className="payment-confirmation-subtitle">אירעה שגיאה בעיבוד התשלום</p>
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



