import './DownloadScreen.css'

function DownloadScreen() {
  return (
    <div className="download-container">
      <div className="download-content">
        <div className="download-card" style={{ marginTop: '2rem' }}>
          <div className="download-instructions">
            <h3 className="download-instructions-title">הוראות התקנה לאייפון:</h3>
            <ol className="download-instructions-list">
              <li>פתחו את דפדפן ספארי (Safari) במכשיר האייפון שלכם.</li>
              <li>נווטו לכתובת: vila-app-front-pwa.vercel.app/orders</li>
              <li>לחצו על כפתור ה"שיתוף" (Share) בתחתית המסך (מרובע עם חץ למעלה).</li>
              <li>גללו למטה ובחרו באפשרות "הוסף למסך הבית" (Add to Home Screen).</li>
              <li>אשרו את השם ולחצו "הוסף" (Add).</li>
              <li>כעת האפליקציה תופיע על מסך הבית שלכם ותוכלו לפתוח אותה כמו כל אפליקציה אחרת.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadScreen





