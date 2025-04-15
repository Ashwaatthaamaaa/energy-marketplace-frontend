"use client"
import "../styles/BalanceCard.css"

const BalanceCard = ({ balance, onWithdraw, isTransacting, account }) => {
  const hasBalance = Number(balance) > 0

  return (
    <div className="balance-card">
      <h2>Your Earnings</h2>
      <div className="balance-amount">{balance} ETH</div>
      <button
        className={`btn ${hasBalance ? "btn-primary" : "btn-disabled"} btn-block`}
        onClick={onWithdraw}
        disabled={!hasBalance || isTransacting || !account}
        title={!hasBalance ? "No earnings to withdraw" : "Click to withdraw your earnings"}
      >
        {!hasBalance ? "No Earnings to Withdraw" : "Withdraw Earnings"}
      </button>
    </div>
  )
}

export default BalanceCard
