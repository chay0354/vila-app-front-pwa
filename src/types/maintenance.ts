export type MaintenanceStatus = 'פתוח' | 'סגור'

export type MaintenanceTask = {
  id: string
  unitId: string
  title: string
  description: string
  status: MaintenanceStatus
  createdDate: string
  assignedTo?: string
  imageUri?: string
  closingImageUri?: string
  room?: string
}

export type MaintenanceUnit = {
  id: string
  name: string
  type: 'יחידה' | 'קוטג׳'
  tasks: MaintenanceTask[]
}

export type SystemUser = {
  id: string
  username: string
}

