export function normalizeISODate(raw?: string | null): string {
  const s = (raw ?? '').toString().trim()
  if (!s) return ''
  // Handles both "YYYY-MM-DD" and ISO timestamps
  return s.length >= 10 ? s.slice(0, 10) : s
}

export function todayLocalISODate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

