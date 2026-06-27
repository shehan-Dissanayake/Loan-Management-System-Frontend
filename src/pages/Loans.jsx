import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLoans, createLoan } from '../api/loans';
import { getCustomers } from '../api/customers';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadData = () => {
    setLoading(true);
    Promise.all([getLoans(), getCustomers()])
      .then(([loanData, customerData]) => {
        setLoans(loanData);
        setCustomers(customerData);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const customerName = (id) => customers.find((c) => c.id === id)?.shop_name || '—';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createLoan({ customer_id: customerId, principal_amount: Number(principal) })
      .then(() => { setCustomerId(''); setPrincipal(''); setShowForm(false); loadData(); })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  };

  const filtered = loans.filter((l) => filter === 'all' || l.status === filter);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Loans</h1>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          <i className="ti ti-plus" aria-hidden="true" />
          New loan
        </button>
      </div>

      {showForm && (
        <div className="card mb-2">
          <p className="card-title">Create loan</p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shop</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                  <option value="">Select shop</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.shop_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Principal (Rs)</label>
                <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="10000" required />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: '1rem' }}>
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
          {['all', 'active', 'overdue', 'completed', 'deactivated'].map((f) => (
            <button
              key={f}
              className={`tab-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
              style={{ fontSize: 12, padding: '3px 10px' }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No loans in this category.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Principal</th>
                <th>Total payable</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link to={`/loans/${l.id}`} style={{ fontWeight: 500 }}>{customerName(l.customer_id)}</Link>
                  </td>
                  <td>Rs {Number(l.principal_amount).toLocaleString()}</td>
                  <td>Rs {Number(l.total_payable).toLocaleString()}</td>
                  <td className="text-muted">{l.due_date}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}