"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import "./styles/App.css"
import Header from "./components/Header"
import ListingCard from "./components/ListingCard"
import BalanceCard from "./components/BalanceCard"
import ListingForm from "./components/ListingForm"
import EmptyState from "./components/EmptyState"
import { contractABI } from "./utils/contractData"
import LoadingOverlay from "./components/LoadingOverlay"

function App() {
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState(null)
  const [listings, setListings] = useState([])
  const [balance, setBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [isTransacting, setIsTransacting] = useState(false)
  const [showListingForm, setShowListingForm] = useState(false)

  const contractAddress = "0xe37Ca6ad22662483Df7739C8240CD2AE3300cf2C"

  // Connect to MetaMask
  const connectWallet = async () => {
    setIsLoading(true)
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        // Get the network
        const network = await provider.getNetwork()
        if (network.chainId !== 11155111n) {
          try {
            // Try to switch to Sepolia
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xaa36a7" }], // Sepolia chainId in hex
            })
          } catch (switchError) {
            alert("Please switch to the Sepolia testnet in MetaMask!")
            return
          }
        }

        const signer = await provider.getSigner()
        const userAddress = await signer.getAddress()
        setAccount(userAddress)
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer)
        setContract(contractInstance)

        // Setup listeners for account and network changes
        window.ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length > 0) {
            const newSigner = await provider.getSigner()
            const newAddress = await newSigner.getAddress()
            setAccount(newAddress)
            const newContractInstance = new ethers.Contract(contractAddress, contractABI, newSigner)
            setContract(newContractInstance)
          } else {
            setAccount(null)
            setContract(null)
          }
        })

        window.ethereum.on("chainChanged", (chainId) => {
          window.location.reload()
        })
      } else {
        alert("Please install MetaMask!")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      alert("Error connecting to wallet. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Check for existing connection
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          })
          if (accounts.length > 0) {
            // If there's an existing connection, connect wallet and fetch listings
            await connectWallet()
          } else {
            // Even if not connected, create a read-only contract to fetch listings
            const readOnlyContract = new ethers.Contract(contractAddress, contractABI, provider)
            setContract(readOnlyContract)
          }
        } catch (error) {
          console.error("Error checking connection:", error)
        }
      }
    }

    checkConnection()
  }, [])

  // List energy
  const listEnergy = async (amount, price) => {
    setIsTransacting(true)
    try {
      const priceWei = ethers.parseEther(price)
      await contract.listEnergy(amount, priceWei)
      await fetchListings()
      setShowListingForm(false)
    } catch (error) {
      console.error("Error listing energy:", error)
      alert("Error listing energy: " + error.message)
    } finally {
      setIsTransacting(false)
    }
  }

  // Fetch available listings
  const fetchListings = async () => {
    if (!contract) return
    try {
      console.log("Fetching listings...")
      const totalListings = await contract.nextListingId()
      const allListings = []
      for (let i = 0; i < totalListings; i++) {
        const listing = await contract.listings(i)
        if (!listing.sold) {
          allListings.push({
            id: Number(listing.id),
            producer: listing.producer,
            amount: Number(listing.amount),
            price: ethers.formatEther(listing.price),
          })
        }
      }
      console.log("Found listings:", allListings.length)
      setListings(allListings)
    } catch (error) {
      console.error("Error fetching listings:", error)
    }
  }

  // Set up initial fetch and periodic updates
  useEffect(() => {
    if (contract) {
      // Initial fetch
      fetchListings()

      // Set up interval for periodic updates
      const intervalId = setInterval(fetchListings, 10000) // Fetch every 10 seconds

      // Listen for contract events
      const handleEnergyListed = (id, producer, amount, price) => {
        console.log("New energy listed, refreshing...")
        fetchListings()
      }

      const handleEnergySold = (id, consumer) => {
        console.log("Energy sold, refreshing...")
        fetchListings()
      }

      contract.on("EnergyListed", handleEnergyListed)
      contract.on("EnergySold", handleEnergySold)

      // Cleanup function
      return () => {
        clearInterval(intervalId)
        if (contract.off) {
          // Check if contract has event listeners before removing
          contract.off("EnergyListed", handleEnergyListed)
          contract.off("EnergySold", handleEnergySold)
        }
      }
    }
  }, [contract])

  // Update UI when listings change
  useEffect(() => {
    const updateUI = async () => {
      if (contract && account) {
        await fetchBalance()
      }
    }
    updateUI()
  }, [listings, contract, account])

  // Buy energy
  const buyEnergy = async (listingId, price, producer) => {
    setIsTransacting(true)
    try {
      if (producer.toLowerCase() === account.toLowerCase()) {
        alert("You cannot buy your own energy listing!")
        return
      }
      await contract.buyEnergy(listingId, { value: ethers.parseEther(price) })
      await fetchListings()
    } catch (error) {
      console.error("Error buying energy:", error)
      alert("Error buying energy: " + error.message)
    } finally {
      setIsTransacting(false)
    }
  }

  // Fetch balance
  const fetchBalance = async () => {
    if (contract && account) {
      const bal = await contract.balances(account)
      setBalance(ethers.formatEther(bal))
    }
  }

  // Withdraw earnings
  const withdraw = async () => {
    setIsTransacting(true)
    try {
      await contract.withdraw()
      await fetchBalance()
    } catch (error) {
      console.error("Error withdrawing:", error)
      alert("Error withdrawing: " + error.message)
    } finally {
      setIsTransacting(false)
    }
  }

  return (
    <div className="app-container">
      {isTransacting && <LoadingOverlay message="Processing transaction..." />}

      <Header account={account} connectWallet={connectWallet} isLoading={isLoading} />

      <main className="main-content">
        <div className="listings-container">
          <div className="listings-header">
            <h2>Available Listings ({listings.length})</h2>
            <button className="btn btn-primary" onClick={() => setShowListingForm(true)} disabled={!account}>
              List Energy
            </button>
          </div>

          {listings.length === 0 ? (
            <EmptyState message="No energy listings available" />
          ) : (
            <div className="listings-grid">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  account={account}
                  onBuy={buyEnergy}
                  isTransacting={isTransacting}
                />
              ))}
            </div>
          )}
        </div>

        <div className="sidebar">
          <BalanceCard balance={balance} onWithdraw={withdraw} isTransacting={isTransacting} account={account} />
        </div>
      </main>

      {showListingForm && <ListingForm onSubmit={listEnergy} onCancel={() => setShowListingForm(false)} />}
    </div>
  )
}

export default App
