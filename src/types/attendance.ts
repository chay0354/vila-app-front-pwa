export type AttendanceStatus = {
  is_clocked_in: boolean
  session: {
    clock_in: string
    clock_out?: string | null
  } | null
}

export type AttendanceLog = {
  id: string | number
  employee?: string
  emp?: string
  user?: string
  clock_in: string
  clock_out?: string | null
}

