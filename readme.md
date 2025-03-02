# Multi-Chain Wallet Emptier

A simple web application to easily transfer all your tokens from one wallet to another across multiple blockchains.

## Supported Networks

- Ethereum
- BNB Chain (Binance Smart Chain)
- Solana

## Features

- One-click wallet connection using various providers (MetaMask, Phantom, etc.)
- Automatic detection of tokens in your wallet
- Select individual tokens or transfer all at once
- Support for multiple blockchain networks
- Dark/Light mode
- Mobile responsive design
- Ready to deploy on Vercel

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- MetaMask extension for Ethereum/BNB Chain
- Phantom wallet for Solana

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/multi-chain-wallet-emptier.git
cd multi-chain-wallet-emptier
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create an `.env.local` file in the root directory and add your API keys:

```
NEXT_PUBLIC_COVALENT_API_KEY=your_covalent_api_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

The easiest way to deploy this application is to use Vercel:

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and sign up/login with your GitHub account.
3. Click "New Project" and import your repository.
4. Add your environment variables (API keys) in the Vercel dashboard.
5. Click "Deploy".

## Security Considerations

This application interacts directly with blockchain wallets and handles the transfer of digital assets. Here are some security considerations:

- The app never stores private keys or seed phrases.
- All transactions are signed locally in your wallet.
- Always verify transaction details in your wallet before confirming.
- Double-check destination addresses before transferring tokens.
- The app uses client-side code only, so your keys never leave your device.

## Customization

### Adding More Networks

To add support for additional blockchain networks, you'll need to:

1. Create a new component for the network (similar to `EthereumWalletEmptier.js`).
2. Add the network to the network selector in `pages/index.js`.
3. Install any required dependencies for interacting with the new blockchain.

### API Integration

The app currently uses placeholder code for fetching token balances. For production use, you should integrate with blockchain data APIs like:

- Covalent API
- Moralis API
- Etherscan/BscScan APIs
- Solana blockchain RPC methods

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [ethers.js](https://docs.ethers.io/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token](https://spl.solana.com/token)