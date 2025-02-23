import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [listings, setListings] = useState([]);
  const [balance, setBalance] = useState("0");

  const contractAddress = "0x56173A993A995a9638e9D2E3783137575A651546"; // Replace with your deployed address
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
        const accounts =       await window.ethereum.request({
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

  // Check for Sepolia network
  useEffect(() => {
    if (window.ethereum && window.ethereum.networkVersion !== "11155111") {
      alert("Please switch to the Sepolia testnet in MetaMask!");
    }
  }, []);

  // List energy
  const listEnergy = async () => {
    const amount = prompt("Enter energy amount (kWh):");
    const price = prompt("Enter price (ETH):");
    const priceWei = ethers.utils.parseEther(price);
    await contract.listEnergy(amount, priceWei);
    fetchListings();
  };

  // Fetch available listings
  const fetchListings = async () => {
    if (!contract) return;
    const totalListings = await contract.nextListingId();
    const allListings = [];
    for (let i = 0; i < totalListings; i++) {
      const listing = await contract.listings(i);
      if (!listing.sold) {
        allListings.push({
          id: listing.id.toNumber(),
          producer: listing.producer,
          amount: listing.amount.toNumber(),
          price: ethers.utils.formatEther(listing.price),
        });
      }
    }
    setListings(allListings);
  };

  // Buy energy
  const buyEnergy = async (listingId, price) => {
    await contract.buyEnergy(listingId, { value: ethers.utils.parseEther(price) });
    fetchListings();
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (contract && account) {
      const bal = await contract.balances(account);
      setBalance(ethers.utils.formatEther(bal));
    }
  };

  // Withdraw earnings
  const withdraw = async () => {
    await contract.withdraw();
    fetchBalance();
  };

  // Update listings and balance when contract is set
  useEffect(() => {
    if (contract) {
      fetchListings();
      fetchBalance();
    }
  }, [contract]);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={connectWallet}>Connect Wallet</button>
      {account && <p>Connected: {account}</p>}
      <button onClick={listEnergy}>List Energy</button>
      <h2>Available Listings</h2>
      <ul>
        {listings.map((listing) => (
          <li key={listing.id}>
            {listing.amount} kWh for {listing.price} ETH
            <button onClick={() => buyEnergy(listing.id, listing.price)}>Buy</button>
          </li>
        ))}
      </ul>
      <h2>Your Earnings: {balance} ETH</h2>
      <button onClick={withdraw}>Withdraw</button>
    </div>
  );
}

export default App;