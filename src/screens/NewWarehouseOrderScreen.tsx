import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { InventoryOrder, InventoryOrderItem } from '../types/warehouse'
import { UNIT_CATEGORIES } from '../types/orders'
import './NewWarehouseOrderScreen.css'

type ProductEntry = {
  id: string
  name: string
  quantity: string
}

type ProductCategory = {
  name: string
  products: string[]
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    name: 'חומרי ניקוי / מטבח',
    products: [
      'סקוץ\' כרית כפולה',
      'סקוץ\' חד־צדדי',
      'סקוץ\' מיקרופייבר ריבוע',
      'מטאטא',
      'יעה ואשפתון',
      'מגב',
      'פרמידה סולימרית',
      'נייר זכוכית K300',
      'שקיות זבל גדול',
      'שקיות זבל מיני–שחורים',
      'נייר טואלט',
      'שמן לשטיפה',
      'סבון גוף משאבה',
      'קפה שחור והלוגן קפסולות',
      'ספל קפה',
      'סבון ידיים',
      'כלור נוזלי',
      'נוזל רצפות',
      'סבון כלים',
      'שפריצר חלונות',
      'שפריצר אבנית (אנטי־קאלק)',
      'מסיר שומנים',
      'מבשם ריח נעים',
      'מגב כיור קטן',
    ],
  },
  {
    name: 'מוצרים טכניים',
    products: [
      'שלט TV',
      'שלט טלוויזיה',
      'שלט מזגן',
      'בטריות קטנות',
      'בטריות גדולות',
      'מטקות',
      'כדורי פינגפונג',
      'כלור לבריכה',
      'רשת לבריכה',
      'מציל',
      'מקל ספיר',
      'ראש סוכר ניקול',
      'צבתות ענקיות',
      'צבתות סיליקון',
      'צבתות מרק',
      'כוסות שתייה קלה',
      'כוסות שתייה חמה',
      'כוסות שתייה יין',
      'סכין',
      'מזלג',
      'כפית',
      'כפות',
      'סכין חד גדול',
    ],
  },
]

type NewWarehouseOrderScreenProps = {
  userName: string
}

function NewWarehouseOrderScreen({}: NewWarehouseOrderScreenProps) {
  const navigate = useNavigate()
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map())
  const [selectedHotel, setSelectedHotel] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleProductToggle = (productName: string) => {
    const newSelected = new Map(selectedProducts)
    if (newSelected.has(productName)) {
      newSelected.delete(productName)
    } else {
      newSelected.set(productName, 1)
    }
    setSelectedProducts(newSelected)
  }

  const handleQuantityChange = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = new Map(selectedProducts)
      newSelected.delete(productName)
      setSelectedProducts(newSelected)
    } else {
      const newSelected = new Map(selectedProducts)
      newSelected.set(productName, quantity)
      setSelectedProducts(newSelected)
    }
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

  const handleSave = async () => {
    if (selectedProducts.size === 0) {
      alert('יש לבחור לפחות פריט אחד')
      return
    }

    setSaving(true)
    try {
      const orderDate = new Date().toISOString().split('T')[0]

      const orderItems: InventoryOrderItem[] = Array.from(selectedProducts.entries()).map(([productName, quantity]) => {
        return {
          id: '',
          itemId: '',
          itemName: productName,
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
      alert(`ההזמנה נוצרה בהצלחה עם ${selectedProducts.size} פריטים`)
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

        {/* Product Categories */}
        <div className="new-warehouse-order-categories">
          {PRODUCT_CATEGORIES.map((category) => (
            <div key={category.name} className="new-warehouse-order-category">
              <button
                className="new-warehouse-order-category-header"
                onClick={() => toggleCategory(category.name)}
              >
                <span className="new-warehouse-order-category-name">{category.name}</span>
                <span className="new-warehouse-order-category-toggle">
                  {expandedCategory === category.name ? '▼' : '▶'}
                </span>
              </button>
              {expandedCategory === category.name && (
                <div className="new-warehouse-order-products-grid">
                  {category.products.map((product) => (
                    <div
                      key={product}
                      className={`new-warehouse-order-product-option ${
                        selectedProducts.has(product) ? 'selected' : ''
                      }`}
                      onClick={() => handleProductToggle(product)}
                    >
                      <span className="new-warehouse-order-product-option-name">{product}</span>
                      {selectedProducts.has(product) && (
                        <div
                          className="new-warehouse-order-product-option-quantity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="new-warehouse-order-quantity-btn"
                            onClick={() =>
                              handleQuantityChange(
                                product,
                                (selectedProducts.get(product) || 1) - 1
                              )
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="new-warehouse-order-quantity-input-small"
                            value={selectedProducts.get(product) || 1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              handleQuantityChange(product, val)
                            }}
                            min="1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            className="new-warehouse-order-quantity-btn"
                            onClick={() =>
                              handleQuantityChange(
                                product,
                                (selectedProducts.get(product) || 1) + 1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Products Summary */}
        {selectedProducts.size > 0 && (
          <div className="new-warehouse-order-selected-summary">
            <h3 className="new-warehouse-order-selected-title">פריטים שנבחרו ({selectedProducts.size})</h3>
            <div className="new-warehouse-order-selected-list">
              {Array.from(selectedProducts.entries()).map(([productName, quantity]) => (
                <div key={productName} className="new-warehouse-order-selected-item">
                  <span className="new-warehouse-order-selected-item-name">{productName}</span>
                  <div className="new-warehouse-order-selected-item-controls">
                    <button
                      className="new-warehouse-order-quantity-btn"
                      onClick={() => handleQuantityChange(productName, quantity - 1)}
                    >
                      −
                    </button>
                    <span className="new-warehouse-order-selected-quantity">{quantity}</span>
                    <button
                      className="new-warehouse-order-quantity-btn"
                      onClick={() => handleQuantityChange(productName, quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      className="new-warehouse-order-remove-selected-btn"
                      onClick={() => handleProductToggle(productName)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

