// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';

// Use dynamic imports to reduce initial bundle size
const EthereumWalletEmptier = dynamic(() => import('../components/EthereumWalletEmptier'), {
  loading: () => <div>Loading Ethereum wallet interface...</div>,
  ssr: false // Disable server-side rendering for wallet components
});

const SolanaWalletEmptier = dynamic(() => import('../components/SolanaWalletEmptier'), {
  loading: () => <div>Loading Solana wallet interface...</div>,
  ssr: false
});

const BnbWalletEmptier = dynamic(() => import('../components/BnbWalletEmptier'), {
  loading: () => <div>Loading BNB Chain wallet interface...</div>,
  ssr: false
});

export default function Home() {
  const [activeNetwork, setActiveNetwork] = useState('ethereum');
  const [theme, setTheme] = useState('dark');

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Update theme class on body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = theme;
    }
  }, [theme]);

  // Get the right style class based on theme
  const getCardClassName = () => {
    return `${styles.card} ${theme === 'dark' ? styles.darkCard : ''}`;
  };

  const getNetworkButtonClassName = (network) => {
    const baseClass = `${styles.networkButton} ${activeNetwork === network ? styles.active : ''}`;
    return `${baseClass} ${theme === 'dark' && activeNetwork !== network ? styles.darkNetworkButton : ''}`;
  };

  const getThemeButtonClassName = () => {
    return `${styles.themeButton} ${theme === 'dark' ? styles.darkThemeButton : ''}`;
  };

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
          <button onClick={toggleTheme} className={getThemeButtonClassName()}>
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className={styles.networkSelector}>
          <button 
            onClick={() => setActiveNetwork('ethereum')}
            className={getNetworkButtonClassName('ethereum')}
          >
            Ethereum
          </button>
          <button 
            onClick={() => setActiveNetwork('bnb')}
            className={getNetworkButtonClassName('bnb')}
          >
            BNB Chain
          </button>
          <button 
            onClick={() => setActiveNetwork('solana')}
            className={getNetworkButtonClassName('solana')}
          >
            Solana
          </button>
        </div>

        <div className={getCardClassName()}>
          {activeNetwork === 'ethereum' && <EthereumWalletEmptier theme={theme} />}
          {activeNetwork === 'bnb' && <BnbWalletEmptier theme={theme} />}
          {activeNetwork === 'solana' && <SolanaWalletEmptier theme={theme} />}
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
