import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLoanSummary, updateLoanStatus } from '../api/loans';
import { createPayment, getPaymentsForLoan, updatePayment, deletePayment } from '../api/payments';
import { getCustomer } from '../api/customers';
import { printBytes } from '../printer/bluetoothPrinter';
import { buildReceipt } from '../printer/escpos';

export default function LoanDetail() {
  const { loanId } = useParams();
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [shopName, setShopName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printStatus, setPrintStatus] = useState('');
  const [lastPayment, setLastPayment] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getLoanSummary(loanId), getPaymentsForLoan(loanId)])
      .then(([summaryData, paymentData]) => {
        setSummary(summaryData);
        setPayments(paymentData);
        setLoading(false);
        setEditingPaymentId(null);
        getCustomer(summaryData.customer_id).then((c) => setShopName(c.shop_name));
      })
      .catch((err) => { setError(err.response?.data?.detail || err.message); setLoading(false); });
  };

  const beginEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setEditingAmount(payment.amount_collected);
    setEditingDate(payment.payment_date);
    setError('');
  };

  const cancelEdit = () => {
    setEditingPaymentId(null);
    setEditingAmount('');
    setEditingDate('');
    setError('');
  };

  const handleSaveEdit = (paymentId) => {
    if (!editingAmount || Number(editingAmount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    setSavingEdit(true);
    setError('');
    updatePayment(loanId, paymentId, {
      amount_collected: Number(editingAmount),
      payment_date: editingDate || undefined,
    })
      .then(() => {
        cancelEdit();
        loadData();
      })
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setSavingEdit(false));
  };

  const handleDeletePayment = (paymentId) => {
    if (!window.confirm('Delete this payment? This will recalculate the loan balance.')) return;
    setDeletingPaymentId(paymentId);
    setError('');
    deletePayment(loanId, paymentId)
      .then(() => loadData())
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setDeletingPaymentId(null));
  };

  useEffect(() => { loadData(); }, [loanId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setError('');
    createPayment({ loan_id: loanId, amount_collected: amountNumber, payment_date: paymentDate || undefined })
      .then((payment) => {
        setLastPayment({ amount: amountNumber, balanceAfter: payment.balance_after_payment });
        setAmount('');
        setPaymentDate('');
        loadData();
      })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  };

  const handleDeactivate = () => {
    if (!window.confirm('Deactivate this loan? Further payments will be blocked.')) return;
    setError('');
    setDeactivating(true);
    updateLoanStatus(loanId, 'deactivated')
      .then(() => loadData())
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setDeactivating(false));
  };



  const handlePrint = async () => {
    const toPrint = lastPayment || (payments.length > 0 ? {
      amount: payments[payments.length - 1].amount_collected,
      balanceAfter: payments[payments.length - 1].balance_after_payment,
    } : null);

    if (!toPrint) { setPrintStatus('No payment to print.'); return; }

    setPrintStatus('Printing...');
    try {
      const now = new Date();
      const bytes = buildReceipt({
        shopName,
        loanNumber: summary.loan_number,
        openDate: summary.disbursed_date,
        closeDate: summary.due_date,
        principalAmount: Number(summary.principal_amount).toFixed(2),
        totalPayable: Number(summary.total_payable).toFixed(2),
        installmentAmount: Number(summary.installment_amount).toFixed(2),
        amountCollected: Number(toPrint.amount).toFixed(2),
        balanceAfter: Number(toPrint.balanceAfter).toFixed(2),
        arrearsCount: summary.arrears_count,
        arrearsAmount: Number(summary.arrears_amount).toFixed(2),
        printedAt: now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
      });
      await printBytes(bytes);
      setPrintStatus('Printed successfully.');
    } catch (err) {
      setPrintStatus(`Print failed: ${err.message}`);
    }
  };

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!summary) return <p className="text-muted">Loan not found.</p>;

  const balancePct = Math.min(100, Math.round((1 - Number(summary.balance_due) / Number(summary.total_payable)) * 100));

  const isActive = summary.status === 'active';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <Link to="/loans" className="text-muted" style={{ fontSize: 12 }}>← Back to loans</Link>
          <h1 style={{ fontSize: 20, fontWeight: 500, marginTop: 4 }}>{shopName}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`badge badge-${summary.status}`}>{summary.status}</span>
          {isActive && (
            <button className="btn btn-danger" onClick={handleDeactivate} disabled={deactivating}>
              <i className="ti ti-ban" aria-hidden="true" />
              {deactivating ? 'Deactivating...' : 'Deactivate loan'}
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid mb-2">
        <div className="summary-card">
          <p className="s-label">Total payable</p>
          <p className="s-value">Rs {Number(summary.total_payable).toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <p className="s-label">Balance due</p>
          <p className="s-value" style={{ color: Number(summary.balance_due) > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
            Rs {Number(summary.balance_due).toLocaleString()}
          </p>
        </div>
        <div className="summary-card">
          <p className="s-label">Daily installment</p>
          <p className="s-value">Rs {Number(summary.installment_amount).toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <p className="s-label">Due date</p>
          <p className="s-value" style={{ fontSize: 15 }}>{summary.due_date}</p>
        </div>
        <div className="summary-card">
          <p className="s-label">Arrears count</p>
          <p className="s-value" style={{ color: summary.arrears_count > 0 ? 'var(--warning-text)' : 'inherit' }}>
            {summary.arrears_count} days
          </p>
        </div>
        <div className="summary-card">
          <p className="s-label">Arrears amount</p>
          <p className="s-value" style={{ color: Number(summary.arrears_amount) > 0 ? 'var(--warning-text)' : 'inherit' }}>
            Rs {Number(summary.arrears_amount).toLocaleString()}
          </p>
        </div>
        
      </div>

      <div className="card mb-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Repayment progress</span>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{balancePct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-surface-2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${balancePct}%`, height: '100%', background: 'var(--rc-purple)', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      <div className="two-col mb-2">
        <div className="card">
          <p className="card-title">Record payment</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Amount collected (Rs)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="200" required disabled={!isActive} />
            </div>
            <div className="form-group">
              <label className="form-label">Date (leave blank for today)</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} disabled={!isActive} />
            </div>
            {error && <p className="error-msg mb-1">{error}</p>}
            {!isActive && <p className="text-muted" style={{ marginTop: 0 }}>Payments cannot be recorded for a deactivated loan.</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!isActive}>
              <i className="ti ti-check" aria-hidden="true" /> Record payment
            </button>
          </form>
        </div>

        <div className="card">
          <p className="card-title">Receipt printer</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="ti ti-printer" aria-hidden="true" /> Print last receipt
            </button>
            {printStatus && <p className="print-status">{printStatus}</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Payment history</p>
        {payments.length === 0 ? (
          <p className="text-muted">No payments recorded yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Amount</th><th>Balance after</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {editingPaymentId === p.id ? (
                      <input
                        type="date"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                      />
                    ) : (
                      p.payment_date
                    )}
                  </td>
                  <td>
                    {editingPaymentId === p.id ? (
                      <input
                        type="number"
                        value={editingAmount}
                        onChange={(e) => setEditingAmount(e.target.value)}
                        min="0"
                      />
                    ) : (
                      `Rs ${Number(p.amount_collected).toLocaleString()}`
                    )}
                  </td>
                  <td className="text-muted">Rs {Number(p.balance_after_payment).toLocaleString()}</td>
                  <td>
                    {editingPaymentId === p.id ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSaveEdit(p.id)}
                          disabled={savingEdit}
                        >
                          Save
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => beginEditPayment(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={deletingPaymentId === p.id}
                        >
                          Delete
                        </button>
                      </div>
                    )}
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