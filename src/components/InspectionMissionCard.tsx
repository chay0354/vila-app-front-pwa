import { useState } from 'react'
import { InspectionMission } from '../types/inspections'
import { computeInspectionStatus } from '../utils/inspectionUtils'
import { categorizeTasks, categorizeCleaningTasks } from '../utils/taskCategorization'
import './InspectionMissionCard.css'

type InspectionMissionCardProps = {
  mission: InspectionMission
  onToggleTask: (missionId: string, taskId: string) => void
  onSave: (missionId: string) => void
  isCleaningInspection?: boolean
}

function InspectionMissionCard({
  mission,
  onToggleTask,
  onSave,
  isCleaningInspection = false,
}: InspectionMissionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const completedTasks = mission.tasks.filter(t => t.completed).length
  const totalTasks = mission.tasks.length
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const getDisplayStatus = () => {
    return computeInspectionStatus(mission)
  }

  const getStatusColor = (statusText: string) => {
    if (statusText === 'הביקורת הושלמה') {
      return '#22c55e'
    }
    if (statusText === 'דורש ביקורת היום') {
      return '#f59e0b'
    }
    if (statusText === 'זמן הביקורת עבר') {
      return '#ef4444'
    }
    if (statusText === 'זמן הביקורות טרם הגיע') {
      return '#ef4444'
    }
    // fallback
    if (statusText) {
      return '#f59e0b'
    }
    return '#64748b'
  }

  const displayStatus = getDisplayStatus()
  const statusColor = getStatusColor(displayStatus)

  return (
    <div
      className={`inspection-mission-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="inspection-mission-header">
        <div className="inspection-mission-header-content">
          <h3 className="inspection-mission-card-title">{mission.unitNumber}</h3>
          <p className="inspection-mission-card-line">אורח: {mission.guestName}</p>
          <p className="inspection-mission-card-line">תאריך ביקורת: {mission.departureDate}</p>
          <div className="inspection-mission-status-row">
            <span className="inspection-mission-status-label">סטטוס:</span>
            <span
              className="inspection-mission-status-badge"
              style={{
                backgroundColor: statusColor + '22',
                borderColor: statusColor + '55',
                color: statusColor,
              }}
            >
              {displayStatus}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          <div className="inspection-mission-divider" />

          <div className="inspection-mission-progress-wrap">
            <div className="inspection-mission-progress-header">
              <span className="inspection-mission-progress-label">
                משימות: {completedTasks} / {totalTasks}
              </span>
              <span className="inspection-mission-progress-value">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="inspection-mission-progress-bar">
              <div
                className="inspection-mission-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="inspection-mission-tasks-list">
            {(isCleaningInspection ? categorizeCleaningTasks(mission.tasks) : categorizeTasks(mission.tasks))
              .filter(category => category.name !== 'מסדרון')
              .map(category => (
              <div key={category.name} className="inspection-mission-task-category">
                <h5 className="inspection-mission-task-category-title">{category.name}</h5>
                {category.tasks.map(task => (
                  <div
                    key={task.id}
                    className="inspection-mission-task-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTask(mission.id, task.id)
                    }}
                  >
                    <div
                      className={`inspection-mission-task-checkbox ${
                        task.completed ? 'completed' : ''
                      }`}
                    >
                      {task.completed && <span className="inspection-mission-task-checkmark">✓</span>}
                    </div>
                    <span
                      className={`inspection-mission-task-text ${
                        task.completed ? 'completed' : ''
                      }`}
                    >
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="inspection-mission-save-section">
            <button
              className="inspection-mission-save-button"
              onClick={(e) => {
                e.stopPropagation()
                onSave(mission.id)
              }}
            >
              ביקורת נקיון מאושרת
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default InspectionMissionCard

