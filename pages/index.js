// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import EthereumWalletEmptier from '../components/EthereumWalletEmptier';
import SolanaWalletEmptier from '../components/SolanaWalletEmptier';
import BnbWalletEmptier from '../components/BnbWalletEmptier';

export default function Home() {
  const [activeNetwork, setActiveNetwork] = useState('ethereum');
  const [theme, setTheme] = useState('dark');

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Update body class when theme changes
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Multi-Chain Wallet Emptier</title>
        <meta name="description" content="Quickly transfer all tokens from one wallet to another" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Multi-Chain Wallet Emptier
        </h1>

        <p className={styles.description}>
          Quickly transfer all your tokens to a new wallet address
        </p>

        <div className={styles.themeToggle}>
          <button onClick={toggleTheme} className={styles.themeButton}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className={styles.networkSelector}>
          <button 
            onClick={() => setActiveNetwork('ethereum')}
            className={`${styles.networkButton} ${activeNetwork === 'ethereum' ? styles.active : ''}`}
          >
            Ethereum
          </button>
          <button 
            onClick={() => setActiveNetwork('bnb')}
            className={`${styles.networkButton} ${activeNetwork === 'bnb' ? styles.active : ''}`}
          >
            BNB Chain
          </button>
          <button 
            onClick={() => setActiveNetwork('solana')}
            className={`${styles.networkButton} ${activeNetwork === 'solana' ? styles.active : ''}`}
          >
            Solana
          </button>
        </div>

        <div className={styles.card}>
          {activeNetwork === 'ethereum' && <EthereumWalletEmptier />}
          {activeNetwork === 'bnb' && <BnbWalletEmptier />}
          {activeNetwork === 'solana' && <SolanaWalletEmptier />}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          Created for secure and easy wallet transfers. Use at your own risk.
        </p>
      </footer>
    </div>
  );
}