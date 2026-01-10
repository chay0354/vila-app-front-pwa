import './DownloadScreen.css'

function DownloadScreen() {
  const handleDownload = () => {
    // Direct download link to the APK file
    const link = document.createElement('a')
    link.href = '/app-release.apk'
    link.download = 'vila-app.apk'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="download-container">
      <div className="download-content">
        <div className="download-header">
          <h1 className="download-title">הורדת האפליקציה</h1>
          <p className="download-subtitle">הורד את האפליקציה הניידת למכשיר אנדרואיד</p>
        </div>

        <div className="download-card">
          <div className="download-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 className="download-app-name">Vila App</h2>
          <p className="download-app-version">גרסה: 1.0.0</p>
          <p className="download-app-size">גודל: ~58 MB</p>
          <p className="download-app-date" style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
            עודכן: {new Date().toLocaleDateString('he-IL')}
          </p>

          <button 
            className="download-button"
            onClick={handleDownload}
          >
            <span className="download-button-icon">⬇</span>
            <span>הורד עכשיו</span>
          </button>

          <div className="download-instructions">
            <h3 className="download-instructions-title">הוראות התקנה:</h3>
            <ol className="download-instructions-list">
              <li>לחץ על כפתור "הורד עכשיו" למעלה</li>
              <li>אם מופיעה אזהרה, לחץ על "המשך" או "Allow"</li>
              <li>לאחר ההורדה, פתח את קובץ ה-APK מהתיקייה "הורדות"</li>
              <li>אם מופיעה הודעה "התקנה ממקורות לא ידועים", עבור להגדרות והפעל "התקן ממקורות לא ידועים"</li>
              <li>לחץ על "התקן" והמתן לסיום ההתקנה</li>
              <li>פתח את האפליקציה מהמסך הראשי</li>
            </ol>
          </div>

          <div className="download-note">
            <p><strong>הערה:</strong> האפליקציה דורשת אנדרואיד 5.0 ומעלה</p>
          </div>
        </div>

        <div className="download-card" style={{ marginTop: '2rem' }}>
          <div className="download-icon">
            <span style={{ fontSize: '48px' }}>🌐</span>
          </div>
          
          <h2 className="download-app-name">אפליקציית ווב</h2>
          <p className="download-app-version">גרסה: 1.0.0</p>
          <p className="download-subtitle">ניתן להשתמש באפליקציה גם כ-Web Application ישירות מהדפדפן, ולהוסיף אותה למסך הבית באייפון או באנדרואיד.</p>

          <a
            href="https://vila-app-front-pwa.vercel.app/orders"
            target="_blank"
            rel="noopener noreferrer"
            className="download-button"
            style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}
          >
            <span className="download-button-icon">🌐</span>
            <span>פתח אפליקציית ווב</span>
          </a>

          <div className="download-instructions">
            <h3 className="download-instructions-title">הוראות התקנה לאייפון:</h3>
            <ol className="download-instructions-list">
              <li>פתחו את דפדפן ספארי (Safari) במכשיר האייפון שלכם.</li>
              <li>נווטו לכתובת: <a href="https://vila-app-front-pwa.vercel.app/orders" target="_blank" rel="noopener noreferrer">vila-app-front-pwa.vercel.app/orders</a></li>
              <li>לחצו על כפתור ה"שיתוף" (Share) בתחתית המסך (מרובע עם חץ למעלה).</li>
              <li>גללו למטה ובחרו באפשרות "הוסף למסך הבית" (Add to Home Screen).</li>
              <li>אשרו את השם ולחצו "הוסף" (Add).</li>
              <li>כעת האפליקציה תופיע על מסך הבית שלכם ותוכלו לפתוח אותה כמו כל אפליקציה אחרת.</li>
            </ol>

            <h3 className="download-instructions-title" style={{ marginTop: '1.5rem' }}>הוראות התקנה לאנדרואיד:</h3>
            <ol className="download-instructions-list">
              <li>פתחו את דפדפן Chrome במכשיר האנדרואיד שלכם.</li>
              <li>נווטו לכתובת: <a href="https://vila-app-front-pwa.vercel.app/orders" target="_blank" rel="noopener noreferrer">vila-app-front-pwa.vercel.app/orders</a></li>
              <li>לחצו על תפריט הדפדפן (שלוש נקודות בפינה הימנית העליונה).</li>
              <li>בחרו "הוסף למסך הבית" או "Add to Home screen".</li>
              <li>אשרו את השם ולחצו "הוסף" או "Add".</li>
              <li>כעת האפליקציה תופיע על מסך הבית שלכם ותוכלו לפתוח אותה כמו כל אפליקציה אחרת.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadScreen





