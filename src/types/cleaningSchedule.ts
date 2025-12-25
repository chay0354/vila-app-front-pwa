export type CleaningScheduleEntry = {
  id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  cleaner_name: string
  created_at?: string
}

