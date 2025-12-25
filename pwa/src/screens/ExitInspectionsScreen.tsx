import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order } from '../types/orders'
import { InspectionMission, defaultInspectionTasks } from '../types/inspections'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import InspectionMissionCard from '../components/InspectionMissionCard'
import './ExitInspectionsScreen.css'

type ExitInspectionsScreenProps = {
  userName: string
}

function ExitInspectionsScreen({}: ExitInspectionsScreenProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [inspectionMissions, setInspectionMissions] = useState<InspectionMission[]>([])

  useEffect(() => {
    loadOrders()
  }, [])

  // Reconcile missions from orders (similar to front-native logic)
  // Preserve task completion state when orders change
  useEffect(() => {
    setInspectionMissions(prev => {
      const prevByOrderId = new Map<string, InspectionMission>()
      prev.forEach(m => prevByOrderId.set(m.orderId, m))

      const next: InspectionMission[] = []
      orders
        .filter(o => o.status !== 'בוטל')
        .forEach(o => {
          const existing = prevByOrderId.get(o.id)
          const tasks =
            existing?.tasks?.length
              ? existing.tasks
              : defaultInspectionTasks.map(t => ({ ...t }))
          next.push({
            id: existing?.id || `INSP-${o.id}`,
            orderId: o.id,
            unitNumber: o.unitNumber,
            guestName: o.guestName,
            departureDate: o.departureDate,
            tasks,
            status: computeInspectionStatus({ departureDate: o.departureDate, tasks }),
          })
        })

      return next
    })
  }, [orders])

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (!res.ok) {
        console.error('Failed to load orders:', res.status)
        return
      }
      const data = await res.json()
      const list = (data || []).map((o: any): Order => ({
        id: o.id,
        guestName: o.guest_name ?? o.guestName ?? '',
        unitNumber: o.unit_number ?? o.unitNumber ?? '',
        arrivalDate: o.arrival_date ?? o.arrivalDate ?? '',
        departureDate: o.departure_date ?? o.departureDate ?? '',
        status: (o.status ?? 'חדש') as Order['status'],
        guestsCount: Number(o.guests_count ?? o.guestsCount ?? 0),
        specialRequests: o.special_requests ?? o.specialRequests ?? '',
        internalNotes: o.internal_notes ?? o.internalNotes ?? '',
        paidAmount: Number(o.paid_amount ?? o.paidAmount ?? 0),
        totalAmount: Number(o.total_amount ?? o.totalAmount ?? 0),
        paymentMethod: o.payment_method ?? o.paymentMethod ?? 'לא צוין',
      }))
      setOrders(list)
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  const handleUpdateMission = (id: string, updates: Partial<InspectionMission>) => {
    setInspectionMissions(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    )
  }

  const handleToggleTask = (missionId: string, taskId: string) => {
    const mission = inspectionMissions.find(m => m.id === missionId)
    if (!mission) return

    const updatedTasks = mission.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )

    handleUpdateMission(missionId, {
      tasks: updatedTasks,
      status: computeInspectionStatus({ departureDate: mission.departureDate, tasks: updatedTasks }),
    })
  }

  // Sort missions by departure date
  const sortedMissions = useMemo(() => {
    return [...inspectionMissions].sort((a, b) =>
      (a.departureDate || '').localeCompare(b.departureDate || '')
    )
  }, [inspectionMissions])

  return (
    <div className="exit-inspections-container">
      <div className="exit-inspections-header">
        <button className="exit-inspections-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
      </div>
      <div className="exit-inspections-scroll">
        <div className="exit-inspections-title-section">
          <div>
            <h1 className="exit-inspections-title">ביקורת יציאת אורח</h1>
            <p className="exit-inspections-subtitle">
              ניהול משימות ניקיון וביקורת לאחר עזיבת אורחים
            </p>
          </div>
          <div className="exit-inspections-stats-badge">
            <span className="exit-inspections-stats-badge-text">
              {sortedMissions.length} משימות
            </span>
          </div>
        </div>

        {sortedMissions.length === 0 ? (
          <div className="exit-inspections-empty-state">
            <p className="exit-inspections-empty-state-text">אין משימות ביקורת כרגע</p>
          </div>
        ) : (
          <div className="exit-inspections-missions-list">
            {sortedMissions.map(mission => (
              <InspectionMissionCard
                key={mission.id}
                mission={mission}
                onToggleTask={handleToggleTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExitInspectionsScreen

