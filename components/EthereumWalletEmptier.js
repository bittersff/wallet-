// components/EthereumWalletEmptier.js
import { useState, useEffect } from 'react';
import styles from '../styles/WalletEmptier.module.css';

export default function EthereumWalletEmptier({ theme }) {
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

  // Apply theme classes
  const getInputClassName = () => {
    return `${styles.addressInput} ${theme === 'dark' ? styles.darkInput : ''}`;
  };

  const getAdvancedClassName = () => {
    return `${styles.advancedOptions} ${theme === 'dark' ? styles.darkAdvanced : ''}`;
  };

  const getTokensClassName = () => {
    return `${styles.tokens} ${theme === 'dark' ? styles.darkTokens : ''}`;
  };

  const getSelectButtonClassName = () => {
    return `${styles.selectButton} ${theme === 'dark' ? styles.darkSelectButton : ''}`;
  };

  const getTokenItemClassName = () => {
    return `${styles.tokenItem} ${theme === 'dark' ? styles.darkTokenItem : ''}`;
  };

  const getHelpTextClassName = () => {
    return `${styles.helpText} ${theme === 'dark' ? styles.darkHelpText : ''}`;
  };
  
  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const ethers = await import('ethers');
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
        
        // Get tokens - in a real app, this would call an API
        // Simulating tokens for demo purposes
        setTimeout(() => {
          setTokens([
            { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", balance: "1000000000", decimals: 6, usdValue: 1 },
            { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", balance: "500000000", decimals: 6, usdValue: 0.5 }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet. Please try again.");
        setIsLoading(false);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet!");
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

  // Transfer ETH - Simplified for demo
  const transferETH = async () => {
    if (!isValidAddress(destinationAddress)) {
      alert("Please enter a valid destination address");
      return;
    }

    try {
      setTransferStatus(prev => ({ ...prev, ETH: 'pending' }));
      
      // Simulate ETH transfer
      setTimeout(() => {
        setTransferStatus(prev => ({ ...prev, ETH: 'success' }));
        setEthBalance('0.01'); // Leave a small amount for gas
      }, 2000);
    } catch (error) {
      console.error("Error transferring ETH:", error);
      setTransferStatus(prev => ({ ...prev, ETH: 'error' }));
    }
  };

  // Transfer tokens - Simplified for demo
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
        
        // Simulate token transfer
        setTimeout(() => {
          setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'success' }));
        }, 1500);
      } catch (error) {
        console.error(`Error transferring token ${tokenAddress}:`, error);
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'error' }));
      }
    }
  };

  // Transfer everything (ETH + tokens)
  const transferEverything = async () => {
    // Simulate transferring everything
    transferTokens();
    setTimeout(() => transferETH(), 500);
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
              className={getInputClassName()}
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
            <div className={getAdvancedClassName()}>
              <label htmlFor="gasPrice">Gas Price (gwei):</label>
              <input
                id="gasPrice"
                type="text"
                placeholder="auto"
                value={gasPrice}
                onChange={(e) => setGasPrice(e.target.value)}
                className={styles.gasInput}
              />
              <p className={getHelpTextClassName()}>Leave as "auto" for recommended gas price</p>
            </div>
          )}
          
          <div className={styles.tokenList}>
            <div className={styles.tokenControls}>
              <h3>Your Tokens</h3>
              <div>
                <button onClick={selectAllTokens} className={getSelectButtonClassName()}>Select All</button>
                <button onClick={deselectAllTokens} className={getSelectButtonClassName()}>Deselect All</button>
              </div>
            </div>
            
            {isLoading ? (
              <div className={styles.loading}>Loading tokens...</div>
            ) : tokens.length === 0 ? (
              <div className={styles.noTokens}>No tokens found in this wallet</div>
            ) : (
              <div className={getTokensClassName()}>
                {tokens.map((token) => (
                  <div key={token.address} className={getTokenItemClassName()}>
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
                        {(parseInt(token.balance) / Math.pow(10, token.decimals)).toString()}
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
