import { useState } from 'react'
import { SavedInvoice, ExtractedInvoiceData, InvoiceItem } from '../types/invoices'
import './EditInvoiceModal.css'

type EditInvoiceModalProps = {
  invoice: SavedInvoice
  onSave: (invoice: SavedInvoice) => void
  onCancel: () => void
  formatMoney: (amount: number | null | undefined, currency?: string) => string
}

function EditInvoiceModal({
  invoice,
  onSave,
  onCancel,
  formatMoney,
}: EditInvoiceModalProps) {
  const [editedInvoice, setEditedInvoice] = useState<SavedInvoice>({ ...invoice })
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState<InvoiceItem>({
    name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  })

  const data = editedInvoice.extracted_data || {
    total_price: editedInvoice.total_price,
    currency: editedInvoice.currency || 'ILS',
    items: [],
    vendor: editedInvoice.vendor,
    date: editedInvoice.date,
    invoice_number: editedInvoice.invoice_number,
  }

  const updateData = (updates: Partial<ExtractedInvoiceData>) => {
    const newData = { ...data, ...updates }
    setEditedInvoice({
      ...editedInvoice,
      extracted_data: newData,
      total_price: newData.total_price,
      currency: newData.currency,
      vendor: newData.vendor || null,
      date: newData.date || null,
      invoice_number: newData.invoice_number || null,
    })
  }

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      alert('יש להזין שם פריט')
      return
    }
    const items = [...(data.items || []), { ...newItem }]
    updateData({ items })
    setNewItem({ name: '', quantity: 1, unit_price: 0, total_price: 0 })
  }

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const items = [...(data.items || [])]
    items[index] = { ...items[index], ...updates }
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      items[index].total_price = (items[index].quantity || 0) * (items[index].unit_price || 0)
    }
    updateData({ items })
    setEditingItemIndex(null)
  }

  const handleRemoveItem = (index: number) => {
    const items = [...(data.items || [])]
    items.splice(index, 1)
    updateData({ items })
  }

  const handleSave = () => {
    // Recalculate total if items exist
    if (data.items && data.items.length > 0) {
      const calculatedTotal = data.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
      updateData({ total_price: calculatedTotal })
    }
    onSave(editedInvoice)
  }

  return (
    <div className="edit-invoice-modal-overlay" onClick={onCancel}>
      <div className="edit-invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="edit-invoice-modal-title">עריכת חשבונית</h2>

        <div className="edit-invoice-modal-scroll">
          <div className="edit-invoice-field">
            <label className="edit-invoice-label">ספק</label>
            <input
              className="edit-invoice-input"
              type="text"
              value={data.vendor || ''}
              onChange={(e) => updateData({ vendor: e.target.value || null })}
              placeholder="הזן שם ספק"
              dir="rtl"
            />
          </div>

          <div className="edit-invoice-field">
            <label className="edit-invoice-label">תאריך</label>
            <input
              className="edit-invoice-input"
              type="text"
              value={data.date || ''}
              onChange={(e) => updateData({ date: e.target.value || null })}
              placeholder="YYYY-MM-DD"
              dir="rtl"
            />
          </div>

          <div className="edit-invoice-field">
            <label className="edit-invoice-label">מספר חשבונית</label>
            <input
              className="edit-invoice-input"
              type="text"
              value={data.invoice_number || ''}
              onChange={(e) => updateData({ invoice_number: e.target.value || null })}
              placeholder="הזן מספר חשבונית"
              dir="rtl"
            />
          </div>

          <div className="edit-invoice-field">
            <label className="edit-invoice-label">מטבע</label>
            <input
              className="edit-invoice-input"
              type="text"
              value={data.currency || 'ILS'}
              onChange={(e) => updateData({ currency: e.target.value || 'ILS' })}
              placeholder="ILS"
              dir="rtl"
            />
          </div>

          <div className="edit-invoice-field">
            <label className="edit-invoice-label">סכום כולל</label>
            <input
              className="edit-invoice-input"
              type="number"
              value={data.total_price?.toString() || ''}
              onChange={(e) => {
                const num = parseFloat(e.target.value) || null
                updateData({ total_price: num })
              }}
              placeholder="0.00"
              dir="rtl"
            />
          </div>

          <div className="edit-invoice-field">
            <label className="edit-invoice-label">פריטים</label>

            {(data.items || []).map((item, index) => (
              <div key={index} className="edit-invoice-item-row">
                {editingItemIndex === index ? (
                  <>
                    <input
                      className="edit-invoice-input"
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(index, { name: e.target.value })}
                      placeholder="שם פריט"
                      dir="rtl"
                      style={{ flex: '1', marginBottom: '8px' }}
                    />
                    <div className="edit-invoice-item-inputs-row">
                      <input
                        className="edit-invoice-input"
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => {
                          const qty = parseFloat(e.target.value) || 0
                          handleUpdateItem(index, { quantity: qty })
                        }}
                        placeholder="כמות"
                        dir="rtl"
                        style={{ flex: '1' }}
                      />
                      <input
                        className="edit-invoice-input"
                        type="number"
                        value={item.unit_price.toString()}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0
                          handleUpdateItem(index, { unit_price: price })
                        }}
                        placeholder="מחיר יחידה"
                        dir="rtl"
                        style={{ flex: '1' }}
                      />
                    </div>
                    <button
                      className="edit-invoice-save-item-button"
                      onClick={() => setEditingItemIndex(null)}
                    >
                      שמור
                    </button>
                  </>
                ) : (
                  <>
                    <div className="edit-invoice-item-content">
                      <p className="edit-invoice-item-name">{item.name}</p>
                      <p className="edit-invoice-item-quantity">
                        {item.quantity} × {formatMoney(item.unit_price, data.currency)} = {formatMoney(item.total_price, data.currency)}
                      </p>
                    </div>
                    <button
                      className="edit-invoice-edit-item-button"
                      onClick={() => setEditingItemIndex(index)}
                    >
                      ערוך
                    </button>
                    <button
                      className="edit-invoice-remove-item-button"
                      onClick={() => handleRemoveItem(index)}
                    >
                      מחק
                    </button>
                  </>
                )}
              </div>
            ))}

            <div className="edit-invoice-add-item-section">
              <label className="edit-invoice-label">הוסף פריט חדש</label>
              <input
                className="edit-invoice-input"
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="שם פריט"
                dir="rtl"
              />
              <div className="edit-invoice-item-inputs-row" style={{ marginTop: '8px' }}>
                <input
                  className="edit-invoice-input"
                  type="number"
                  value={newItem.quantity.toString()}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0
                    setNewItem({ ...newItem, quantity: qty, total_price: qty * newItem.unit_price })
                  }}
                  placeholder="כמות"
                  dir="rtl"
                  style={{ flex: '1' }}
                />
                <input
                  className="edit-invoice-input"
                  type="number"
                  value={newItem.unit_price.toString()}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0
                    setNewItem({ ...newItem, unit_price: price, total_price: newItem.quantity * price })
                  }}
                  placeholder="מחיר יחידה"
                  dir="rtl"
                  style={{ flex: '1' }}
                />
              </div>
              <button className="edit-invoice-add-item-button" onClick={handleAddItem}>
                + הוסף פריט
              </button>
            </div>
          </div>
        </div>

        <div className="edit-invoice-modal-buttons">
          <button className="edit-invoice-modal-button edit-invoice-modal-button-primary" onClick={handleSave}>
            שמור
          </button>
          <button className="edit-invoice-modal-button edit-invoice-modal-button-ghost" onClick={onCancel}>
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditInvoiceModal

