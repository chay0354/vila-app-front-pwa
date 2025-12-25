import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { SavedInvoice } from '../types/invoices'
import EditInvoiceModal from '../components/EditInvoiceModal'
import './InvoicesScreen.css'

type InvoicesScreenProps = {
  userName: string
}

function InvoicesScreen({}: InvoicesScreenProps) {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<SavedInvoice | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/invoices`)
      if (response.ok) {
        const data = await response.json()
        // Parse extracted_data if it's a string
        const parsedInvoices = (data || []).map((inv: any) => {
          let extractedData = inv.extracted_data
          if (typeof extractedData === 'string') {
            try {
              extractedData = JSON.parse(extractedData)
            } catch {
              extractedData = null
            }
          }
          return {
            ...inv,
            extracted_data: extractedData,
          }
        })
        setInvoices(parsedInvoices)
        console.log(`Loaded ${parsedInvoices.length} invoices`)
      } else {
        console.error('Failed to load invoices:', response.status, await response.text().catch(() => ''))
      }
    } catch (err) {
      console.error('Error loading invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setSelectedImage(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleProcessInvoice = async () => {
    if (!selectedImage) {
      alert('יש לבחור תמונה תחילה')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Check if invoice was saved
      if (data.saved && data.id) {
        setSelectedImage(null)
        await loadInvoices()
        alert('החשבונית נשמרה בהצלחה')
      } else {
        // Invoice processed but not saved - might be table issue
        console.warn('Invoice processed but not saved to database:', data)
        alert('החשבונית עובדה אך לא נשמרה במסד הנתונים. ודא שהטבלה קיימת ב-Supabase.')
        setSelectedImage(null)
        await loadInvoices() // Still try to reload in case it was saved
      }
    } catch (err: any) {
      const errorMessage = err.message || 'שגיאה בעיבוד החשבונית'
      alert(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const handleEditInvoice = (invoice: SavedInvoice) => {
    setEditingInvoice(invoice)
    setShowEditModal(true)
  }

  const handleSaveInvoice = async (updatedInvoice: SavedInvoice) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${updatedInvoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_price: updatedInvoice.total_price,
          currency: updatedInvoice.currency,
          vendor: updatedInvoice.vendor,
          date: updatedInvoice.date,
          invoice_number: updatedInvoice.invoice_number,
          extracted_data: updatedInvoice.extracted_data,
        }),
      })

      if (!response.ok) {
        throw new Error('לא ניתן לשמור את החשבונית')
      }

      setShowEditModal(false)
      setEditingInvoice(null)
      await loadInvoices()
      alert('החשבונית עודכנה בהצלחה')
    } catch (err: any) {
      alert(err.message || 'לא ניתן לשמור את החשבונית')
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החשבונית?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadInvoices()
        alert('החשבונית נמחקה בהצלחה')
      }
    } catch (err) {
      alert('לא ניתן למחוק את החשבונית')
    }
  }

  const formatMoney = (amount: number | null | undefined, currency: string = 'ILS') => {
    if (amount === null || amount === undefined) {
      return '₪0.00'
    }
    const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency
    return `${symbol}${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('he-IL')
    } catch {
      return dateString
    }
  }

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <button className="invoices-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
        <h1 className="invoices-page-title">חשבוניות</h1>
      </div>

      <div className="invoices-scroll">
        {/* Upload Section */}
        <div className="invoices-upload-section">
          <h2 className="invoices-section-title">העלאת חשבונית</h2>
          <p className="invoices-section-subtitle">
            העלה תמונה של חשבונית והמערכת תזהה את הסכום הכולל ומחירי הפריטים
          </p>

          <div className="invoices-field">
            <label className="invoices-label">תמונת חשבונית</label>
            {selectedImage ? (
              <div className="invoices-image-preview-container">
                <div className="invoices-image-preview-wrapper">
                  <img src={selectedImage} alt="Invoice preview" className="invoices-image-preview" />
                  <div className="invoices-image-preview-overlay">
                    <label className="invoices-change-image-button">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePickImage}
                        style={{ display: 'none' }}
                      />
                      החלף תמונה
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <label className="invoices-upload-image-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePickImage}
                  style={{ display: 'none' }}
                />
                + העלה תמונה
              </label>
            )}
          </div>

          {selectedImage && (
            <button
              className={`invoices-process-button ${processing ? 'disabled' : ''}`}
              onClick={handleProcessInvoice}
              disabled={processing}
            >
              {processing ? 'מעבד...' : 'עבד חשבונית'}
            </button>
          )}
        </div>

        {/* Invoices List */}
        <div className="invoices-list-section">
          <h2 className="invoices-section-title">חשבוניות שמורות ({invoices.length})</h2>

          {loading ? (
            <p className="invoices-loading-text">טוען...</p>
          ) : invoices.length === 0 ? (
            <p className="invoices-empty-text">אין חשבוניות שמורות</p>
          ) : (
            <div className="invoices-list">
              {invoices.map((invoice) => {
                const data = invoice.extracted_data || {
                  total_price: invoice.total_price,
                  currency: invoice.currency || 'ILS',
                  items: [],
                  vendor: invoice.vendor,
                  date: invoice.date,
                  invoice_number: invoice.invoice_number,
                }

                return (
                  <div
                    key={invoice.id}
                    className="invoices-card"
                    onClick={() => handleEditInvoice(invoice)}
                    role="button"
                    tabIndex={0}
                  >
                    <img
                      src={invoice.image_data}
                      alt="Invoice"
                      className="invoices-card-thumbnail"
                    />
                    <div className="invoices-card-content">
                      <p className="invoices-card-vendor">{data.vendor || 'ללא ספק'}</p>
                      <p className="invoices-card-date">
                        {formatDate(data.date || invoice.created_at)}
                      </p>
                      <p className="invoices-card-total">
                        {formatMoney(data.total_price, data.currency)}
                      </p>
                      {data.invoice_number && (
                        <p className="invoices-card-number">#{data.invoice_number}</p>
                      )}
                    </div>
                    <button
                      className="invoices-delete-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteInvoice(invoice.id)
                      }}
                    >
                      מחק
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Invoice Modal */}
      {showEditModal && editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setShowEditModal(false)
            setEditingInvoice(null)
          }}
          formatMoney={formatMoney}
        />
      )}
    </div>
  )
}

export default InvoicesScreen

