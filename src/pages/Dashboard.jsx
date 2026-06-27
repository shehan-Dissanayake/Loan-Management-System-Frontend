import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLoans } from '../api/loans';
import { getDailyCollection, getOutstandingLoans, getRiskSummary } from '../api/reports';

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [daily, setDaily] = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLoans(), getOutstandingLoans(), getDailyCollection()])
      .then(([loanData, outData, dailyData]) => {
        setLoans(loanData);
        setOutstanding(outData);
        setDaily(dailyData);
        // load risk summary
        getRiskSummary().then((r) => setRiskSummary(r)).catch(() => {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeLoans = loans.filter((l) => l.status === 'active').length;
  const overdueLoans = outstanding.filter((l) => l.days_remaining < 0).length;
  const totalOutstanding = outstanding.reduce((sum, l) => sum + Number(l.balance_due), 0);
  const todayTarget = outstanding.reduce((sum, l) => sum + Number(l.installment_amount), 0);
  const todayCollected = daily ? Number(daily.total_collected) : 0;

  const maxBalance = Math.max(...outstanding.map((l) => Number(l.balance_due)), 1);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <p className="text-muted">Loading dashboard...</p>;

  return (
    <>
      <div className="mb-3">
        <h1 style={{ fontSize: 20, fontWeight: 500 }}>{greet()}, Rohana</h1>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
          Here's what's happening today.
        </p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Active loans</p>
          <p className="kpi-value">{activeLoans}</p>
          <p className="kpi-sub">
            <i className="ti ti-cash" aria-hidden="true" />
            {outstanding.length} shops to visit
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Today's target</p>
          <p className="kpi-value">Rs {todayTarget.toLocaleString()}</p>
          <p className="kpi-sub">
            <i className="ti ti-circle-check" aria-hidden="true" />
            Rs {todayCollected.toLocaleString()} collected so far
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total outstanding</p>
          <p className="kpi-value">Rs {Math.round(totalOutstanding / 1000)}K</p>
          <p className="kpi-sub">
            <i className="ti ti-users" aria-hidden="true" />
            Across {outstanding.length} active loans
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Overdue loans</p>
            <p className="kpi-value" style={{ color: overdueLoans > 0 ? 'var(--danger-text)' : 'inherit' }}>
              {overdueLoans}
          </p>
          <p className={`kpi-sub ${overdueLoans > 0 ? 'kpi-down' : ''}`}>
            <i className={`ti ti-${overdueLoans > 0 ? 'alert-triangle' : 'circle-check'}`} aria-hidden="true" />
            {overdueLoans > 0 ? 'Needs attention' : 'All on track'}
          </p>
        </div>
      </div>

      {/* removed duplicate risk card - keeping single risk display lower in layout */}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div className="card">
          <p className="card-title">Outstanding balance by shop</p>
          {outstanding.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>No active loans.</p>
          ) : (
            <div className="bar-chart">
              {outstanding.slice(0, 7).map((item) => (
                <div className="bar-row" key={item.loan_id}>
                  <span className="bar-day" style={{ width: 90, fontSize: 12 }}>
                    {item.shop_name.substring(0, 12)}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(Number(item.balance_due) / maxBalance) * 100}%` }}
                    />
                  </div>
                  <span className="bar-val">Rs {Number(item.balance_due).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <p className="card-title">Today's route — {Math.min(outstanding.length, 3)} shops</p>
          {outstanding.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13 }}>No shops to visit today.</p>
          ) : (
            outstanding.slice(0, 3).map((item) => (
              <Link
                to={`/loans/${item.loan_id}`}
                key={item.loan_id}
                className="route-item"
                style={{ display: 'flex', textDecoration: 'none' }}
              >
                <div>
                  <p className="route-shop">{item.shop_name}</p>
                  <p className="route-meta">
                    Rs {Number(item.balance_due).toLocaleString()} balance ·{' '}
                    {item.days_remaining < 0
                      ? `${Math.abs(item.days_remaining)}d overdue`
                      : `${item.days_remaining}d left`}
                  </p>
                </div>
                <span className={`badge ${item.days_remaining < 0 ? 'badge-overdue' : 'badge-active'}`}>
                  {item.days_remaining < 0 ? 'Overdue' : 'Pending'}
                </span>
              </Link>
            ))
          )}
          {outstanding.length > 5 && (
            <Link to="/reports" style={{ fontSize: 12, display: 'block', marginTop: 10, textAlign: 'center' }}>
              + {outstanding.length - 5} more shops →
            </Link>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="card">
          <p className="card-title">Customer risk distribution</p>
          <div className="risk-list">
            {riskSummary ? (
              <div>
                {(() => {
                  const low = riskSummary.LOW || 0;
                  const med = riskSummary.MEDIUM || 0;
                  const high = riskSummary.HIGH || 0;
                  const total = low + med + high || 1;
                  const items = [
                    { label: 'Low', value: low, cls: 'low' },
                    { label: 'Medium', value: med, cls: 'medium' },
                    { label: 'High', value: high, cls: 'high' },
                  ];
                  return items.map((it) => (
                    <div key={it.label} className="risk-row">
                      <div className="risk-label">{it.label}</div>
                      <div className="risk-bar">
                        <div className={`bar-track`}>
                          <div className={`bar-fill ${it.cls}`} style={{ width: `${(it.value / total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="risk-value">{it.value} ({Math.round((it.value / total) * 100)}%)</div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-muted">Loading...</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}