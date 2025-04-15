"use client"
import "../styles/Header.css"

const Header = ({ account, connectWallet, isLoading }) => {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-logo">⚡</div>
        <div className="brand-text">
          <h1>EnergySwap</h1>
          <p>Decentralized Energy Trading Platform</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`btn ${account ? "btn-success" : "btn-primary"} ${isLoading ? "loading" : ""}`}
          onClick={connectWallet}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : account ? "Connected" : "Connect Wallet"}
        </button>

        {account && <div className="account-pill">{`${account.substring(0, 6)}...${account.substring(38)}`}</div>}
      </div>
    </header>
  )
}

export default Header
