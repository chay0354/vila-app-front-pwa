import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { ChatMessage } from '../types/chat'
import './ChatScreen.css'

type ChatScreenProps = {
  userName: string
}

function ChatScreen({ userName }: ChatScreenProps) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChatMessages()
    // Refresh messages every 5 seconds
    const interval = setInterval(loadChatMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const loadChatMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/messages`)
      if (!res.ok) {
        console.warn('Failed to load chat messages', res.status)
        setLoading(false)
        return
      }
      const data = await res.json()
      // Reverse to show oldest first (backend returns newest first)
      const reversedMessages = (data ?? []).reverse()
      setMessages(reversedMessages)
      setLoading(false)
    } catch (err) {
      console.warn('Error loading chat messages', err)
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !userName) return

    try {
      const url = `${API_BASE_URL}/api/chat/messages`
      console.log('Sending chat message:', { url, sender: userName, content: newMessage.trim() })

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          sender: userName,
          content: newMessage.trim(),
        }),
      })

      console.log('Chat message response:', res.status, res.statusText)

      if (!res.ok) {
        let errorMsg = `שגיאה ${res.status}`
        try {
          const errorData = await res.json()
          errorMsg = errorData.detail || errorData.message || errorMsg
        } catch {
          const errorText = await res.text()
          errorMsg = errorText || errorMsg
        }
        console.error('Failed to send chat message:', res.status, errorMsg)
        alert(`נכשל בשליחת ההודעה: ${errorMsg}`)
        return
      }

      const responseData = await res.json().catch(() => null)
      console.log('Chat message sent successfully:', responseData)
      setNewMessage('')
      await loadChatMessages()
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (err: any) {
      console.error('Error sending chat message:', err)
      const errorMsg = err.message || 'אירעה שגיאה בשליחת ההודעה'
      alert(errorMsg)
    }
  }

  const handleSend = () => {
    if (newMessage.trim()) {
      sendChatMessage()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'עכשיו'
      if (diffMins < 60) return `לפני ${diffMins} דקות`
      if (diffMins < 1440) return `לפני ${Math.floor(diffMins / 60)} שעות`

      const day = date.getDate()
      const month = date.getMonth() + 1
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return `${day}/${month} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return ''
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="chat-back-button" onClick={() => navigate('/hub')}>
          ← חזרה
        </button>
        <h1 className="chat-page-title">צ'אט פנימי</h1>
      </div>

      <div className="chat-messages-wrapper">
        <div className="chat-messages-list" ref={messagesContainerRef}>
          {loading ? (
            <div className="chat-empty-state">
              <p className="chat-empty-text">טוען...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty-state">
              <p className="chat-empty-text">אין הודעות עדיין</p>
              <p className="chat-empty-subtext">היה הראשון לכתוב!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender === userName
              return (
                <div
                  key={message.id}
                  className={`chat-message-container ${isOwnMessage ? 'chat-message-own' : ''}`}
                >
                  {!isOwnMessage && (
                    <p className="chat-message-sender">{message.sender}</p>
                  )}
                  <div
                    className={`chat-message-bubble ${
                      isOwnMessage ? 'chat-message-bubble-own' : 'chat-message-bubble-other'
                    }`}
                  >
                    <p
                      className={`chat-message-text ${
                        isOwnMessage ? 'chat-message-text-own' : 'chat-message-text-other'
                      }`}
                    >
                      {message.content}
                    </p>
                    <p
                      className={`chat-message-time ${
                        isOwnMessage ? 'chat-message-time-own' : 'chat-message-time-other'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="כתוב הודעה..."
            dir="rtl"
            rows={1}
            style={{
              resize: 'none',
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          <button
            className={`chat-send-button ${!newMessage.trim() ? 'disabled' : ''}`}
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatScreen

