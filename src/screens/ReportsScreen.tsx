import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { Order } from '../types/orders'
import { InspectionMission, defaultInspectionTasks } from '../types/inspections'
import { InventoryOrder, Warehouse, WarehouseItem } from '../types/warehouse'
import { MaintenanceUnit } from '../types/maintenance'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import { getInitialMaintenanceUnits, normalizeMaintenanceUnitId } from '../utils/maintenanceUtils'
import OptionCard from '../components/OptionCard'
import './ReportsScreen.css'

type ReportsScreenProps = {
  userName: string
}

type ReportsSummary = {
  totalRevenue: number
  totalPaid: number
  totalExpenses: number
}

type ActiveReport = 'orders' | 'inspections' | 'warehouse' | 'maintenance' | 'attendance'

// Utility functions
const msDay = 24 * 60 * 60 * 1000
const safeDate = (s: string) => {
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d : null
}
const diffDays = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / msDay))
const normalizeClock = (v: any) => (typeof v === 'string' ? v : '')

function ReportsScreen({}: ReportsScreenProps) {
  const navigate = useNavigate()
  const [activeReport, setActiveReport] = useState<ActiveReport>('orders')
  const [reportView, setReportView] = useState<'list' | 'detail'>('list')
  const [showAllWarehouseStock, setShowAllWarehouseStock] = useState(false)
  const [showAllWarehouseOrders, setShowAllWarehouseOrders] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [missions, setMissions] = useState<InspectionMission[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [allWarehouseItems, setAllWarehouseItems] = useState<WarehouseItem[]>([])
  const [inventoryOrders, setInventoryOrders] = useState<InventoryOrder[]>([])
  const [maintenanceUnits, setMaintenanceUnits] = useState<MaintenanceUnit[]>(getInitialMaintenanceUnits())
  const [maintenanceTasksReport, setMaintenanceTasksReport] = useState<any[]>([])
  const [systemUsers, setSystemUsers] = useState<Array<{ id: string; username: string }>>([])
  const [attendanceLogsReport, setAttendanceLogsReport] = useState<any[]>([])
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(null)
  const [reportsSummaryError, setReportsSummaryError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadOrders(),
      loadInventoryOrders(),
      loadReportsSummary(),
      loadAllWarehouseItemsForReports(),
      loadMaintenanceTasksReport(),
      loadAttendanceLogsReport(),
      loadSystemUsers(),
      loadMaintenanceUnits(),
    ])
  }

  const loadMaintenanceUnits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) return
      const data = (await res.json()) || []

      const baseUnits: MaintenanceUnit[] = getInitialMaintenanceUnits()
      const byId = new Map<string, MaintenanceUnit>()
      baseUnits.forEach(u => byId.set(u.id, u))

      ;(data || []).forEach((t: any) => {
        const unitId = normalizeMaintenanceUnitId(t.unit_id || t.unitId || t.unit)
        const unit = byId.get(unitId) || byId.get('unit-1')
        if (!unit) return

        const task = {
          id: (t.id || `task-${Date.now()}`).toString(),
          unitId,
          title: (t.title || '').toString(),
          description: (t.description || '').toString(),
          status: (t.status || 'פתוח') as 'פתוח' | 'בטיפול' | 'סגור',
          createdDate: (t.created_date || t.createdDate || new Date().toISOString().split('T')[0]).toString(),
          assignedTo: (t.assigned_to || t.assignedTo || undefined)?.toString(),
          imageUri: (t.image_uri || t.imageUri || undefined)?.toString(),
        }

        unit.tasks.push(task)
      })

      baseUnits.forEach(u => {
        u.tasks.sort((a, b) => (b.createdDate || '').localeCompare(a.createdDate || ''))
      })

      setMaintenanceUnits(baseUnits)
    } catch (err) {
      console.error('Error loading maintenance units:', err)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`)
      if (!res.ok) return
      const data = await res.json()
      const list = (data || []).map((o: any): Order => {
        return {
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
        }
      })
      setOrders(list)

      // Derive inspection missions from orders
      const inspectionMissions: InspectionMission[] = list
        .filter((o: Order) => o.status !== 'בוטל')
        .map((o: Order) => {
          const tasks = defaultInspectionTasks.map(t => ({ ...t }))
          return {
            id: `INSP-${o.id}`,
            orderId: o.id,
            unitNumber: o.unitNumber,
            guestName: o.guestName,
            departureDate: o.departureDate,
            tasks,
            status: computeInspectionStatus({ departureDate: o.departureDate, tasks }),
          }
        })
      setMissions(inspectionMissions)
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  const loadInventoryOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/orders`)
      if (!res.ok) return
      const data = await res.json()
      const list = (data || []).map((o: any): InventoryOrder => {
        const status = (o.status ?? 'מחכה להשלמת תשלום') as InventoryOrder['status']
        const orderType = (o.order_type ?? o.orderType ?? 'הזמנה כללית') as InventoryOrder['orderType']
        if (o.items && Array.isArray(o.items)) {
          return {
            id: o.id,
            orderDate: o.order_date ?? o.orderDate ?? '',
            deliveryDate: o.delivery_date ?? o.deliveryDate ?? undefined,
            status,
            orderType,
            orderedBy: o.ordered_by ?? o.orderedBy ?? undefined,
            unitNumber: o.unit_number ?? o.unitNumber ?? undefined,
            items: o.items.map((item: any) => ({
              id: item.id,
              itemId: item.item_id ?? item.itemId,
              itemName: item.item_name ?? item.itemName ?? '',
              quantity: Number(item.quantity ?? 0),
              unit: item.unit ?? '',
            })),
          }
        }
        return {
          id: o.id,
          orderDate: o.order_date ?? o.orderDate ?? '',
          deliveryDate: o.delivery_date ?? o.deliveryDate ?? undefined,
          status,
          orderType,
          orderedBy: o.ordered_by ?? o.orderedBy ?? undefined,
          unitNumber: o.unit_number ?? o.unitNumber ?? undefined,
          items: [],
        }
      })
      setInventoryOrders(list)
    } catch (err) {
      console.error('Error loading inventory orders:', err)
    }
  }

  const loadReportsSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/summary`)
      if (!res.ok) {
        const text = await res.text()
        setReportsSummaryError(`שגיאה בטעינת סיכום: ${res.status} ${text}`)
        return
      }
      const data = await res.json()
      setReportsSummary(data)
      setReportsSummaryError(null)
    } catch (err: any) {
      setReportsSummaryError(err.message || 'שגיאה בטעינת סיכום')
    }
  }

  const loadAllWarehouseItemsForReports = async () => {
    try {
      const warehousesRes = await fetch(`${API_BASE_URL}/api/warehouses`)
      if (!warehousesRes.ok) return
      const ws = (await warehousesRes.json()) || []
      setWarehouses(ws)

      const lists = await Promise.all(
        (ws as Array<{ id: string }>).map(async w => {
          try {
            const itemsRes = await fetch(`${API_BASE_URL}/api/warehouses/${w.id}/items`)
            if (!itemsRes.ok) return []
            return (await itemsRes.json()) || []
          } catch {
            return []
          }
        }),
      )
      setAllWarehouseItems(lists.flat())
    } catch (err) {
      console.error('Error loading all warehouse items for reports:', err)
    }
  }

  const loadMaintenanceTasksReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
      if (!res.ok) return
      const data = await res.json()
      setMaintenanceTasksReport(data || [])
    } catch (err) {
      console.error('Error loading maintenance tasks for reports:', err)
    }
  }

  const loadAttendanceLogsReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attendance/logs`)
      if (!res.ok) return
      const data = await res.json()
      setAttendanceLogsReport(data || [])
    } catch (err) {
      console.error('Error loading attendance logs for reports:', err)
    }
  }

  const loadSystemUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`)
      if (!res.ok) return
      const data = await res.json()
      setSystemUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Error loading system users', err)
    }
  }

  const resolveAssignee = (assignedTo?: string | null) => {
    const raw = (assignedTo ?? '').toString().trim()
    if (!raw) return 'לא משויך'
    const user = systemUsers.find(u => u.id.toString() === raw.toString())
    return user?.username || raw
  }

  const localTotalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const localTotalPaid = orders.reduce((sum, o) => sum + (o.paidAmount || 0), 0)

  const totalRevenue = reportsSummary?.totalRevenue ?? localTotalRevenue
  const totalPaid = reportsSummary?.totalPaid ?? localTotalPaid
  const totalExpenses = reportsSummary?.totalExpenses ?? 0
  const pendingAmount = Math.max(0, totalRevenue - totalPaid)

  const formatMoney = (v: number) => `₪${(v || 0).toLocaleString('he-IL')}`

  // Orders calculations
  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return counts
  }, [orders])

  const ordersByUnitReport = useMemo(() => {
    const map = new Map<
      string,
      {
        unit: string
        totalRevenue: number
        totalPaid: number
        totalOutstanding: number
        statusCounts: Record<string, number>
        orders: Array<Order & { remaining: number }>
      }
    >()

    orders.forEach(o => {
      const unit = (o.unitNumber || 'לא צוין').trim() || 'לא צוין'
      const total = Number(o.totalAmount || 0)
      const paid = Number(o.paidAmount || 0)
      const remaining = Math.max(0, total - paid)

      const prev =
        map.get(unit) || {
          unit,
          totalRevenue: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          statusCounts: {},
          orders: [],
        }

      prev.totalRevenue += total
      prev.totalPaid += paid
      prev.totalOutstanding += remaining
      prev.statusCounts[o.status] = (prev.statusCounts[o.status] || 0) + 1
      prev.orders = [...prev.orders, { ...o, remaining }]
      map.set(unit, prev)
    })

    const rows = Array.from(map.values()).map(r => ({
      ...r,
      orders: r.orders.sort((a, b) => (a.arrivalDate || '').localeCompare(b.arrivalDate || '')),
    }))

    rows.sort((a, b) => {
      if (a.totalOutstanding !== b.totalOutstanding) return b.totalOutstanding - a.totalOutstanding
      if (a.totalRevenue !== b.totalRevenue) return b.totalRevenue - a.totalRevenue
      return a.unit.localeCompare(b.unit, 'he')
    })

    return rows
  }, [orders])

  // Inspections calculations
  const inspectionsTotal = missions.length
  const inspectionsNotYet = missions.filter(m => m.status === 'זמן הביקורות טרם הגיע').length
  const inspectionsToday = missions.filter(m => m.status === 'דורש ביקורת היום').length
  const inspectionsOverdue = missions.filter(m => m.status === 'זמן הביקורת עבר').length
  const inspectionsDone = missions.filter(m => m.status === 'הביקורת הושלמה').length

  const inspectionsByUnit = useMemo(() => {
    const map = new Map<
      string,
      {
        unit: string
        total: number
        notYet: number
        today: number
        overdue: number
        done: number
        missions: Array<
          InspectionMission & {
            doneTasks: number
            totalTasks: number
            completionPct: number
          }
        >
      }
    >()

    missions.forEach(m => {
      const unit = (m.unitNumber || 'לא צוין').trim() || 'לא צוין'
      const prev = map.get(unit) || {
        unit,
        total: 0,
        notYet: 0,
        today: 0,
        overdue: 0,
        done: 0,
        missions: [],
      }

      const totalTasks = m.tasks?.length || 0
      const doneTasks = (m.tasks || []).filter(t => t.completed).length
      const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

      const next = { ...prev }
      next.total += 1
      if (m.status === 'זמן הביקורות טרם הגיע') next.notYet += 1
      else if (m.status === 'דורש ביקורת היום') next.today += 1
      else if (m.status === 'זמן הביקורת עבר') next.overdue += 1
      else if (m.status === 'הביקורת הושלמה') next.done += 1

      next.missions = [...next.missions, { ...m, totalTasks, doneTasks, completionPct }]
      map.set(unit, next)
    })

    const rows = Array.from(map.values()).map(r => ({
      ...r,
      missions: r.missions.sort((a, b) => b.departureDate.localeCompare(a.departureDate)),
    }))

    rows.sort((a, b) => {
      const openA = a.notYet + a.today + a.overdue
      const openB = b.notYet + b.today + b.overdue
      if (openA !== openB) return openB - openA
      return a.unit.localeCompare(b.unit, 'he')
    })

    return rows
  }, [missions])

  // Warehouse calculations
  const warehouseItemsCount = allWarehouseItems.length
  const warehouseTotalQty = allWarehouseItems.reduce((sum, i) => sum + (i.quantity || 0), 0)

  const warehouseById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    warehouses.forEach(w => map.set(w.id, { id: w.id, name: w.name }))
    return map
  }, [warehouses])

  const warehouseInventoryByWarehouse = useMemo(() => {
    const map = new Map<
      string,
      {
        warehouseId: string
        warehouseName: string
        totalQty: number
        items: Array<{ name: string; qty: number; unit: string }>
      }
    >()

    const nested = new Map<string, Map<string, { name: string; qty: number; unit: string }>>()
    allWarehouseItems.forEach(i => {
      const wid = i.warehouse_id
      if (!nested.has(wid)) nested.set(wid, new Map())
      const key = `${(i.item_name || '').trim()}__${(i.unit || '').trim()}`
      const prev = nested.get(wid)!.get(key) || {
        name: (i.item_name || 'מוצר').trim(),
        qty: 0,
        unit: (i.unit || 'יחידה').trim(),
      }
      nested.get(wid)!.set(key, { ...prev, qty: prev.qty + Number(i.quantity || 0) })
    })

    nested.forEach((itemsMap, wid) => {
      const wname = warehouseById.get(wid)?.name || 'מחסן'
      const items = Array.from(itemsMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'))
      const totalQty = items.reduce((s, it) => s + (it.qty || 0), 0)
      map.set(wid, { warehouseId: wid, warehouseName: wname, totalQty, items })
    })

    warehouses.forEach(w => {
      if (!map.has(w.id)) map.set(w.id, { warehouseId: w.id, warehouseName: w.name, totalQty: 0, items: [] })
    })

    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty)
  }, [allWarehouseItems, warehouseById, warehouses])

  const inventoryOrdersSorted = useMemo(() => {
    return [...inventoryOrders].sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''))
  }, [inventoryOrders])

  const inventoryOrdersByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    inventoryOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return counts
  }, [inventoryOrders])

  // Maintenance calculations
  const maintenanceTasksEffective = useMemo(() => {
    if (maintenanceTasksReport && maintenanceTasksReport.length > 0) return maintenanceTasksReport
    return maintenanceUnits.flatMap(u => u.tasks)
  }, [maintenanceTasksReport, maintenanceUnits])

  const normalizeMaintenanceStatus = (s: string) => {
    if (s === 'open' || s === 'פתוח') return 'פתוח'
    if (s === 'in_progress' || s === 'בטיפול') return 'בטיפול'
    if (s === 'closed' || s === 'סגור') return 'סגור'
    return s || 'פתוח'
  }

  const maintenanceTotal = maintenanceTasksEffective.length
  const maintenanceOpen = maintenanceTasksEffective.filter((t: any) => normalizeMaintenanceStatus(t.status) === 'פתוח').length
  const maintenanceInProgress = maintenanceTasksEffective.filter((t: any) => normalizeMaintenanceStatus(t.status) === 'בטיפול').length
  const maintenanceClosed = maintenanceTasksEffective.filter((t: any) => normalizeMaintenanceStatus(t.status) === 'סגור').length

  const maintenanceTopOpen = useMemo(() => {
    return maintenanceTasksEffective
      .filter((t: any) => normalizeMaintenanceStatus(t.status) !== 'סגור')
      .slice(0, 10)
  }, [maintenanceTasksEffective])

  const maintenanceByAssignee = useMemo(() => {
    const map = new Map<string, number>()
    maintenanceTasksEffective.forEach((t: any) => {
      const raw = (t.assigned_to || t.assignedTo || '').toString().trim()
      const label = raw ? resolveAssignee(raw) : 'לא משויך'
      map.set(label, (map.get(label) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([assignee, count]) => ({ assignee, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [maintenanceTasksEffective, systemUsers])

  const maintenanceByUnit = useMemo(() => {
    const map = new Map<string, { unit: string; total: number; open: number }>()
    maintenanceTasksEffective.forEach((t: any) => {
      const unit = (t.unit_id || t.unitId || t.unit || 'לא צוין').toString()
      const st = normalizeMaintenanceStatus(t.status)
      const prev = map.get(unit) || { unit, total: 0, open: 0 }
      map.set(unit, { unit, total: prev.total + 1, open: prev.open + (st === 'סגור' ? 0 : 1) })
    })
    return Array.from(map.values()).sort((a, b) => b.open - a.open).slice(0, 10)
  }, [maintenanceTasksEffective])

  const maintenanceOldOpen = useMemo(() => {
    const today = new Date()
    const items = maintenanceTasksEffective
      .filter((t: any) => normalizeMaintenanceStatus(t.status) !== 'סגור')
      .map((t: any) => {
        const d = safeDate(t.created_date || t.createdDate || '')
        const age = d ? diffDays(d, today) : 0
        return { ...t, _ageDays: age }
      })
      .sort((a: any, b: any) => (b._ageDays || 0) - (a._ageDays || 0))
      .slice(0, 10)
    return items
  }, [maintenanceTasksEffective])

  const maintenanceUnitsMap = useMemo(() => {
    const map = new Map<string, string>()
    maintenanceUnits.forEach(u => map.set(u.id, u.name))
    return map
  }, [maintenanceUnits])

  const maintenanceTasksByUnit = useMemo(() => {
    const map = new Map<
      string,
      {
        unitId: string
        unitName: string
        total: number
        open: number
        inProgress: number
        closed: number
        tasks: any[]
      }
    >()

    maintenanceTasksEffective.forEach((t: any) => {
      const unitId = (t.unit_id || t.unitId || t.unit || 'לא צוין').toString()
      const unitName = maintenanceUnitsMap.get(unitId) || unitId
      const st = normalizeMaintenanceStatus(t.status)
      const prev =
        map.get(unitId) || {
          unitId,
          unitName,
          total: 0,
          open: 0,
          inProgress: 0,
          closed: 0,
          tasks: [],
        }
      const next = { ...prev }
      next.total += 1
      if (st === 'פתוח') next.open += 1
      else if (st === 'בטיפול') next.inProgress += 1
      else if (st === 'סגור') next.closed += 1
      next.tasks = [...next.tasks, t]
      map.set(unitId, next)
    })

    const rows = Array.from(map.values())
      .map(r => ({
        ...r,
        tasks: r.tasks.sort((a: any, b: any) => {
          const sa = normalizeMaintenanceStatus(a.status)
          const sb = normalizeMaintenanceStatus(b.status)
          const order = (s: string) => (s === 'פתוח' ? 0 : s === 'בטיפול' ? 1 : 2)
          const cmp = order(sa) - order(sb)
          if (cmp !== 0) return cmp
          const da = safeDate(a.created_date || a.createdDate || '')?.getTime() || 0
          const db = safeDate(b.created_date || b.createdDate || '')?.getTime() || 0
          return db - da
        }),
      }))
      .sort((a, b) => b.open + b.inProgress - (a.open + a.inProgress))

    return rows
  }, [maintenanceTasksEffective, maintenanceUnitsMap])

  // Attendance calculations
  const attendanceLogs = attendanceLogsReport || []
  const currentlyClockedInEmployees = useMemo(() => {
    const active = new Set<string>()
    ;(attendanceLogs as any[]).forEach(l => {
      const emp = l.employee || l.emp || l.user || ''
      const clockOut = l.clock_out
      if (emp && (clockOut === null || clockOut === undefined || clockOut === '')) {
        active.add(emp)
      }
    })
    return Array.from(active).sort()
  }, [attendanceLogs])

  const hoursLast7DaysByEmployee = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000
    const map = new Map<string, number>()
    ;(attendanceLogs as any[]).forEach(l => {
      const emp = l.employee || ''
      const ci = new Date(normalizeClock(l.clock_in)).getTime()
      if (!emp || !ci || ci < since) return
      const coRaw = normalizeClock(l.clock_out)
      const co = coRaw ? new Date(coRaw).getTime() : Date.now()
      const hours = Math.max(0, (co - ci) / (1000 * 60 * 60))
      map.set(emp, (map.get(emp) || 0) + hours)
    })
    return Array.from(map.entries())
      .map(([employee, hours]) => ({ employee, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
  }, [attendanceLogs])

  const hoursLast30DaysByEmployee = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000
    const map = new Map<string, number>()
    ;(attendanceLogs as any[]).forEach(l => {
      const emp = l.employee || ''
      const ci = new Date(normalizeClock(l.clock_in)).getTime()
      if (!emp || !ci || ci < since) return
      const coRaw = normalizeClock(l.clock_out)
      const co = coRaw ? new Date(coRaw).getTime() : Date.now()
      const hours = Math.max(0, (co - ci) / (1000 * 60 * 60))
      map.set(emp, (map.get(emp) || 0) + hours)
    })
    return Array.from(map.entries())
      .map(([employee, hours]) => ({ employee, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)
  }, [attendanceLogs])

  const attendanceRecentSessions = useMemo(() => {
    const rows = (attendanceLogs as any[])
      .slice(0, 20)
      .map(l => {
        const emp = l.employee || ''
        const ci = safeDate(normalizeClock(l.clock_in))
        const co = safeDate(normalizeClock(l.clock_out))
        const end = co || new Date()
        const durHrs = ci ? Math.max(0, (end.getTime() - ci.getTime()) / (1000 * 60 * 60)) : 0
        const day = ci ? `${ci.getDate()}/${ci.getMonth() + 1}` : ''
        const timeIn = ci ? `${ci.getHours().toString().padStart(2, '0')}:${ci.getMinutes().toString().padStart(2, '0')}` : ''
        const timeOut = co ? `${co.getHours().toString().padStart(2, '0')}:${co.getMinutes().toString().padStart(2, '0')}` : (normalizeClock(l.clock_out) ? '' : '—')
        return { id: l.id || `${emp}-${day}-${timeIn}`, emp, day, timeIn, timeOut, durHrs, isOpen: !co }
      })
    return rows
  }, [attendanceLogs])

  const attendancePeriodsByEmployee = useMemo(() => {
    const map = new Map<
      string,
      {
        employee: string
        isActive: boolean
        sessions: Array<{ id: string; day: string; timeIn: string; timeOut: string; durHrs: number; isOpen: boolean }>
        totalHours: number
      }
    >()

    attendanceRecentSessions.forEach(s => {
      const emp = s.emp || 'לא צוין'
      const prev = map.get(emp) || { employee: emp, isActive: false, sessions: [], totalHours: 0 }
      map.set(emp, {
        employee: emp,
        isActive: prev.isActive || s.isOpen,
        sessions: [...prev.sessions, s],
        totalHours: prev.totalHours + (s.durHrs || 0),
      })
    })

    return Array.from(map.values()).sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      return b.totalHours - a.totalHours
    })
  }, [attendanceRecentSessions])

  const reportTitle =
    activeReport === 'orders'
      ? 'דוח הזמנות'
      : activeReport === 'inspections'
        ? 'דוח ביקורות יציאה'
        : activeReport === 'warehouse'
          ? 'דוח מחסן'
          : activeReport === 'maintenance'
            ? 'דוח תחזוקה'
            : 'דוח נוכחות'

  const openReport = (r: ActiveReport) => {
    setActiveReport(r)
    setReportView('detail')
  }

  const handleRefresh = () => {
    loadAllData()
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <button
          className="reports-back-button"
          onClick={() => {
            if (reportView === 'detail') {
              setReportView('list')
              return
            }
            navigate('/hub')
          }}
        >
          ← {reportView === 'detail' ? 'לכל הדוחות' : 'חזרה'}
        </button>
        <button className="reports-refresh-button" onClick={handleRefresh}>
          רענון
        </button>
      </div>

      <div className="reports-scroll">
        <div className="reports-page-header">
          <h1 className="reports-page-title">
            {reportView === 'detail' ? `${reportTitle} – פירוט` : 'דוחות'}
          </h1>
          <p className="reports-page-subtitle">
            {reportView === 'detail'
              ? 'נתונים מורחבים ותובנות – מתוך המערכת'
              : 'סיכום מצב המערכת לפי מודולים (ללא צ׳אט)'}
          </p>
        </div>

        <div className="reports-summary-card">
          <div className="reports-summary-card-header">
            <h2 className="reports-summary-title">סיכום פיננסי</h2>
          </div>
          <div className="reports-summary-stats-row">
            <div className="reports-summary-stat-item">
              <div className="reports-summary-stat-value">{formatMoney(totalRevenue)}</div>
              <div className="reports-summary-stat-label">הכנסות</div>
            </div>
            <div className="reports-summary-stat-divider" />
            <div className="reports-summary-stat-item">
              <div className="reports-summary-stat-value">{formatMoney(totalPaid)}</div>
              <div className="reports-summary-stat-label">שולם</div>
            </div>
          </div>
          <div className="reports-summary-stats-row" style={{ marginTop: '14px' }}>
            <div className="reports-summary-stat-item">
              <div className="reports-summary-stat-value">{formatMoney(pendingAmount)}</div>
              <div className="reports-summary-stat-label">יתרה פתוחה</div>
            </div>
            <div className="reports-summary-stat-divider" />
            <div className="reports-summary-stat-item">
              <div className="reports-summary-stat-value">{formatMoney(totalExpenses)}</div>
              <div className="reports-summary-stat-label">הוצאות</div>
            </div>
          </div>
          {reportsSummaryError && (
            <div className="reports-summary-note-container">
              <p className="reports-summary-note">{reportsSummaryError}</p>
            </div>
          )}
        </div>

        {reportView === 'list' ? (
          <div style={{ marginTop: '14px' }}>
            <h2 className="reports-section-title">דוחות לפי מסך</h2>
            <div className="reports-option-grid">
              <OptionCard
                title="דוח הזמנות"
                icon="הז"
                accent="#38bdf8"
                details={[
                  `מספר הזמנות: ${orders.length}`,
                  `סה״כ הכנסות: ${formatMoney(localTotalRevenue)}`,
                  `שולם: ${formatMoney(localTotalPaid)}`,
                ]}
                cta="פתח דוח מלא"
                onPress={() => openReport('orders')}
              />
              <OptionCard
                title="דוח ביקורות יציאה"
                icon="בי"
                accent="#f97316"
                details={[
                  `סה״כ ביקורות: ${inspectionsTotal}`,
                  `דורש היום: ${inspectionsToday} | עבר: ${inspectionsOverdue}`,
                  `טרם הגיע: ${inspectionsNotYet} | הושלמה: ${inspectionsDone}`,
                ]}
                cta="פתח דוח מלא"
                onPress={() => openReport('inspections')}
              />
              <OptionCard
                title="דוח מחסן"
                icon="מח"
                accent="#a78bfa"
                details={[
                  `מספר מחסנים: ${warehouses.length}`,
                  `מספר פריטים: ${warehouseItemsCount}`,
                  `כמות כוללת: ${warehouseTotalQty}`,
                ]}
                cta="פתח דוח מלא"
                onPress={() => openReport('warehouse')}
              />
              <OptionCard
                title="דוח תחזוקה"
                icon="תח"
                accent="#22c55e"
                details={[
                  `סה״כ משימות: ${maintenanceTotal}`,
                  `פתוח: ${maintenanceOpen} | בטיפול: ${maintenanceInProgress}`,
                  `סגור: ${maintenanceClosed}`,
                ]}
                cta="פתח דוח מלא"
                onPress={() => openReport('maintenance')}
              />
              <OptionCard
                title="דוח נוכחות"
                icon="נכ"
                accent="#ec4899"
                details={[
                  `לוגים אחרונים: ${(attendanceLogsReport || []).length}`,
                ]}
                cta="פתח דוח מלא"
                onPress={() => openReport('attendance')}
              />
            </div>
          </div>
        ) : (
          <div className="reports-detail-card">
            <div className="reports-detail-header">
              <h2 className="reports-detail-title">{reportTitle}</h2>
              <button
                className="reports-open-screen-button"
                onClick={() => {
                  if (activeReport === 'orders') navigate('/orders')
                  else if (activeReport === 'inspections') navigate('/exit-inspections')
                  else if (activeReport === 'warehouse') navigate('/warehouse')
                  else if (activeReport === 'maintenance') navigate('/maintenance')
                }}
              >
                פתח מסך
              </button>
            </div>

            {/* Orders Report Detail */}
            {activeReport === 'orders' && (
              <div className="reports-detail-content">
                <p className="reports-detail-label">כל ההזמנות לפי יחידת נופש</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">סה״כ הזמנות</div>
                    <div className="reports-unit-kpi-value">{orders.length}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">חדש</div>
                    <div className="reports-unit-kpi-value">{ordersByStatus['חדש'] || 0}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">באישור</div>
                    <div className="reports-unit-kpi-value">{ordersByStatus['באישור'] || 0}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">שולם חלקית</div>
                    <div className="reports-unit-kpi-value">{ordersByStatus['שולם חלקית'] || 0}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">שולם</div>
                    <div className="reports-unit-kpi-value">{ordersByStatus['שולם'] || 0}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">בוטל</div>
                    <div className="reports-unit-kpi-value">{ordersByStatus['בוטל'] || 0}</div>
                  </div>
                </div>

                {ordersByUnitReport.length === 0 ? (
                  <p className="reports-progress-note">אין הזמנות</p>
                ) : (
                  ordersByUnitReport.map(u => (
                    <div key={u.unit} className="reports-unit-card" style={{ borderColor: '#bae6fd' }}>
                      <h3 className="reports-unit-card-title">{u.unit}</h3>
                      <div className="reports-unit-kpi-grid">
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">הזמנות</div>
                          <div className="reports-unit-kpi-value">{u.orders.length}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">הכנסות</div>
                          <div className="reports-unit-kpi-value">{formatMoney(u.totalRevenue)}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">שולם</div>
                          <div className="reports-unit-kpi-value">{formatMoney(u.totalPaid)}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">יתרה</div>
                          <div className="reports-unit-kpi-value">{formatMoney(u.totalOutstanding)}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        {u.orders.map(o => (
                          <div key={o.id} className="reports-order-mini-card">
                            <div className="reports-order-mini-header">
                              <span className="reports-order-id">#{o.id}</span>
                            </div>
                            <p className="reports-order-line">סטטוס: {o.status}</p>
                            <p className="reports-order-line">
                              תאריכים: {o.arrivalDate}–{o.departureDate}
                            </p>
                            <p className="reports-order-line">
                              אורח: {o.guestName || 'ללא שם'} • אורחים: {o.guestsCount}
                            </p>
                            <p className="reports-order-line">
                              תשלום: {formatMoney(o.paidAmount)}/{formatMoney(o.totalAmount)} • יתרה: {formatMoney(o.remaining)}
                            </p>
                            <p className="reports-order-line">
                              אופן תשלום: {o.paymentMethod || 'לא צוין'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Inspections Report Detail */}
            {activeReport === 'inspections' && (
              <div className="reports-detail-content">
                <p className="reports-detail-label">כל הביקורות לפי יחידת נופש</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">סה״כ</div>
                    <div className="reports-unit-kpi-value">{inspectionsTotal}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">טרם הגיע</div>
                    <div className="reports-unit-kpi-value">{inspectionsNotYet}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">דורש היום</div>
                    <div className="reports-unit-kpi-value">{inspectionsToday}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">עבר</div>
                    <div className="reports-unit-kpi-value">{inspectionsOverdue}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">הושלמה</div>
                    <div className="reports-unit-kpi-value">{inspectionsDone}</div>
                  </div>
                </div>

                {inspectionsByUnit.length === 0 ? (
                  <p className="reports-progress-note">אין ביקורות</p>
                ) : (
                  inspectionsByUnit.map(u => (
                    <div key={u.unit} className="reports-unit-card" style={{ borderColor: '#fed7aa' }}>
                      <h3 className="reports-unit-card-title">{u.unit}</h3>
                      <p className="reports-progress-note">
                        טרם הגיע: {u.notYet} | דורש היום: {u.today} | עבר: {u.overdue} | הושלמה: {u.done} | סה״כ: {u.total}
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        {u.missions.map(m => (
                          <div key={m.id} className="reports-order-mini-card">
                            <div className="reports-order-mini-header">
                              <span className="reports-order-id">{m.departureDate}</span>
                            </div>
                            <p className="reports-order-line">סטטוס: {m.status}</p>
                            <p className="reports-order-line">
                              משימות: {m.doneTasks}/{m.totalTasks} ({m.completionPct}%)
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Warehouse Report Detail */}
            {activeReport === 'warehouse' && (
              <div className="reports-detail-content">
                <p className="reports-detail-label">חלק 1: מלאי – כמה יש מכל מוצר בכל מחסן</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">מחסנים</div>
                    <div className="reports-unit-kpi-value">{warehouses.length}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">פריטים (שורות)</div>
                    <div className="reports-unit-kpi-value">{warehouseItemsCount}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">כמות כוללת</div>
                    <div className="reports-unit-kpi-value">{warehouseTotalQty}</div>
                  </div>
                </div>

                <button
                  className="reports-show-all-button"
                  onClick={() => setShowAllWarehouseStock(v => !v)}
                  style={{ backgroundColor: '#a78bfa', marginTop: '10px' }}
                >
                  {showAllWarehouseStock ? 'הצג פחות' : 'הצג הכל'}
                </button>

                {warehouseInventoryByWarehouse.length === 0 ? (
                  <p className="reports-progress-note" style={{ marginTop: '10px' }}>אין נתוני מלאי</p>
                ) : (
                  warehouseInventoryByWarehouse.map(w => (
                    <div key={w.warehouseId} className="reports-unit-card" style={{ borderColor: '#ddd6fe', marginTop: '12px' }}>
                      <h3 className="reports-unit-card-title">{w.warehouseName}</h3>
                      <div className="reports-unit-kpi-grid">
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">כמות כוללת</div>
                          <div className="reports-unit-kpi-value">{w.totalQty}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">מספר מוצרים</div>
                          <div className="reports-unit-kpi-value">{w.items.length}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        {(showAllWarehouseStock ? w.items : w.items.slice(0, 25)).map(it => (
                          <p key={`${w.warehouseId}-${it.name}-${it.unit}`} className="reports-progress-note">
                            {it.name}: {it.qty} {it.unit}
                          </p>
                        ))}
                        {!showAllWarehouseStock && w.items.length > 25 && (
                          <p className="reports-progress-note" style={{ marginTop: '6px' }}>
                            ועוד {w.items.length - 25} מוצרים…
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '16px' }}>חלק 2: הזמנות – סטטוס ותוכן</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">סה״כ הזמנות</div>
                    <div className="reports-unit-kpi-value">{inventoryOrders.length}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">שולם מלא</div>
                    <div className="reports-unit-kpi-value">{inventoryOrdersByStatus['שולם מלא'] || 0}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">מחכה להשלמת תשלום</div>
                    <div className="reports-unit-kpi-value">{inventoryOrdersByStatus['מחכה להשלמת תשלום'] || 0}</div>
                  </div>
                </div>

                <button
                  className="reports-show-all-button"
                  onClick={() => setShowAllWarehouseOrders(v => !v)}
                  style={{ backgroundColor: '#f59e0b', marginTop: '10px' }}
                >
                  {showAllWarehouseOrders ? 'הצג פחות' : 'הצג הכל'}
                </button>

                {inventoryOrdersSorted.length === 0 ? (
                  <p className="reports-progress-note" style={{ marginTop: '10px' }}>אין הזמנות מחסן</p>
                ) : (
                  (showAllWarehouseOrders ? inventoryOrdersSorted : inventoryOrdersSorted.slice(0, 30)).map(o => (
                    <div key={o.id} className="reports-unit-card" style={{ borderColor: '#fde68a', marginTop: '12px' }}>
                      <h3 className="reports-unit-card-title-small">{o.id}</h3>
                      <p className="reports-progress-note">סטטוס: {o.status}</p>
                      {o.items && o.items.length > 0 ? (
                        o.items.map((item, idx) => (
                          <p key={item.id || idx} className="reports-progress-note">
                            תוכן: {item.itemName} — {item.quantity} {item.unit}
                          </p>
                        ))
                      ) : o.itemName ? (
                        <p className="reports-progress-note">
                          תוכן: {o.itemName} — {o.quantity || 0} {o.unit || ''}
                        </p>
                      ) : null}
                      <p className="reports-progress-note">סוג: {o.orderType}</p>
                      {o.orderedBy && <p className="reports-progress-note">הוזמן ע״י: {o.orderedBy}</p>}
                      {o.unitNumber && <p className="reports-progress-note">יחידה: {o.unitNumber}</p>}
                      <p className="reports-progress-note">תאריך הזמנה: {o.orderDate || '-'}</p>
                      {o.deliveryDate && <p className="reports-progress-note">תאריך אספקה: {o.deliveryDate}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Maintenance Report Detail */}
            {activeReport === 'maintenance' && (
              <div className="reports-detail-content">
                <p className="reports-detail-label">סיכום</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">פתוח</div>
                    <div className="reports-unit-kpi-value">{maintenanceOpen}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">בטיפול</div>
                    <div className="reports-unit-kpi-value">{maintenanceInProgress}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">סגור</div>
                    <div className="reports-unit-kpi-value">{maintenanceClosed}</div>
                  </div>
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">סה״כ</div>
                    <div className="reports-unit-kpi-value">{maintenanceTotal}</div>
                  </div>
                </div>

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>התפלגות לפי עובד (Top 8)</p>
                {maintenanceByAssignee.length === 0 ? (
                  <p className="reports-progress-note">אין נתונים</p>
                ) : (
                  maintenanceByAssignee.map(p => (
                    <p key={p.assignee} className="reports-progress-note">
                      {p.assignee}: {p.count}
                    </p>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>יחידות עם הכי הרבה משימות פתוחות (Top 10)</p>
                {maintenanceByUnit.length === 0 ? (
                  <p className="reports-progress-note">אין נתונים</p>
                ) : (
                  maintenanceByUnit.map(u => (
                    <p key={u.unit} className="reports-progress-note">
                      {u.unit}: פתוחות {u.open}, סה״כ {u.total}
                    </p>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>משימות פתוחות (Top 10)</p>
                {maintenanceTopOpen.length === 0 ? (
                  <p className="reports-progress-note">אין משימות פתוחות</p>
                ) : (
                  maintenanceTopOpen.map((t: any) => {
                    const assigned = (t.assigned_to || t.assignedTo || '').toString()
                    return (
                      <div key={t.id} className="reports-order-mini-card">
                        <div className="reports-order-mini-header">
                          <span className="reports-order-id">{t.title || 'משימה'}</span>
                        </div>
                        <p className="reports-order-line">סטטוס: {normalizeMaintenanceStatus(t.status)}</p>
                        {assigned ? (
                          <p className="reports-order-line">מוקצה ל: {resolveAssignee(assigned)}</p>
                        ) : (
                          <p className="reports-order-line">מוקצה ל: לא משויך</p>
                        )}
                      </div>
                    )
                  })
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>משימות פתוחות הכי ישנות (Top 10)</p>
                {maintenanceOldOpen.length === 0 ? (
                  <p className="reports-progress-note">אין נתונים</p>
                ) : (
                  maintenanceOldOpen.map((t: any) => (
                    <div key={t.id} className="reports-order-mini-card">
                      <div className="reports-order-mini-header">
                        <span className="reports-order-id">{t.title || 'משימה'}</span>
                      </div>
                      <p className="reports-order-line">סטטוס: {normalizeMaintenanceStatus(t.status)}</p>
                      <p className="reports-order-line">גיל: {t._ageDays || 0} ימים</p>
                    </div>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '16px' }}>כל המשימות לפי יחידה</p>
                {maintenanceTasksByUnit.length === 0 ? (
                  <p className="reports-progress-note">אין משימות תחזוקה</p>
                ) : (
                  maintenanceTasksByUnit.map(u => (
                    <div key={u.unitId} className="reports-unit-card" style={{ borderColor: '#bbf7d0', marginTop: '12px' }}>
                      <h3 className="reports-unit-card-title">{u.unitName}</h3>
                      <div className="reports-unit-kpi-grid">
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">פתוח</div>
                          <div className="reports-unit-kpi-value">{u.open}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">בטיפול</div>
                          <div className="reports-unit-kpi-value">{u.inProgress}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">סגור</div>
                          <div className="reports-unit-kpi-value">{u.closed}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">סה״כ</div>
                          <div className="reports-unit-kpi-value">{u.total}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        {u.tasks.map((t: any) => (
                          <div key={t.id} className="reports-order-mini-card">
                            <div className="reports-order-mini-header">
                              <span className="reports-order-id">{t.title || 'משימה'}</span>
                            </div>
                            <p className="reports-order-line">סטטוס: {normalizeMaintenanceStatus(t.status)}</p>
                            {(t.assigned_to || t.assignedTo) ? (
                              <p className="reports-order-line">
                                מוקצה ל: {resolveAssignee((t.assigned_to || t.assignedTo).toString())}
                              </p>
                            ) : (
                              <p className="reports-order-line">מוקצה ל: לא משויך</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Attendance Report Detail */}
            {activeReport === 'attendance' && (
              <div className="reports-detail-content">
                <p className="reports-detail-label">סטטוס עכשיו</p>
                <div className="reports-unit-kpi-grid">
                  <div className="reports-unit-kpi-item">
                    <div className="reports-unit-kpi-label">עובדים מחוברים</div>
                    <div className="reports-unit-kpi-value">{currentlyClockedInEmployees.length}</div>
                  </div>
                </div>
                {currentlyClockedInEmployees.length > 0 && (
                  <p className="reports-progress-note">
                    עובדים פעילים: {currentlyClockedInEmployees.join(', ')}
                  </p>
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>שעות ב-7 ימים אחרונים (Top 10)</p>
                {hoursLast7DaysByEmployee.length === 0 ? (
                  <p className="reports-progress-note">אין נתוני נוכחות</p>
                ) : (
                  hoursLast7DaysByEmployee.map(r => (
                    <p key={r.employee} className="reports-progress-note">
                      {r.employee}: {r.hours.toFixed(1)} שעות
                    </p>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>שעות ב-30 ימים אחרונים (Top 10)</p>
                {hoursLast30DaysByEmployee.length === 0 ? (
                  <p className="reports-progress-note">אין נתונים</p>
                ) : (
                  hoursLast30DaysByEmployee.map(r => (
                    <p key={r.employee} className="reports-progress-note">
                      {r.employee}: {r.hours.toFixed(1)} שעות
                    </p>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '12px' }}>סשנים אחרונים (Top 20)</p>
                {attendanceRecentSessions.length === 0 ? (
                  <p className="reports-progress-note">אין סשנים</p>
                ) : (
                  attendanceRecentSessions.map(s => (
                    <div key={s.id} className="reports-order-mini-card">
                      <div className="reports-order-mini-header">
                        <span className="reports-order-id">{s.emp}</span>
                      </div>
                      <p className="reports-order-line">תאריך: {s.day}</p>
                      <p className="reports-order-line">שעות: {s.timeIn} - {s.timeOut}</p>
                      <p className="reports-order-line">
                        משך: {s.durHrs.toFixed(1)} שעות{s.isOpen ? ' (פתוח)' : ''}
                      </p>
                    </div>
                  ))
                )}

                <p className="reports-detail-label" style={{ marginTop: '16px' }}>תקופות עבודה לפי עובד</p>
                {attendancePeriodsByEmployee.length === 0 ? (
                  <p className="reports-progress-note">אין נתונים</p>
                ) : (
                  attendancePeriodsByEmployee.map(emp => (
                    <div key={emp.employee} className="reports-unit-card" style={{ borderColor: '#fbcfe8', marginTop: '12px' }}>
                      <h3 className="reports-unit-card-title">{emp.employee}</h3>
                      <div className="reports-unit-kpi-grid">
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">סטטוס</div>
                          <div className="reports-unit-kpi-value">{emp.isActive ? 'בעבודה עכשיו' : 'לא בעבודה'}</div>
                        </div>
                        <div className="reports-unit-kpi-item">
                          <div className="reports-unit-kpi-label">סך שעות (לוגים אחרונים)</div>
                          <div className="reports-unit-kpi-value">{emp.totalHours.toFixed(1)}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        {emp.sessions.map(s => (
                          <div key={s.id} className="reports-order-mini-card">
                            <div className="reports-order-mini-header">
                              <span className="reports-order-id">{s.day}</span>
                            </div>
                            <p className="reports-order-line">שעות: {s.timeIn} - {s.timeOut}</p>
                            <p className="reports-order-line">
                              משך: {s.durHrs.toFixed(1)} שעות{s.isOpen ? ' (פתוח)' : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsScreen
