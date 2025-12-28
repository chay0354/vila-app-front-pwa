import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import { registerPushSubscription } from '../utils/notifications'
import './SignInScreen.css'

type SignInScreenProps = {
  mode?: 'signin' | 'signup'
  onSignIn: (username: string, role?: string, imageUrl?: string) => void
}

function SignInScreen({ mode = 'signin', onSignIn }: SignInScreenProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'עובד תחזוקה' | 'עובד שעתי' | 'מנהל ראשי' | 'מנהל הזמנות' | 'מנהל מתחם'>('עובד תחזוקה')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('התמונה גדולה מדי. אנא בחר תמונה קטנה מ-5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('אנא בחר קובץ תמונה בלבד')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSign = async () => {
    if (!name.trim() || !password.trim()) {
      setError('אנא מלאו שם וסיסמה')
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      let imageUrl: string | undefined = undefined
      
      // If signup and image selected, convert to base64
      if (mode === 'signup' && imageFile) {
        const reader = new FileReader()
        imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
      }

      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const url = `${API_BASE_URL}${endpoint}`
      console.log('Attempting auth:', { mode, url, username: name.trim() })

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name.trim(),
          password: password,
          ...(mode === 'signup' && { role, image_url: imageUrl }),
        }),
      })

      console.log('Auth response status:', res.status, res.statusText)

      let data
      try {
        data = await res.json()
      } catch (jsonErr) {
        const text = await res.text()
        console.error('Failed to parse JSON response:', text)
        setError(`שגיאת שרת: ${res.status} ${res.statusText}`)
        setIsLoading(false)
        return
      }

      console.log('Auth response data:', data)

      if (!res.ok) {
        const errorMsg = data.detail || data.message || `שגיאה ${res.status}: ${res.statusText}`
        setError(errorMsg)
        setIsLoading(false)
        return
      }

      // Success - set user and navigate to hub
      const username = data.username || name.trim()
      onSignIn(
        username,
        data.role,
        data.image_url
      )
      setName('')
      setPassword('')
      setConfirmPassword('')
      setImagePreview(null)
      setImageFile(null)
      
      // Register push notification subscription
      registerPushSubscription(username, API_BASE_URL)
      
      navigate('/hub')
    } catch (err: any) {
      console.error('Auth error:', err)
      const errorMsg = err.message || 'אירעה שגיאה בחיבור לשרת. נסה שוב.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-scroll">
        <h1 className="signin-title">
          {mode === 'signin' ? 'כניסה' : 'הרשמה'}
        </h1>
        <p className="signin-subtitle">ניהול מתחם נופש – הזדהות מאובטחת</p>
        
        <div className="signin-card">
          <div className="signin-field">
            <label className="signin-label">שם משתמש</label>
            <input
              className="signin-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הקלד שם"
              dir="rtl"
            />
          </div>
          
          <div className="signin-field">
            <label className="signin-label">סיסמה</label>
            <input
              className="signin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              dir="rtl"
            />
          </div>
          
          {mode === 'signup' && (
            <>
              <div className="signin-field">
                <label className="signin-label">אישור סיסמה</label>
                <input
                  className="signin-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  dir="rtl"
                />
              </div>
              
              <div className="signin-field">
                <label className="signin-label">תפקיד</label>
                <select
                  className="signin-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'עובד תחזוקה' | 'עובד שעתי' | 'מנהל ראשי' | 'מנהל הזמנות' | 'מנהל מתחם')}
                  dir="rtl"
                >
                  <option value="עובד תחזוקה">עובד תחזוקה</option>
                  <option value="עובד שעתי">עובד שעתי</option>
                  <option value="מנהל ראשי">מנהל ראשי</option>
                  <option value="מנהל הזמנות">מנהל הזמנות</option>
                  <option value="מנהל מתחם">מנהל מתחם</option>
                </select>
              </div>
              
              <div className="signin-field">
                <label className="signin-label">תמונת פרופיל</label>
                <div className="signin-image-upload">
                  {imagePreview ? (
                    <div className="signin-image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="signin-image-remove"
                        onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="signin-image-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      + בחר תמונה
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </>
          )}
          
          {error && <p className="signin-error">{error}</p>}
          
          <button
            className="signin-primary-button"
            onClick={handleSign}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'מתחבר...' : mode === 'signin' ? 'כניסה' : 'הרשמה'}
          </button>
          
          <button
            className="signin-outline-button"
            onClick={() => navigate('/')}
            type="button"
          >
            חזרה למסך הבית
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignInScreen

