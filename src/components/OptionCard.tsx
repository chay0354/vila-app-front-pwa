import './OptionCard.css'

type OptionCardProps = {
  title: string
  icon: string
  accent: string
  details: string[]
  cta?: string
  onPress?: () => void
}

function OptionCard({ title, icon, accent, details, cta, onPress }: OptionCardProps) {
  return (
    <button
      className="option-card"
      onClick={onPress}
      disabled={!onPress}
      type="button"
      style={{
        borderColor: `${accent}55`,
        backgroundColor: 'rgba(255,255,255,0.9)',
      }}
    >
      <div
        className="option-icon-wrap"
        style={{ backgroundColor: `${accent}22` }}
      >
        <span className="option-icon">{icon}</span>
      </div>
      <h3 className="option-title">{title}</h3>
      <ul className="option-bullets">
        {details.map((line, index) => (
          <li key={index} className="option-bullet">
            • {line}
          </li>
        ))}
      </ul>
      {cta ? (
        <div
          className="option-cta"
          style={{ backgroundColor: `${accent}22` }}
        >
          <span className="option-cta-text" style={{ color: accent }}>
            {cta}
          </span>
        </div>
      ) : (
        <div className="option-status">
          <span className="option-status-text">בקרוב</span>
        </div>
      )}
    </button>
  )
}

export default OptionCard

