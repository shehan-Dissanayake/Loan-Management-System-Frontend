import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = () => {
    setLoading(true);
    getCustomers().then((data) => { setCustomers(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { loadCustomers(); }, []);

  const resetForm = () => {
    setShopName('');
    setPhone('');
    setEditingCustomer(null);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const payload = { shop_name: shopName, phone };
    const request = editingCustomer
      ? updateCustomer(editingCustomer.id, payload)
      : createCustomer(payload);

    request
      .then(() => {
        resetForm();
        setShowForm(false);
        loadCustomers();
      })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  };

  const handleEdit = (customer) => {
    setShopName(customer.shop_name);
    setPhone(customer.phone);
    setEditingCustomer(customer);
    setError('');
    setShowForm(true);
  };

  const handleDelete = (customerId) => {
    if (!window.confirm('Delete this customer?')) {
      return;
    }

    setError('');
    deleteCustomer(customerId)
      .then(() => loadCustomers())
      .catch((err) => setError(err.response?.data?.detail || err.message));
  };

  const filtered = customers.filter((c) =>
    c.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>Customers</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm((s) => !s);
          }}
        >
          <i className="ti ti-plus" aria-hidden="true" />
          Add customer
        </button>
      </div>

      {showForm && (
        <div className="card mb-2">
          <p className="card-title">{editingCustomer ? 'Edit customer' : 'New customer'}</p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shop name *</label>
                <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Wadduwa Hardware" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXX XXXX" required />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <i className="ti ti-search" aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)', fontSize: 16 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop name or phone..."
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No customers found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop name</th>
                <th>Phone</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.shop_name}</td>
                  <td className="text-muted">{c.phone}</td>
                  <td className="text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(c)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}