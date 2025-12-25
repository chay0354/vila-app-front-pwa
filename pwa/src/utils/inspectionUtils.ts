import { InspectionMission, InspectionStatus } from '../types/inspections'
import { normalizeISODate, todayLocalISODate } from './dateUtils'

export function computeInspectionStatus(
  mission: Pick<InspectionMission, 'departureDate' | 'tasks'>
): InspectionStatus {
  const total = (mission.tasks || []).length
  const done = (mission.tasks || []).filter(t => t.completed).length
  if (total > 0 && done === total) return 'הביקורת הושלמה'

  const dep = normalizeISODate(mission.departureDate)
  const today = todayLocalISODate()
  if (!dep) return 'זמן הביקורות טרם הגיע'
  if (dep > today) return 'זמן הביקורות טרם הגיע'
  if (dep === today) return 'דורש ביקורת היום'
  return 'זמן הביקורת עבר'
}

