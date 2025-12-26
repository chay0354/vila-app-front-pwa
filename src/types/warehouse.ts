export type InventoryItem = {
  id: string
  name: string
  category: 'מצעים' | 'מוצרי ניקיון' | 'ציוד מתכלה' | 'אחר'
  unit: string
  currentStock: number
  minStock: number
}

export type InventoryOrderItem = {
  id: string
  itemId?: string
  itemName: string
  quantity: number
  unit: string
}

export type InventoryOrder = {
  id: string
  orderDate: string
  deliveryDate?: string
  status: 'שולם מלא' | 'מחכה להשלמת תשלום'
  orderType: 'הזמנת עובד' | 'הזמנה כללית'
  orderedBy?: string
  unitNumber?: string
  items: InventoryOrderItem[]
  // Legacy fields for backward compatibility
  itemId?: string
  itemName?: string
  quantity?: number
  unit?: string
  orderGroupId?: string
}

export type Warehouse = {
  id: string
  name: string
  location?: string
}

export type WarehouseItem = {
  id: string
  warehouse_id: string
  item_id: string
  item_name: string
  quantity: number
  unit: string
}

