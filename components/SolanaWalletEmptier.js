// components/SolanaWalletEmptier.js
import { useState, useEffect } from 'react';
import styles from '../styles/WalletEmptier.module.css';
import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';

export default function SolanaWalletEmptier() {
  // State variables
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [transferStatus, setTransferStatus] = useState({});
  const [connection, setConnection] = useState(null);

  // Initialize connection
  useEffect(() => {
    const conn = new web3.Connection(
      web3.clusterApiUrl('mainnet-beta'),
      'confirmed'
    );
    setConnection(conn);
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      // Check if Phantom is installed
      const provider = window?.solana;
      
      if (!provider?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        alert('Please install Phantom wallet');
        return;
      }
      
      // Connect to wallet
      const response = await provider.connect();
      const pubKey = response.publicKey;
      
      setPublicKey(pubKey);
      setIsConnected(true);
      
      // Fetch SOL balance
      fetchSolBalance(pubKey);
      
      // Fetch tokens
      fetchTokens(pubKey);
    } catch (error) {
      console.error('Error connecting to Solana wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch SOL balance
  const fetchSolBalance = async (pubKey) => {
    try {
      const balance = await connection.getBalance(pubKey);
      setSolBalance(balance / web3.LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
    }
  };

  // Fetch SPL tokens
  const fetchTokens = async (pubKey) => {
    setIsLoading(true);
    try {
      // Get all token accounts owned by the user
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        pubKey,
        { programId: splToken.TOKEN_PROGRAM_ID }
      );
      
      // Process token data
      const tokenData = tokenAccounts.value.map(accountInfo => {
        const parsedAccountInfo = accountInfo.account.data.parsed.info;
        const tokenAddress = parsedAccountInfo.mint;
        const tokenAmount = parsedAccountInfo.tokenAmount;
        
        return {
          address: tokenAddress,
          account: accountInfo.pubkey,
          symbol: tokenAddress.toString().substring(0, 4), // We would ideally fetch symbols from a token list
          balance: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount
        };
      }).filter(token => parseFloat(token.uiAmount) > 0); // Only show tokens with balance
      
      setTokens(tokenData);
    } catch (error) {
      console.error('Error fetching token accounts:', error);
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

  // Validate Solana address
  const isValidAddress = (address) => {
    try {
      new web3.PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Transfer SOL
  const transferSOL = async () => {
    if (!isValidAddress(destinationAddress)) {
      alert('Please enter a valid Solana address');
      return;
    }

    try {
      setTransferStatus(prev => ({ ...prev, SOL: 'pending' }));
      
      // Create destination public key
      const toPublicKey = new web3.PublicKey(destinationAddress);
      
      // Calculate amount to send (leaving 0.01 SOL for fees)
      const reserveAmount = 0.01 * web3.LAMPORTS_PER_SOL;
      const currentBalance = solBalance * web3.LAMPORTS_PER_SOL;
      const transferAmount = Math.max(0, currentBalance - reserveAmount);
      
      if (transferAmount <= 0) {
        alert('Insufficient SOL balance for transfer');
        setTransferStatus(prev => ({ ...prev, SOL: 'error' }));
        return;
      }
      
      // Create transaction
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: toPublicKey,
          lamports: Math.floor(transferAmount),
        })
      );
      
      // Send transaction
      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature.signature);
      
      setTransferStatus(prev => ({ ...prev, SOL: 'success' }));
      
      // Update SOL balance
      fetchSolBalance(publicKey);
    } catch (error) {
      console.error('Error transferring SOL:', error);
      setTransferStatus(prev => ({ ...prev, SOL: 'error' }));
    }
  };

  // Transfer SPL tokens
  const transferTokens = async () => {
    if (!isValidAddress(destinationAddress)) {
      alert('Please enter a valid Solana address');
      return;
    }

    const selectedTokenAddresses = Object.keys(selectedTokens).filter(addr => selectedTokens[addr]);
    
    if (selectedTokenAddresses.length === 0) {
      alert('Please select at least one token to transfer');
      return;
    }

    // Create destination public key
    const toPublicKey = new web3.PublicKey(destinationAddress);

    // Transfer each selected token
    for (const tokenAddress of selectedTokenAddresses) {
      try {
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'pending' }));
        
        const token = tokens.find(t => t.address === tokenAddress);
        
        // Check if the destination has an account for this token
        let destinationAccount;
        try {
          const tokenMint = new web3.PublicKey(token.address);
          destinationAccount = await splToken.getAssociatedTokenAddress(
            tokenMint,
            toPublicKey
          );
          
          // Check if account exists
          const accountInfo = await connection.getAccountInfo(destinationAccount);
          
          // If account doesn't exist, create it
          if (!accountInfo) {
            const transaction = new web3.Transaction().add(
              splToken.createAssociatedTokenAccountInstruction(
                publicKey,
                destinationAccount,
                toPublicKey,
                tokenMint
              )
            );
            
            const signature = await window.solana.signAndSendTransaction(transaction);
            await connection.confirmTransaction(signature.signature);
          }
        } catch (error) {
          console.error('Error setting up destination account:', error);
          setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'error' }));
          continue;
        }
        
        // Create transaction to transfer tokens
        const sourceAccount = new web3.PublicKey(token.account);
        
        const transaction = new web3.Transaction().add(
          splToken.createTransferInstruction(
            sourceAccount,
            destinationAccount,
            publicKey,
            BigInt(token.balance)
          )
        );
        
        // Send transaction
        const signature = await window.solana.signAndSendTransaction(transaction);
        await connection.confirmTransaction(signature.signature);
        
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'success' }));
      } catch (error) {
        console.error(`Error transferring token ${tokenAddress}:`, error);
        setTransferStatus(prev => ({ ...prev, [tokenAddress]: 'error' }));
      }
    }
  };

  // Transfer everything (SOL + tokens)
  const transferEverything = async () => {
    // First transfer tokens
    await transferTokens();
    
    // Then transfer SOL
    await transferSOL();
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setIsConnected(false);
    setPublicKey(null);
    setSolBalance(0);
    setTokens([]);
    setSelectedTokens({});
    setTransferStatus({});
  };

  return (
    <div className={styles.container}>
      {!isConnected ? (
        <div className={styles.connectContainer}>
          <h2>Connect Your Solana Wallet</h2>
          <button 
            className={styles.connectButton}
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Connect Phantom'}
          </button>
        </div>
      ) : (
        <div className={styles.walletContainer}>
          <div className={styles.walletInfo}>
            <p>Connected: <span className={styles.address}>{publicKey.toString().substring(0, 6)}...{publicKey.toString().substring(publicKey.toString().length - 4)}</span></p>
            <button className={styles.disconnectButton} onClick={disconnectWallet}>Disconnect</button>
          </div>
          
          <div className={styles.balanceInfo}>
            <h3>SOL Balance: {solBalance.toFixed(4)} SOL</h3>
            <h3>Tokens: {tokens.length}</h3>
          </div>
          
          <div className={styles.destinationContainer}>
            <h3>Destination Address</h3>
            <input
              type="text"
              placeholder="Solana address..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className={styles.addressInput}
            />
            <p className={styles.validationText}>
              {destinationAddress && !isValidAddress(destinationAddress) && "⚠️ Invalid Solana address"}
            </p>
          </div>
          
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
                      <div className={styles.tokenBalance}>{token.uiAmount}</div>
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
              disabled={!isValidAddress(destinationAddress) || solBalance <= 0.01}
              onClick={transferSOL}
            >
              Transfer SOL
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
