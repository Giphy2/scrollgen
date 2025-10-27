import { useState } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';
import { ethers } from 'ethers';

export default function TransferForm({ contract }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!contract || !recipient || !amount) return;

    try {
      setLoading(true);
      setTxStatus(null);

      if (!ethers.isAddress(recipient)) {
        setTxStatus({ type: 'error', message: 'Invalid recipient address' });
        return;
      }

      const parsedAmount = ethers.parseUnits(amount, 18);
      const tx = await contract.transfer(recipient, parsedAmount);

      setTxHash(tx.hash);
      setTxStatus({ type: 'pending', message: 'Transaction submitted, waiting for confirmation...' });

      await tx.wait();

      setTxStatus({ type: 'success', message: 'Transfer successful!' });
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMessage = error.reason || error.message || 'Transfer failed';
      setTxStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Transfer Tokens</h2>

      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            type="text"
            id="recipient"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (SGT)</label>
          <input
            type="number"
            id="amount"
            placeholder="0.0"
            step="0.000000000000000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading || !recipient || !amount}>
          {loading ? (
            <>
              <div className="loading"></div>
              <span style={{ marginLeft: '0.5rem' }}>Transferring...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span style={{ marginLeft: '0.5rem' }}>Send Tokens</span>
            </>
          )}
        </button>
      </form>

      {txStatus && (
        <div className={txStatus.type === 'error' ? 'error-message' : 'success-message'} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {txStatus.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
            <span>{txStatus.message}</span>
          </div>
          {txHash && (
            <a
              href={`https://sepolia.scrollscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: '0.5rem', display: 'inline-block', color: 'var(--accent)', textDecoration: 'underline' }}
            >
              View on Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}
