import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../apiConfig'
import './SignInScreen.css'

type SignInScreenProps = {
  mode?: 'signin' | 'signup'
  onSignIn: (username: string) => void
}

function SignInScreen({ mode = 'signin', onSignIn }: SignInScreenProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const url = `${API_BASE_URL}${endpoint}`
      console.log('Attempting auth:', { mode, url, username: name.trim() })

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name.trim(),
          password: password,
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
      onSignIn(data.username || name.trim())
      setName('')
      setPassword('')
      setConfirmPassword('')
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

