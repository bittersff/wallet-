// components/EthereumWalletEmptier.js
import { useState, useEffect } from 'react';
import styles from '../styles/WalletEmptier.module.css';
import { ethers } from 'ethers';

// ERC20 ABI (only the functions we need)
const ERC20_ABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  
  // Write functions
  "function transfer(address to, uint amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

export default function EthereumWalletEmptier() {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState({});
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gasPrice, setGasPrice] = useState('auto');

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAddress(address);
        setIsConnected(true);
        
        // Get ETH balance
        const ethBalance = await provider.getBalance(address);
        setEthBalance(ethers.utils.formatEther(ethBalance));
        
        // Get tokens (this would typically be from an API like Etherscan, Covalent, or Moralis)
        fetchTokens(address, provider);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet!");
    }
  };

  // Fetch tokens (simplified example - you'd want to use an API)
  const fetchTokens = async (address, provider) => {
    setIsLoading(true);
    try {
      // In a real app, you would call an API like Covalent, Moralis, or Etherscan
      // This is a placeholder for demonstration - you'd replace this with actual API calls
      const response = await fetch(`https://api.covalenthq.com/v1/1/address/${address}/balances_v2/?key=YOUR_API_KEY`);
      const data = await response.json();
      
      // Process and set tokens
      if (data && data.data && data.data.items) {
        const tokens = data.data.items
          .filter(item => item.contract_address !== null) // Filter out ETH
          .map(item => ({
            address: item.contract_address,
            symbol: item.contract_ticker_symbol,
            balance: item.balance,
            decimals: item.contract_decimals,
            usdValue: item.quote,
            logo: item.logo_url
          }));
        
        setTokens(tokens);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      // Fallback to some hardcoded tokens for demo purposes
      setTokens([
        // These would be replaced by actual tokens from the API
        { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", balance: "1000000000", decimals: 6, usdValue: 1 },
        { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", balance: "500000000", decimals: 6, usdValue: 0.5 }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle token selection
  const toggleToken = (tokenAddress) => {
    setSelectedTokens(prev => ({
      ...prev,
      [tokenAddress]: !prev[tokenAddress]
    }));
  };

  // Select all tokens
  const selectAllTokens = () => {
    const allSelected = {};
    tokens.forEach(token => {
      allSelected[token.address] = true;
    });
    setSelectedTokens(allSelected);
  };

  // Deselect all tokens
  const deselectAllTokens = () => {
    setSelectedTokens({});
  };

  // Validate Ethereum address
  const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Transfer ETH
  const transferETH = async () => {
    if (!isValidAddress(destinationAddress)) {
      alert("Please enter a valid destination address");
      return;
    }

    try {
      setTransferStatus(prev => ({ ...prev, ETH: 'pending' }));
      
      // Calculate gas cost (leaving some ETH for fees)
      const gasLimit = ethers.utils.parseUnits("21000", "wei");
      const currentGasPrice = gasPrice === 'auto' 
        ? await provider.getGasPrice() 
        : ethers.utils.parseUnits(gasPrice, "gwei");
      
      const gasCost = gasLimit.mul(currentGasPrice);
      
      // Calculate amount to send (balance - gas cost)
      const balance = ethers.utils.parseEther(ethBalance);
      const amountToSend = balance.sub(gasCost);
      
      // Send transaction
      const tx = await signer.sendTransaction({
        to: destinationAddress,
        value: amountToSend,
        gasLimit,
        gasPrice: currentGasPrice
      });
      
      await tx.wait();
      setTransferStatus(prev => ({ ...prev, ETH: 'success' }));
      
      // Update balance
      const newBalance = await provider.getBalance(address);
      setEthBalance(ethers.utils.formatEther(newBalance));
    } catch (error) {
      console.error("Error transferring ETH:", error);
      setTransferStatus(prev => ({ ...prev, ETH: 'error' }));
    }
  };

  // Transfer tokens
  const transferTokens = async () => {
    if (!isValidAddress(destinationAddress)) {
      alert("Please enter a valid destination address");
      return;
    }

    const selectedTokenAddresses = Object.keys(selectedTokens).filter(addr => selectedTokens[addr]);
    
    if (selectedTokenAddresses.length === 0) {
      alert("Please select at least one token to transfer");
      return;
    }

    // Transfer each selected token
    for (const tokenAddress of selectedTokenAddresses) {
      try {
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'pending' }));
        
        const token = tokens.find(t => t.address === tokenAddress);
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        
        // Get token balance
        const balance = await tokenContract.balanceOf(address);
        
        // Send tokens
        const tx = await tokenContract.transfer(destinationAddress, balance);
        await tx.wait();
        
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'success' }));
      } catch (error) {
        console.error(`Error transferring token ${tokenAddress}:`, error);
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'error' }));
      }
    }
  };

  // Transfer everything (ETH + tokens)
  const transferEverything = async () => {
    // First transfer tokens
    await transferTokens();
    
    // Then transfer ETH
    await transferETH();
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setEthBalance('0');
    setTokens([]);
    setSelectedTokens({});
    setTransferStatus({});
    setProvider(null);
    setSigner(null);
  };

  return (
    <div className={styles.container}>
      {!isConnected ? (
        <div className={styles.connectContainer}>
          <h2>Connect Your Ethereum Wallet</h2>
          <button 
            className={styles.connectButton}
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className={styles.walletContainer}>
          <div className={styles.walletInfo}>
            <p>Connected: <span className={styles.address}>{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</span></p>
            <button className={styles.disconnectButton} onClick={disconnectWallet}>Disconnect</button>
          </div>
          
          <div className={styles.balanceInfo}>
            <h3>ETH Balance: {parseFloat(ethBalance).toFixed(4)} ETH</h3>
            <h3>Tokens: {tokens.length}</h3>
          </div>
          
          <div className={styles.destinationContainer}>
            <h3>Destination Address</h3>
            <input
              type="text"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className={styles.addressInput}
            />
            <p className={styles.validationText}>
              {destinationAddress && !isValidAddress(destinationAddress) && "⚠️ Invalid Ethereum address"}
            </p>
          </div>
          
          <div className={styles.advancedToggle}>
            <button 
              className={styles.toggleButton} 
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>
          </div>
          
          {showAdvanced && (
            <div className={styles.advancedOptions}>
              <label htmlFor="gasPrice">Gas Price (gwei):</label>
              <input
                id="gasPrice"
                type="text"
                placeholder="auto"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className={styles.gasInput}
              />
              <p className={styles.helpText}>Leave as "auto" for recommended gas price</p>
            </div>
          )}
          
          <div className={styles.tokenList}>
            <div className={styles.tokenControls}>
              <h3>Your Tokens</h3>
              <div>
                <button onClick={selectAllTokens} className={styles.selectButton}>Select All</button>
                <button onClick={deselectAllTokens} className={styles.selectButton}>Deselect All</button>
              </div>
            </div>
            
            {isLoading ? (
              <div className={styles.loading}>Loading tokens...</div>
            ) : tokens.length === 0 ? (
              <div className={styles.noTokens}>No tokens found in this wallet</div>
            ) : (
              <div className={styles.tokens}>
                {tokens.map((token) => (
                  <div key={token.address} className={styles.tokenItem}>
                    <div className={styles.tokenCheckbox}>
                      <input
                        type="checkbox"
                        id={token.address}
                        checked={selectedTokens[token.address] || false}
                        onChange={() => toggleToken(token.address)}
                      />
                    </div>
                    <div className={styles.tokenInfo}>
                      <div className={styles.tokenSymbol}>{token.symbol}</div>
                      <div className={styles.tokenBalance}>
                        {ethers.utils.formatUnits(token.balance, token.decimals)}
                      </div>
                    </div>
                    <div className={styles.tokenStatus}>
                      {transferStatus[token.address] === 'pending' && <span className={styles.pending}>Sending...</span>}
                      {transferStatus[token.address] === 'success' && <span className={styles.success}>Sent ✓</span>}
                      {transferStatus[token.address] === 'error' && <span className={styles.error}>Failed ✗</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.actionButtons}>
            <button
              className={styles.transferTokensButton}
              disabled={!isValidAddress(destinationAddress) || Object.keys(selectedTokens).filter(addr => selectedTokens[addr]).length === 0}
              onClick={transferTokens}
            >
              Transfer Selected Tokens
            </button>
            
            <button
              className={styles.transferEthButton}
              disabled={!isValidAddress(destinationAddress) || parseFloat(ethBalance) === 0}
              onClick={transferETH}
            >
              Transfer ETH
            </button>
            
            <button
              className={styles.transferAllButton}
              disabled={!isValidAddress(destinationAddress)}
              onClick={transferEverything}
            >
              Transfer Everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}