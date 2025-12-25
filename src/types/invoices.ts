export type InvoiceItem = {
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

export type ExtractedInvoiceData = {
  total_price: number | null
  currency: string
  items: InvoiceItem[]
  vendor?: string | null
  date?: string | null
  invoice_number?: string | null
}

export type SavedInvoice = {
  id: string
  image_data: string
  total_price: number | null
  currency: string
  vendor: string | null
  date: string | null
  invoice_number: string | null
  extracted_data: ExtractedInvoiceData | null
  created_at: string
  updated_at: string
}

