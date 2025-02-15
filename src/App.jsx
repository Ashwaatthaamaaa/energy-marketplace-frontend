import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from "ethers";
// Import the ABI JSON file (ensure it matches the ABI you provided)
import EnergyMarketplace from './artifacts/contracts/EnergyMarketplace.sol/EnergyMarketplace.json';

const contractAddress = "0x30c443c9aD5C8901384E9A6E5c7Ff888DF4C8f29";

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [energyBalance, setEnergyBalance] = useState(0);
  const [energyInput, setEnergyInput] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [isContractVerified, setIsContractVerified] = useState(false);

  console.log("Environment check:", {
    ethereum: typeof window.ethereum !== 'undefined',
    contractAddress,
    hasABI: !!EnergyMarketplace.abi,
    abiFirstFunction: EnergyMarketplace.abi?.[0]
  });

  console.log("Contract ABI:", EnergyMarketplace.abi);

  useEffect(() => {
    verifyContractABI();
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking connection:", err);
        }
      }
    };

    checkConnection();
    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => window.location.reload());
      }
    };
  }, []);

  const handleAccountsChanged = async (newAccounts) => {
    console.log("Accounts changed:", newAccounts);
    if (newAccounts.length > 0) {
      setAccount(newAccounts[0]);
      if (contract && isContractVerified) {
        await updateBalance(contract, newAccounts[0]);
      }
    } else {
      setAccount('');
      setEnergyBalance(0);
    }
  };

  async function init() {
    if (!window.ethereum) {
      console.error("MetaMask is not installed");
      alert("Please install MetaMask to use this app.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAccount = accounts[0];

      console.log("Setup parameters:", {
        contractAddress,
        hasABI: !!EnergyMarketplace.abi,
        signer: await signer.getAddress(),
        network: await provider.getNetwork()
      });

      if (!contractAddress || !EnergyMarketplace.abi) {
        throw new Error("Missing contract address or ABI");
      }

      let contractInstance;
      try {
        contractInstance = new Contract(
          contractAddress,
          EnergyMarketplace.abi,
          signer
        );
      } catch (contractError) {
        console.error("Contract creation error:", contractError);
        throw new Error(`Failed to create contract: ${contractError.message}`);
      }

      if (!contractInstance) {
        throw new Error("Contract instance is null");
      }

      console.log("Contract instance created:", {
        address: contractInstance.address,
        target: contractInstance.target,
        interface: contractInstance.interface.format(),
        keys: Object.keys(contractInstance)
      });

      setAccount(currentAccount);
      setContract(contractInstance);
      await updateBalance(contractInstance, currentAccount);

    } catch (err) {
      console.error("Error in init:", err);
      console.error("Error details:", err.stack);
      alert(`Failed to initialize: ${err.message}`);
    }
  }

  const updateBalance = async (contractInstance, user) => {
    if (!contractInstance) {
      console.error("Contract instance is not available to update balance.");
      return;
    }
    try {
      // Call the energyBalance function which expects an address argument
      const balance = await contractInstance.energyBalance(user);
      console.log("Raw balance:", balance);
      const balanceNumber = 
        typeof balance?.toNumber === 'function'
          ? balance.toNumber()
          : Number(balance?.toString() || 0);
      setEnergyBalance(balanceNumber);
    } catch (err) {
      console.error("Error fetching balance:", err);
      console.log("Contract instance:", contractInstance);
      console.log("User address:", user);
    }
  };

  // Handler for producing energy
  const handleProduceEnergy = async () => {
    if (contract && energyInput) {
      try {
        console.log("Attempting to produce energy with amount:", energyInput);
        const parsedAmount = parseInt(energyInput);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          console.error("Invalid energy amount:", energyInput);
          alert("Please enter a valid positive energy amount.");
          return;
        }
        if (typeof contract.produceEnergy !== 'function') {
          throw new Error("produceEnergy function not available on contract instance");
        }
        const tx = await contract.produceEnergy(parsedAmount);
        console.log("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        console.log("Transaction confirmed!");
        await updateBalance(contract, account);
        setEnergyInput('');
      } catch (err) {
        console.error("Error producing energy:", err);
        alert(`Error producing energy: ${err.message}`);
      }
    } else {
      console.error("Contract is not initialized or energyInput is empty.");
      alert("Contract not initialized or energy amount is empty.");
    }
  };

  // Handler for buying energy
  const handleBuyEnergy = async () => {
    if (contract && energyInput && sellerAddress) {
      try {
        const parsedAmount = parseInt(energyInput);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          console.error("Invalid energy amount for buying:", energyInput);
          alert("Please enter a valid positive energy amount to buy.");
          return;
        }
        if (!sellerAddress) {
          console.error("Seller address is empty.");
          alert("Please enter a seller address.");
          return;
        }
        if (typeof contract.buyEnergy !== 'function') {
          throw new Error("buyEnergy function not available on contract instance");
        }
        const tx = await contract.buyEnergy(sellerAddress, parsedAmount);
        await tx.wait();
        await updateBalance(contract, account);
        setEnergyInput('');
        setSellerAddress('');
        alert("Energy bought successfully!");
      } catch (err) {
        console.error("Error buying energy:", err);
        alert(`Error buying energy: ${err.message}`);
      }
    } else {
      console.error("Contract, energy amount, or seller address is missing.");
      alert("Missing contract, energy amount, or seller address for buying.");
    }
  };

  const debugContract = async () => {
    try {
      console.log("Contract state:", {
        address: contract?.address,
        signer: await contract?.signer.getAddress(),
        provider: contract?.provider,
        keys: Object.keys(contract || {})
      });
    } catch (err) {
      console.error("Debug contract error:", err);
    }
  };

  const verifyContractABI = () => {
    try {
      if (!EnergyMarketplace.abi) {
        throw new Error("ABI is undefined");
      }
      console.log("Contract ABI verification:", {
        hasABI: true,
        abiLength: EnergyMarketplace.abi.length,
        functions: EnergyMarketplace.abi
          .filter(item => item.type === 'function')
          .map(item => ({
            name: item.name,
            inputs: item.inputs?.length || 0,
            outputs: item.outputs?.length || 0,
            stateMutability: item.stateMutability
          })),
        produceEnergyFunction: EnergyMarketplace.abi.find(item => item.name === 'produceEnergy')
      });
      setIsContractVerified(true);
    } catch (err) {
      console.error("ABI verification error:", err);
      setIsContractVerified(false);
    }
  };

  return (
    <div style={{ margin: "20px" }}>
      <h2>Energy Marketplace Dashboard</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
        <p><strong>Debug Info:</strong></p>
        <p>MetaMask Detected: {window.ethereum ? "Yes" : "No"}</p>
        <p>Connected Account: {account || "Not connected"}</p>
        <p>Contract Instance: {contract ? "Created & Verified" : "Not created"}</p>
        <p>Contract Address: {contractAddress}</p>
      </div>
      <p><strong>Connected Account:</strong> {account}</p>
      <p><strong>Your Energy Balance:</strong> {energyBalance} tokens</p>
      
      {/* Input for energy amount */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="number"
          placeholder="Enter energy amount"
          value={energyInput}
          onChange={(e) => setEnergyInput(e.target.value)}
        />
      </div>
      
      {/* Button for producing energy */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={handleProduceEnergy} 
          disabled={!contract || !isContractVerified || energyInput.trim() === ''}
        >
          Produce Energy
        </button>
      </div>
      
      {/* Inputs and button for buying energy */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Seller address"
          value={sellerAddress}
          onChange={(e) => setSellerAddress(e.target.value)}
        />
        <button onClick={handleBuyEnergy} disabled={!contract || !isContractVerified}>
          Buy Energy
        </button>
      </div>
      
      <div>
        <button onClick={debugContract} disabled={!contract}>Debug Contract</button>
      </div>
    </div>
  );
}

export default App;
