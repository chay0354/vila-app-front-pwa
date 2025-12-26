import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { initializeNotifications, showNotification } from './utils/notifications'
import { API_BASE_URL } from './apiConfig'
import HomeScreen from './screens/HomeScreen'
import SignInScreen from './screens/SignInScreen'
import HubScreen from './screens/HubScreen'
import OrdersScreen from './screens/OrdersScreen'
import OrderEditScreen from './screens/OrderEditScreen'
import ExitInspectionsScreen from './screens/ExitInspectionsScreen'
import CleaningInspectionsScreen from './screens/CleaningInspectionsScreen'
import MonthlyInspectionsScreen from './screens/MonthlyInspectionsScreen'
import MaintenanceScreen from './screens/MaintenanceScreen'
import MaintenanceTasksScreen from './screens/MaintenanceTasksScreen'
import MaintenanceTaskDetailScreen from './screens/MaintenanceTaskDetailScreen'
import NewMaintenanceTaskScreen from './screens/NewMaintenanceTaskScreen'
import WarehouseMenuScreen from './screens/WarehouseMenuScreen'
import WarehouseScreen from './screens/WarehouseScreen'
import WarehouseInventoryScreen from './screens/WarehouseInventoryScreen'
import WarehouseInventoryDetailScreen from './screens/WarehouseInventoryDetailScreen'
import NewWarehouseScreen from './screens/NewWarehouseScreen'
import NewWarehouseItemScreen from './screens/NewWarehouseItemScreen'
import NewWarehouseOrderScreen from './screens/NewWarehouseOrderScreen'
import ReportsScreen from './screens/ReportsScreen'
import InvoicesScreen from './screens/InvoicesScreen'
import ChatScreen from './screens/ChatScreen'
import AttendanceScreen from './screens/AttendanceScreen'
import CleaningScheduleScreen from './screens/CleaningScheduleScreen'
import './App.css'

// Component to handle notifications polling
function NotificationPoller({ userName }: { userName: string | null }) {
  const location = useLocation()
  const previousMaintenanceTasks = useRef<any[]>([])
  const previousChatMessages = useRef<Array<{ id: number; sender: string; content: string; created_at: string }>>([])
  const systemUsers = useRef<Array<{ id: string; username: string }>>([])

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications()
  }, [])

  // Load system users once
  useEffect(() => {
    if (!userName) return
    const loadSystemUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`)
        if (!res.ok) return
        const data = await res.json()
        systemUsers.current = Array.isArray(data) ? data : []
      } catch (err) {
        console.warn('Error loading system users', err)
      }
    }
    loadSystemUsers()
  }, [userName])

  // Poll for new messages and assignments when user is logged in (but not on chat screen - it has its own polling)
  useEffect(() => {
    if (!userName || location.pathname === '/chat') return

    const loadMaintenanceTasksReport = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/maintenance/tasks`)
        if (!res.ok) return
        const data = await res.json()
        const tasks = data || []

        // Check for new assignments to current user
        if (userName && previousMaintenanceTasks.current.length > 0) {
          const previousTasksMap = new Map(previousMaintenanceTasks.current.map((t: any) => [t.id, t]))
          const currentUser = systemUsers.current.find(u => u.username === userName)
          const currentUserId = currentUser?.id?.toString()

          tasks.forEach((t: any) => {
            const prevTask = previousTasksMap.get(t.id)
            const currentAssignedTo = (t.assigned_to || t.assignedTo || '').toString().trim()
            const prevAssignedTo = prevTask ? ((prevTask.assigned_to || prevTask.assignedTo || '').toString().trim()) : ''

            // Check if this task was just assigned to the current user
            // Assignment happens when: wasn't assigned before OR was assigned to someone else, now assigned to me
            if (currentAssignedTo && currentAssignedTo !== prevAssignedTo) {
              // Check if assigned to current user (by username or user ID)
              const isAssignedToMe =
                currentAssignedTo === userName ||
                (currentUserId && currentAssignedTo === currentUserId)

              if (isAssignedToMe) {
                showNotification(
                  'משימה חדשה הוקצתה לך',
                  `משימת תחזוקה חדשה: ${t.title || 'ללא כותרת'}`
                )
              }
            }
          })
        }

        previousMaintenanceTasks.current = tasks
      } catch (err) {
        console.error('Error loading maintenance tasks for reports:', err)
      }
    }

    const loadChatMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/messages`)
        if (!res.ok) {
          console.warn('Failed to load chat messages', res.status)
          return
        }
        const data = await res.json()
        // Reverse to show oldest first (backend returns newest first)
        const messages = (data ?? []).reverse()

        // Check for new messages (not from current user)
        if (userName && previousChatMessages.current.length > 0) {
          const previousMessageIds = new Set(previousChatMessages.current.map((m: any) => m.id))
          const newMessages = messages.filter(
            (m: any) => !previousMessageIds.has(m.id) && m.sender !== userName
          )

          if (newMessages.length > 0) {
            const latestMessage = newMessages[newMessages.length - 1]
            showNotification(
              `הודעה חדשה מ-${latestMessage.sender}`,
              latestMessage.content.length > 50
                ? latestMessage.content.substring(0, 50) + '...'
                : latestMessage.content
            )
          }
        }

        previousChatMessages.current = messages
      } catch (err) {
        console.warn('Error loading chat messages', err)
      }
    }

    // Load maintenance tasks and chat messages periodically
    const pollInterval = setInterval(() => {
      loadMaintenanceTasksReport()
      loadChatMessages()
    }, 10000) // Check every 10 seconds

    // Initial load
    loadMaintenanceTasksReport()
    loadChatMessages()

    return () => clearInterval(pollInterval)
  }, [userName, location.pathname])

  return null
}

function App() {
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

  // Clear localStorage on mount to require authentication every time
  // User must sign in/up each session
  useEffect(() => {
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userImageUrl')
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (userName) {
      localStorage.setItem('userName', userName)
    } else {
      localStorage.removeItem('userName')
    }
    if (userRole) {
      localStorage.setItem('userRole', userRole)
    } else {
      localStorage.removeItem('userRole')
    }
    if (userImageUrl) {
      localStorage.setItem('userImageUrl', userImageUrl)
    } else {
      localStorage.removeItem('userImageUrl')
    }
  }, [userName, userRole, userImageUrl])

  const handleSignIn = (username: string, role?: string, imageUrl?: string) => {
    setUserName(username)
    setUserRole(role || null)
    setUserImageUrl(imageUrl || null)
  }

  return (
    <BrowserRouter>
      <NotificationPoller userName={userName} />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route 
          path="/signin" 
          element={
            userName ? (
              <Navigate to="/hub" replace />
            ) : (
              <SignInScreen onSignIn={handleSignIn} />
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            userName ? (
              <Navigate to="/hub" replace />
            ) : (
              <SignInScreen mode="signup" onSignIn={handleSignIn} />
            )
          } 
        />
        <Route 
          path="/hub" 
          element={
            userName ? (
              <HubScreen userName={userName} userRole={userRole} userImageUrl={userImageUrl} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/orders" 
          element={
            userName ? (
              <OrdersScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/orders/:id" 
          element={
            userName ? (
              <OrderEditScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/exit-inspections" 
          element={
            userName ? (
              <ExitInspectionsScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/cleaning-inspections" 
          element={
            userName ? (
              <CleaningInspectionsScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/monthly-inspections" 
          element={
            userName ? (
              <MonthlyInspectionsScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/maintenance" 
          element={
            userName ? (
              <MaintenanceScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/maintenance/:unitId/tasks" 
          element={
            userName ? (
              <MaintenanceTasksScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/maintenance/:unitId/tasks/:taskId" 
          element={
            userName ? (
              <MaintenanceTaskDetailScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/maintenance/:unitId/new-task" 
          element={
            userName ? (
              <NewMaintenanceTaskScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse" 
          element={
            userName ? (
              <WarehouseMenuScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/orders" 
          element={
            userName ? (
              <WarehouseScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/orders/new" 
          element={
            userName ? (
              <NewWarehouseOrderScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/inventory" 
          element={
            userName ? (
              <WarehouseInventoryScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/inventory/new" 
          element={
            userName ? (
              <NewWarehouseScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/inventory/:warehouseId" 
          element={
            userName ? (
              <WarehouseInventoryDetailScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/warehouse/inventory/:warehouseId/new-item" 
          element={
            userName ? (
              <NewWarehouseItemScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/reports" 
          element={
            userName ? (
              <ReportsScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/invoices" 
          element={
            userName ? (
              <InvoicesScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/chat" 
          element={
            userName ? (
              <ChatScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/attendance" 
          element={
            userName ? (
              <AttendanceScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
        <Route 
          path="/cleaning-schedule" 
          element={
            userName ? (
              <CleaningScheduleScreen userName={userName} />
            ) : (
              <Navigate to="/signin" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

