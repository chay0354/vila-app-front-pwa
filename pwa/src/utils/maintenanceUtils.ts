import { UNIT_NAMES } from '../types/orders'

export function unitIdFromName(name: string): string {
  const m = name.match(/(\d+)/)
  const n = m ? Number(m[1]) : NaN
  if (Number.isFinite(n) && n >= 1 && n <= 10) return `unit-${n}`
  return 'unit-1'
}

export function normalizeMaintenanceUnitId(raw?: string | null): string {
  const s = (raw ?? '').toString().trim()
  if (!s) return 'unit-1'
  if (/^unit-\d+$/.test(s)) {
    const n = Number(s.split('-')[1])
    if (Number.isFinite(n) && n >= 1 && n <= 10) return `unit-${n}`
  }
  const m = s.match(/(\d+)/)
  if (m) {
    const n = Number(m[1])
    if (Number.isFinite(n) && n >= 1 && n <= 10) return `unit-${n}`
  }
  return 'unit-1'
}

export function getInitialMaintenanceUnits() {
  return UNIT_NAMES.map(name => ({
    id: unitIdFromName(name),
    name,
    type: 'יחידה' as const,
    tasks: [],
  }))
}

