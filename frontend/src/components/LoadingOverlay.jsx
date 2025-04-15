import "../styles/LoadingOverlay.css"

const LoadingOverlay = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p>{message || "Loading..."}</p>
    </div>
  )
}

export default LoadingOverlay
