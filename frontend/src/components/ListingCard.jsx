"use client"
import "../styles/ListingCard.css"

const ListingCard = ({ listing, account, onBuy, isTransacting }) => {
  const isProducer = listing.producer.toLowerCase() === account?.toLowerCase()

  return (
    <div className={`listing-card ${isProducer ? "listing-card-own" : ""}`}>
      <div className="listing-card-content">
        <div className="listing-amount">{listing.amount} kWh</div>
        <div className="listing-price">{listing.price} ETH</div>
        <div className="listing-producer">
          {isProducer
            ? "Your listing"
            : `Producer: ${listing.producer.substring(0, 6)}...${listing.producer.substring(38)}`}
        </div>
      </div>

      <button
        className={`btn ${isProducer ? "btn-disabled" : "btn-primary"}`}
        onClick={() => onBuy(listing.id, listing.price, listing.producer)}
        disabled={isTransacting || isProducer || !account}
      >
        {isProducer ? "Your Listing" : "Buy Now"}
      </button>
    </div>
  )
}

export default ListingCard
