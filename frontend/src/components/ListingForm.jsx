"use client"

import { useState } from "react"
import "../styles/ListingForm.css"

const ListingForm = ({ onSubmit, onCancel }) => {
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (!price || isNaN(price) || Number(price) <= 0) {
      newErrors.price = "Please enter a valid price"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(amount, price)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>List Energy for Sale</h2>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Energy Amount (kWh)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={errors.amount ? "input-error" : ""}
            />
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (ETH)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              step="0.0001"
              className={errors.price ? "input-error" : ""}
            />
            {errors.price && <div className="error-message">{errors.price}</div>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              List Energy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ListingForm
