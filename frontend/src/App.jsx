import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [listings, setListings] = useState([]);
  const [balance, setBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);

  const contractAddress = "0xe37Ca6ad22662483Df7739C8240CD2AE3300cf2C"; // Replace with your deployed address
  const abi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "producer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "EnergyListed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "consumer",
          "type": "address"
        }
      ],
      "name": "EnergySold",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "balances",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "listingId",
          "type": "uint256"
        }
      ],
      "name": "buyEnergy",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        }
      ],
      "name": "listEnergy",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "listings",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "producer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "sold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextListingId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
   ];

  // Connect to MetaMask
  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts"
        });
        
        // Get the network
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111n) {
          try {
            // Try to switch to Sepolia
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
            });
          } catch (switchError) {
            alert("Please switch to the Sepolia testnet in MetaMask!");
            return;
          }
        }

        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
        const contractInstance = new ethers.Contract(contractAddress, abi, signer);
        setContract(contractInstance);

        // Setup listeners for account and network changes
        window.ethereum.on('accountsChanged', async (accounts) => {
          if (accounts.length > 0) {
            const newSigner = await provider.getSigner();
            const newAddress = await newSigner.getAddress();
            setAccount(newAddress);
            const newContractInstance = new ethers.Contract(contractAddress, abi, newSigner);
            setContract(newContractInstance);
          } else {
            setAccount(null);
            setContract(null);
          }
        });

        window.ethereum.on('chainChanged', (chainId) => {
          window.location.reload();
        });

      } else {
        alert("Please install MetaMask!");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Error connecting to wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing connection
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts"
          });
          if (accounts.length > 0) {
            // If there's an existing connection, connect wallet and fetch listings
            await connectWallet();
          } else {
            // Even if not connected, create a read-only contract to fetch listings
            const readOnlyContract = new ethers.Contract(contractAddress, abi, provider);
            setContract(readOnlyContract);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
  }, []);

  // List energy
  const listEnergy = async () => {
    setIsTransacting(true);
    try {
      const amount = prompt("Enter energy amount (kWh):");
      const price = prompt("Enter price (ETH):");
      const priceWei = ethers.parseEther(price);
      await contract.listEnergy(amount, priceWei);
      await fetchListings();
    } catch (error) {
      console.error("Error listing energy:", error);
      alert("Error listing energy: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  // Fetch available listings
  const fetchListings = async () => {
    if (!contract) return;
    try {
      console.log("Fetching listings...");
      const totalListings = await contract.nextListingId();
      const allListings = [];
      for (let i = 0; i < totalListings; i++) {
        const listing = await contract.listings(i);
        if (!listing.sold) {
          allListings.push({
            id: Number(listing.id),
            producer: listing.producer,
            amount: Number(listing.amount),
            price: ethers.formatEther(listing.price),
          });
        }
      }
      console.log("Found listings:", allListings.length);
      setListings(allListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  // Set up initial fetch and periodic updates
  useEffect(() => {
    if (contract) {
      // Initial fetch
      fetchListings();
      
      // Set up interval for periodic updates
      const intervalId = setInterval(fetchListings, 10000); // Fetch every 10 seconds
      
      // Listen for contract events
      const handleEnergyListed = (id, producer, amount, price) => {
        console.log("New energy listed, refreshing...");
        fetchListings();
      };
      
      const handleEnergySold = (id, consumer) => {
        console.log("Energy sold, refreshing...");
        fetchListings();
      };
      
      contract.on("EnergyListed", handleEnergyListed);
      contract.on("EnergySold", handleEnergySold);
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        if (contract.off) { // Check if contract has event listeners before removing
          contract.off("EnergyListed", handleEnergyListed);
          contract.off("EnergySold", handleEnergySold);
        }
      };
    }
  }, [contract]);

  // Update UI when listings change
  useEffect(() => {
    const updateUI = async () => {
      if (contract && account) {
        await fetchBalance();
      }
    };
    updateUI();
  }, [listings, contract, account]);

  // Buy energy
  const buyEnergy = async (listingId, price, producer) => {
    setIsTransacting(true);
    try {
      if (producer.toLowerCase() === account.toLowerCase()) {
        alert("You cannot buy your own energy listing!");
        return;
      }
      await contract.buyEnergy(listingId, { value: ethers.parseEther(price) });
      await fetchListings();
    } catch (error) {
      console.error("Error buying energy:", error);
      alert("Error buying energy: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (contract && account) {
      const bal = await contract.balances(account);
      setBalance(ethers.formatEther(bal));
    }
  };

  // Withdraw earnings
  const withdraw = async () => {
    setIsTransacting(true);
    try {
      await contract.withdraw();
      await fetchBalance();
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Error withdrawing: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  return (
    <div className="container" style={{ 
      padding: "40px 20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      width: "100%"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        marginBottom: "40px"
      }}>
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-name">EnergySwap</div>
            <div className="brand-subtitle">Decentralized Energy Trading Platform</div>
          </div>
        </div>
        
        <div className="header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <button 
            className={`button ${isLoading ? 'loading' : ''}`}
            onClick={connectWallet}
            disabled={isLoading}
            style={{
              backgroundColor: account ? "#4CAF50" : "#3b82f6",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "wait" : "pointer",
              fontWeight: "500",
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "Connecting..." : account ? "Connected" : "Connect Wallet"}
          </button>
          {account && (
            <p className="connected-pill" style={{ 
              color: "#4b5563",
              fontSize: "0.9rem",
              backgroundColor: "#f3f4f6",
              padding: "8px 16px",
              borderRadius: "20px",
              margin: 0
            }}>
              Connected: {`${account.substring(0, 6)}...${account.substring(38)}`}
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "30px"
      }}>
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2 style={{ 
              margin: 0,
              color: "#1f2937",
              fontSize: "1.5rem"
            }}>
              Available Listings ({listings.length})
            </h2>
            <button 
              className={`button ${isTransacting ? 'loading' : ''}`}
              onClick={listEnergy}
              disabled={isTransacting || !account}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                cursor: isTransacting || !account ? "not-allowed" : "pointer",
                fontWeight: "500",
                opacity: isTransacting || !account ? 0.7 : 1
              }}
            >
              {isTransacting ? "Processing..." : "List Energy"}
            </button>
          </div>

          {listings.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "white",
              borderRadius: "12px",
              color: "#6b7280",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <p>No energy listings available</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {listings.map((listing) => {
                const isProducer = listing.producer.toLowerCase() === account?.toLowerCase();
                return (
                  <li key={listing.id} className="listing-card" style={{ 
                    marginBottom: "16px",
                    padding: "24px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: isProducer ? '#f8fafc' : 'white',
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ 
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "20px",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: "1.1rem",
                          fontWeight: "500",
                          color: "#1f2937",
                          marginBottom: "8px"
                        }}>
                          {listing.amount} kWh
                        </div>
                        <div style={{ 
                          color: "#059669",
                          fontWeight: "500",
                          marginBottom: "8px"
                        }}>
                          {listing.price} ETH
                        </div>
                        <div style={{ 
                          color: "#6b7280",
                          fontSize: "0.9rem"
                        }}>
                          Producer: {isProducer ? 'You' : `${listing.producer.substring(0, 6)}...${listing.producer.substring(38)}`}
                        </div>
                      </div>
                      <button 
                        className={`button ${isTransacting ? 'loading' : ''}`}
                        onClick={() => buyEnergy(listing.id, listing.price, listing.producer)}
                        disabled={isTransacting || isProducer || !account}
                        style={{ 
                          backgroundColor: isProducer ? '#d1d5db' : '#3b82f6',
                          color: 'white',
                          padding: '12px 32px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isTransacting || isProducer || !account ? 'not-allowed' : 'pointer',
                          fontWeight: "500",
                          opacity: isTransacting ? 0.7 : 1,
                          alignSelf: "flex-start"
                        }}
                      >
                        {isTransacting ? "Processing..." : isProducer ? 'Your Listing' : 'Buy Now'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="balance-card" style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          height: "fit-content",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ 
            margin: "0 0 16px 0",
            color: "#1f2937",
            fontSize: "1.5rem"
          }}>
            Your Earnings
          </h2>
          <div className="balance-amount" style={{
            fontSize: "2rem",
            fontWeight: "600",
            color: "#059669",
            marginBottom: "20px"
          }}>
            {balance} ETH
          </div>
          <button 
            className={`button ${isTransacting ? 'loading' : ''}`}
            onClick={withdraw}
            disabled={Number(balance) === 0 || isTransacting || !account}
            style={{ 
              width: "100%",
              padding: "12px 24px",
              backgroundColor: Number(balance) === 0 ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: Number(balance) === 0 || isTransacting || !account ? 'not-allowed' : 'pointer',
              fontWeight: "500",
              opacity: isTransacting ? 0.7 : 1
            }}
            title={Number(balance) === 0 ? 'No earnings to withdraw' : 'Click to withdraw your earnings'}
          >
            {isTransacting ? "Processing..." : Number(balance) === 0 ? 'No Earnings to Withdraw' : 'Withdraw Earnings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;