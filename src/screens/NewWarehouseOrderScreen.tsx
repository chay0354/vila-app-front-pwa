import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { InventoryOrder, InventoryOrderItem } from '../types/warehouse'
import { UNIT_CATEGORIES, UNIT_NAMES } from '../types/orders'
import './NewWarehouseOrderScreen.css'

type ProductEntry = {
  id: string
  name: string
  quantity: string
}

type NewWarehouseOrderScreenProps = {
  userName: string
}

function NewWarehouseOrderScreen({}: NewWarehouseOrderScreenProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductEntry[]>([
    { id: Date.now().toString(), name: '', quantity: '' }
  ])
  const [selectedHotel, setSelectedHotel] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now().toString(), name: '', quantity: '' }])
  }

  const handleRemoveProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const handleProductChange = (id: string, field: 'name' | 'quantity', value: string) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const handleSave = async () => {
    const validProducts = products.filter(p => p.name.trim() && p.quantity.trim())

    if (validProducts.length === 0) {
      alert('יש להוסיף לפחות פריט אחד עם שם וכמות')
      return
    }

    for (const product of validProducts) {
      const quantity = parseFloat(product.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        alert(`הכמות של "${product.name}" אינה תקינה`)
        return
      }
    }

    setSaving(true)
    try {
      const orderDate = new Date().toISOString().split('T')[0]

      const orderItems: InventoryOrderItem[] = validProducts.map(product => {
        const quantity = parseFloat(product.quantity)
        return {
          id: '',
          itemId: '',
          itemName: product.name.trim(),
          quantity: quantity,
          unit: '',
        }
      })

      const newOrder: InventoryOrder = {
        id: '',
        orderDate: orderDate,
        status: 'מחכה להשלמת תשלום',
        orderType: 'הזמנה כללית',
        unitNumber: selectedHotel || undefined,
        items: orderItems,
      }

      for (let i = 0; i < 1; i++) {
        const res = await fetch(`${API_BASE_URL}/api/inventory/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderDate: newOrder.orderDate,
            deliveryDate: newOrder.deliveryDate,
            status: newOrder.status,
            orderType: newOrder.orderType,
            orderedBy: newOrder.orderedBy,
            unitNumber: newOrder.unitNumber,
            items: newOrder.items.map(item => ({
              itemId: item.itemId,
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
            })),
          }),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: 'שגיאה לא ידועה' }))
          throw new Error(errorData.detail || 'לא ניתן ליצור הזמנה')
        }
        if (i < 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      setSaving(false)
      alert(`ההזמנה נוצרה בהצלחה עם ${validProducts.length} פריטים`)
      navigate('/warehouse/orders')
    } catch (err: any) {
      setSaving(false)
      alert(err.message || 'אירעה שגיאה ביצירת ההזמנה')
    }
  }

  return (
    <div className="new-warehouse-order-container">
      <div className="new-warehouse-order-header">
        <button className="new-warehouse-order-back-button" onClick={() => navigate('/warehouse/orders')}>
          ← חזרה
        </button>
        <h1 className="new-warehouse-order-page-title">הזמנה חדשה</h1>
      </div>

      <div className="new-warehouse-order-scroll">
        <div className="new-warehouse-order-hotel-selector">
          <label className="new-warehouse-order-hotel-label">בחר מלון/יחידה:</label>
          <select
            className="new-warehouse-order-hotel-select"
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            dir="rtl"
          >
            <option value="">-- בחר מלון/יחידה --</option>
            {UNIT_CATEGORIES.map((category) => (
              <optgroup key={category.name} label={category.name}>
                {category.units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="new-warehouse-order-products-list">
          {products.map((product) => (
            <div key={product.id} className="new-warehouse-order-product-item">
              <div className="new-warehouse-order-product-info">
                <input
                  type="text"
                  className="new-warehouse-order-product-name-input"
                  value={product.name}
                  onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                  placeholder="שם המוצר"
                  dir="rtl"
                />
              </div>
              <div className="new-warehouse-order-product-controls">
                <input
                  type="number"
                  className="new-warehouse-order-quantity-input"
                  value={product.quantity}
                  onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                  placeholder="כמות"
                  dir="rtl"
                />
                {products.length > 1 && (
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="new-warehouse-order-remove-product-button"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddProduct}
          className="new-warehouse-order-add-product-button"
        >
          + הוסף פריט
        </button>

        <div className="new-warehouse-order-actions">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`new-warehouse-order-save-button ${saving ? 'disabled' : ''}`}
          >
            {saving ? 'שומר...' : 'צור הזמנה'}
          </button>
          <button
            onClick={() => navigate('/warehouse/orders')}
            className="new-warehouse-order-cancel-button"
            disabled={saving}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewWarehouseOrderScreen

