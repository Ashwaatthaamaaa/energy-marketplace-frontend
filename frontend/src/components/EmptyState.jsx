import "../styles/EmptyState.css"

const EmptyState = ({ message }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">⚡</div>
      <p>{message}</p>
    </div>
  )
}

export default EmptyState
