import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [listings, setListings] = useState([]);
  const [balance, setBalance] = useState("0");

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
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
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
            connectWallet();
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
    const amount = prompt("Enter energy amount (kWh):");
    const price = prompt("Enter price (ETH):");
    const priceWei = ethers.parseEther(price);
    await contract.listEnergy(amount, priceWei);
    fetchListings();
  };

  // Fetch available listings
  const fetchListings = async () => {
    if (!contract) return;
    try {
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
      setListings(allListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  // Set up periodic fetching of listings and cleanup
  useEffect(() => {
    if (contract) {
      // Initial fetch
      fetchListings();
      
      // Set up interval for periodic updates
      const intervalId = setInterval(fetchListings, 10000); // Fetch every 10 seconds
      
      // Listen for contract events
      const handleEnergyListed = (id, producer, amount, price) => {
        fetchListings(); // Refresh listings when new energy is listed
      };
      
      const handleEnergySold = (id, consumer) => {
        fetchListings(); // Refresh listings when energy is sold
      };
      
      contract.on("EnergyListed", handleEnergyListed);
      contract.on("EnergySold", handleEnergySold);
      
      // Cleanup function
      return () => {
        clearInterval(intervalId);
        contract.off("EnergyListed", handleEnergyListed);
        contract.off("EnergySold", handleEnergySold);
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
    try {
      // Check if buyer is the producer
      if (producer.toLowerCase() === account.toLowerCase()) {
        alert("You cannot buy your own energy listing!");
        return;
      }
      await contract.buyEnergy(listingId, { value: ethers.parseEther(price) });
      fetchListings();
    } catch (error) {
      console.error("Error buying energy:", error);
      alert("Error buying energy: " + error.message);
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
    await contract.withdraw();
    fetchBalance();
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={connectWallet}>Connect Wallet</button>
      {account && <p>Connected: {account}</p>}
      <button onClick={listEnergy}>List Energy</button>
      <h2>Available Listings ({listings.length})</h2>
      {listings.length === 0 ? (
        <p>No energy listings available</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {listings.map((listing) => {
            const isProducer = listing.producer.toLowerCase() === account?.toLowerCase();
            return (
              <li key={listing.id} style={{ 
                marginBottom: "10px", 
                padding: "15px", 
                border: "1px solid #ccc", 
                borderRadius: "8px",
                backgroundColor: isProducer ? '#f5f5f5' : 'white' 
              }}>
                <div style={{ marginBottom: "5px" }}>Amount: {listing.amount} kWh</div>
                <div style={{ marginBottom: "5px" }}>Price: {listing.price} ETH</div>
                <div style={{ marginBottom: "5px" }}>
                  Producer: {isProducer ? 'You' : `${listing.producer.substring(0, 6)}...${listing.producer.substring(38)}`}
                </div>
                <button 
                  onClick={() => buyEnergy(listing.id, listing.price, listing.producer)}
                  disabled={isProducer}
                  style={{ 
                    marginTop: "5px",
                    padding: "8px 16px",
                    backgroundColor: isProducer ? '#cccccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isProducer ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProducer ? 'Your Listing' : 'Buy'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div style={{ marginTop: "20px" }}>
        <h2>Your Earnings: {balance} ETH</h2>
        <button 
          onClick={withdraw}
          disabled={Number(balance) === 0}
          style={{ 
            padding: "8px 16px",
            backgroundColor: Number(balance) === 0 ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: Number(balance) === 0 ? 'not-allowed' : 'pointer'
          }}
          title={Number(balance) === 0 ? 'No earnings to withdraw' : 'Click to withdraw your earnings'}
        >
          {Number(balance) === 0 ? 'No Earnings to Withdraw' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
}

export default App;