import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { getCustomers } from '../api/customers';
import {
  getOutstandingLoans, getOverdueLoans, getTodaysRoute,
  getDailyCollection, getCashFlow, getCustomerHistory,
} from '../api/reports';

const TABS = [
  { key: 'route', label: "Today's route", icon: 'ti-map-pin' },
  { key: 'daily', label: 'Daily collection', icon: 'ti-calendar' },
  { key: 'outstanding', label: 'Outstanding', icon: 'ti-clock' },
  { key: 'overdue', label: 'Overdue', icon: 'ti-alert-triangle' },
  { key: 'cashflow', label: 'Cash flow', icon: 'ti-chart-bar' },
  { key: 'history', label: 'Customer history', icon: 'ti-history' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('route');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyDate, setDailyDate] = useState('');
  const [cashStart, setCashStart] = useState('');
  const [cashEnd, setCashEnd] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => { getCustomers().then(setCustomers).catch(() => {}); }, []);

  const load = (tab) => {
    setData(null); setError(''); setLoading(true);
    const fetchers = {
      route: () => getTodaysRoute(),
      daily: () => getDailyCollection(dailyDate || undefined),
      outstanding: () => getOutstandingLoans(),
      overdue: () => getOverdueLoans(),
      cashflow: () => getCashFlow(cashStart || undefined, cashEnd || undefined),
      history: () => selectedCustomer ? getCustomerHistory(selectedCustomer) : Promise.reject(new Error('Select a customer first')),
    };
    fetchers[tab]()
      .then((r) => { setData(r); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.detail || err.message); setLoading(false); });
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const exportPdf = () => {
    if (!data) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rohana Credit Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Report type: ${TABS.find((tab) => tab.key === activeTab)?.label || activeTab}`, 14, 30);

    const lines = [];
    if (activeTab === 'route') {
      lines.push('Shop | Balance due | Installment | Days left | Visited');
      data.forEach((item) => {
        lines.push(`${item.shop_name} | Rs ${Number(item.balance_due).toLocaleString()} | Rs ${Number(item.installment_amount).toLocaleString()} | ${item.days_remaining < 0 ? `${Math.abs(item.days_remaining)}d overdue` : `${item.days_remaining}d`} | ${item.visited_today ? 'Yes' : 'No'}`);
      });
    } else if (activeTab === 'daily') {
      lines.push(`Date: ${data.date}`);
      lines.push(`Total collected: Rs ${Number(data.total_collected).toLocaleString()}`);
      lines.push('Shop | Amount collected');
      data.items.forEach((item) => {
        lines.push(`${item.shop_name} | Rs ${Number(item.amount_collected).toLocaleString()}`);
      });
    } else if (activeTab === 'outstanding' || activeTab === 'overdue') {
      lines.push('Shop | Total payable | Balance due | Due date | Days remaining');
      data.forEach((item) => {
        lines.push(`${item.shop_name} | Rs ${Number(item.total_payable).toLocaleString()} | Rs ${Number(item.balance_due).toLocaleString()} | ${item.due_date} | ${item.days_remaining < 0 ? `${Math.abs(item.days_remaining)}d overdue` : `${item.days_remaining}d`}`);
      });
    } else if (activeTab === 'cashflow') {
      lines.push(`Period: ${data.start_date} → ${data.end_date}`);
      lines.push(`Total disbursed: Rs ${Number(data.total_disbursed).toLocaleString()}`);
      lines.push(`Total collected: Rs ${Number(data.total_collected).toLocaleString()}`);
      lines.push(`Net: Rs ${Number(data.net).toLocaleString()}`);
    } else if (activeTab === 'history') {
      if (data.length === 0) {
        lines.push('No loan history available.');
      } else {
        data.forEach(({ loan, payments }) => {
          lines.push(`Loan ${loan.loan_number || loan.id}`);
          lines.push(`Principal: Rs ${Number(loan.principal_amount).toLocaleString()}, Total payable: Rs ${Number(loan.total_payable).toLocaleString()}, Disbursed: ${loan.disbursed_date}, Due: ${loan.due_date}, Status: ${loan.status}`);
          payments.forEach((payment) => {
            lines.push(`  ${payment.payment_date} | Rs ${Number(payment.amount_collected).toLocaleString()} | Balance after: Rs ${Number(payment.balance_after_payment).toLocaleString()}`);
          });
        });
      }
    }

    let y = 42;
    lines.forEach((line) => {
      if (y > 272) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 8;
    });

    const filename = `rohana-report-${activeTab}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: '1.25rem' }}>Reports</h1>

      <div className="report-actions" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="report-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setData(null); setError(''); }}
            >
              <i className={`ti ${tab.icon}`} aria-hidden="true" /> {tab.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={exportPdf} disabled={!data}>
          <i className="ti ti-file-text" aria-hidden="true" /> Export PDF
        </button>
      </div>

      {activeTab === 'daily' && (
        <div className="report-filters">
          <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-primary" onClick={() => load('daily')}>Load</button>
        </div>
      )}
      {activeTab === 'cashflow' && (
        <div className="report-filters">
          <input type="date" value={cashStart} onChange={(e) => setCashStart(e.target.value)} style={{ width: 'auto' }} />
          <span className="text-muted">to</span>
          <input type="date" value={cashEnd} onChange={(e) => setCashEnd(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-primary" onClick={() => load('cashflow')}>Load</button>
        </div>
      )}
      {activeTab === 'history' && (
        <div className="report-filters">
          <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Select a shop</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.shop_name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => load('history')}>Load</button>
        </div>
      )}

      {error && <p className="error-msg mb-2">{error}</p>}
      {loading && <p className="text-muted">Loading...</p>}

      {!loading && data && (
        <div className="card">
          {activeTab === 'route' && <RouteReport data={data} />}
          {activeTab === 'daily' && <DailyReport data={data} />}
          {(activeTab === 'outstanding' || activeTab === 'overdue') && <OutstandingReport data={data} />}
          {activeTab === 'cashflow' && <CashFlowReport data={data} />}
          {activeTab === 'history' && <HistoryReport data={data} />}
        </div>
      )}
    </>
  );
}

function RouteReport({ data }) {
  if (!data.length) return <p className="text-muted">No active loans to visit.</p>;
  return (
    <table className="data-table">
      <thead>
        <tr><th>Shop</th><th>Balance due</th><th>Installment</th><th>Days left</th><th>Visited</th></tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.loan_id}>
            <td style={{ fontWeight: 500 }}>{item.shop_name}</td>
            <td>Rs {Number(item.balance_due).toLocaleString()}</td>
            <td>Rs {Number(item.installment_amount).toLocaleString()}</td>
            <td className={item.days_remaining < 0 ? 'text-danger' : 'text-muted'}>
              {item.days_remaining < 0 ? `${Math.abs(item.days_remaining)}d overdue` : `${item.days_remaining}d`}
            </td>
            <td>{item.visited_today ? <span className="badge badge-active">✓ Yes</span> : <span className="badge badge-pending">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DailyReport({ data }) {
  if (!data.items.length) return <p className="text-muted">No payments on {data.date}.</p>;
  return (
    <>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div><p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Date</p><p style={{ fontWeight: 500 }}>{data.date}</p></div>
        <div><p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total collected</p><p style={{ fontWeight: 500 }}>Rs {Number(data.total_collected).toLocaleString()}</p></div>
        <div><p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Shops visited</p><p style={{ fontWeight: 500 }}>{data.items.length}</p></div>
      </div>
      <table className="data-table">
        <thead><tr><th>Shop</th><th>Amount collected</th></tr></thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.payment_id}>
              <td>{item.shop_name}</td>
              <td>Rs {Number(item.amount_collected).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function OutstandingReport({ data }) {
  if (!data.length) return <p className="text-muted">No loans in this category.</p>;
  return (
    <table className="data-table">
      <thead>
        <tr><th>Shop</th><th>Total payable</th><th>Balance due</th><th>Due date</th><th>Days remaining</th></tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.loan_id}>
            <td style={{ fontWeight: 500 }}>{item.shop_name}</td>
            <td>Rs {Number(item.total_payable).toLocaleString()}</td>
            <td>Rs {Number(item.balance_due).toLocaleString()}</td>
            <td className="text-muted">{item.due_date}</td>
            <td className={item.days_remaining < 0 ? 'text-danger' : 'text-muted'}>
              {item.days_remaining < 0 ? `${Math.abs(item.days_remaining)}d overdue` : `${item.days_remaining}d`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CashFlowReport({ data }) {
  return (
    <div className="cashflow-grid">
      {[
        { label: 'Period', value: `${data.start_date} → ${data.end_date}` },
        { label: 'Total disbursed', value: `Rs ${Number(data.total_disbursed).toLocaleString()}` },
        { label: 'Total collected', value: `Rs ${Number(data.total_collected).toLocaleString()}` },
        { label: 'Net', value: `Rs ${Number(data.net).toLocaleString()}`, color: Number(data.net) >= 0 ? 'var(--success-text)' : 'var(--danger-text)' },
      ].map((item) => (
        <div key={item.label} className="summary-card">
          <p className="s-label">{item.label}</p>
          <p className="s-value" style={{ fontSize: 15, color: item.color }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function HistoryReport({ data }) {
  if (!data.length) return <p className="text-muted">No loan history for this customer.</p>;
  return data.map(({ loan, payments }) => (
    <div key={loan.id} className="history-loan-block">
      <div className="history-loan-header">
        <span>Principal: Rs {Number(loan.principal_amount).toLocaleString()}</span>
        <span>Total payable: Rs {Number(loan.total_payable).toLocaleString()}</span>
        <span>Disbursed: {loan.disbursed_date}</span>
        <span>Due: {loan.due_date}</span>
        <span className={`badge badge-${loan.status}`}>{loan.status}</span>
      </div>
      {payments.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 12 }}>No payments yet.</p>
      ) : (
        <table className="data-table">
          <thead><tr><th>Date</th><th>Amount</th><th>Balance after</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.payment_date}</td>
                <td>Rs {Number(p.amount_collected).toLocaleString()}</td>
                <td className="text-muted">Rs {Number(p.balance_after_payment).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ));
}