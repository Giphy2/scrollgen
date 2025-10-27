import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from 'frontend/src/components/Navbar.jsx';
import TokenInfo from 'frontend/src/components/TokenInfo.jsx';
import TransferForm from './components/TransferForm';
import Footer from './components/Footer';
import { CONTRACT_ADDRESS, TOKEN_ABI, SCROLL_SEPOLIA_CONFIG } from './config';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

      checkIfWalletIsConnected();
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount('');
      setContract(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const switchToScrollSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SCROLL_SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SCROLL_SEPOLIA_CONFIG],
          });
        } catch (addError) {
          throw new Error('Failed to add Scroll Sepolia network');
        }
      } else {
        throw switchError;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to use this app.');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError('Contract address not configured. Please deploy the contract and update the config.');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');

      await switchToScrollSepolia();

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_ABI, signer);
      setContract(tokenContract);

    } catch (error) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setContract(null);
  };

  return (
    <div className="app-container">
      <Navbar
        account={account}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        isConnecting={isConnecting}
      />

      <main className="main-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!account ? (
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>Welcome to ScrollGen</h1>
            <p style={styles.heroSubtitle}>
              A modular zkEVM-native protocol built on the Scroll network.
              Connect your wallet to get started.
            </p>
            <div style={styles.features}>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🎯</div>
                <h3 style={styles.featureTitle}>Phase 1: Token</h3>
                <p style={styles.featureText}>ERC-20 token with minting and burning capabilities</p>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🖼️</div>
                <h3 style={styles.featureTitle}>Phase 2: NFTs</h3>
                <p style={styles.featureText}>Dynamic NFT collection with staking mechanisms</p>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🏛️</div>
                <h3 style={styles.featureTitle}>Phase 3: DAO</h3>
                <p style={styles.featureText}>Decentralized governance and treasury management</p>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>💎</div>
                <h3 style={styles.featureTitle}>Phase 4: DeFi</h3>
                <p style={styles.featureText}>Liquidity pools, staking, and yield farming</p>
              </div>
            </div>
          </div>
        ) : contract ? (
          <>
            <TokenInfo contract={contract} account={account} />
            <TransferForm contract={contract} />
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading contract...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const styles = {
  hero: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '1rem',
    background: 'linear-gradient(90deg, var(--primary), var(--accent))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
    marginBottom: '3rem',
    maxWidth: '600px',
    margin: '0 auto 3rem',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  feature: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: 'var(--text)',
  },
  featureText: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
};

export default App;
