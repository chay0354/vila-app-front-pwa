import { UNIT_NAMES } from '../types/orders'

export function unitIdFromName(name: string): string {
  // Generate a stable ID from the unit name
  // Replace spaces and special chars with hyphens, convert to lowercase
  const id = name
    .replace(/\s+/g, '-')
    .replace(/[^\u0590-\u05FF\w-]/g, '')
    .toLowerCase()
  return `unit-${id}`
}

export function normalizeMaintenanceUnitId(raw?: string | null): string {
  const s = (raw ?? '').toString().trim()
  if (!s) {
    // Default to first unit if empty
    return UNIT_NAMES.length > 0 ? unitIdFromName(UNIT_NAMES[0]) : 'unit-default'
  }
  // If it's already a unit-* format, check if it matches a known unit
  if (/^unit-/.test(s)) {
    // Try to find matching unit name
    const unitName = UNIT_NAMES.find(name => unitIdFromName(name) === s)
    if (unitName) return s
  }
  // Try to find by name match
  const matchingUnit = UNIT_NAMES.find(name => 
    name.toLowerCase() === s.toLowerCase() ||
    name.includes(s) ||
    s.includes(name)
  )
  if (matchingUnit) {
    return unitIdFromName(matchingUnit)
  }
  // If no match, generate ID from the string itself
  return unitIdFromName(s)
}

export function getInitialMaintenanceUnits() {
  return UNIT_NAMES.map(name => ({
    id: unitIdFromName(name),
    name,
    type: 'יחידה' as const,
    tasks: [],
  }))
}

