import { useState, useEffect } from 'react';
import { getHolidays, createHoliday, deleteHoliday } from '../api/holidays';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getHolidays()
      .then((data) => { setHolidays(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createHoliday(date, description)
      .then(() => { setDate(''); setDescription(''); load(); })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  };

  const handleDelete = (d) => {
    if (!window.confirm(`Remove ${d} as a holiday?`)) return;
    deleteHoliday(d).then(load).catch((err) => setError(err.message));
  };

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: '0.25rem' }}>Holidays</h1>
      <p className="text-muted" style={{ fontSize: 13, marginBottom: '1.25rem' }}>
        Mark dates you don't collect payments on (Poya days, personal days, weather, etc.) — these won't count as arrears days for any loan.
      </p>

      <div className="card mb-2">
        <p className="card-title">Add a holiday</p>
        <form onSubmit={handleSubmit} className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Vesak Poya Day"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
            <button type="submit" className="btn btn-primary">Add holiday</button>
          </div>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="card">
        <p className="card-title">Marked holidays</p>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : holidays.length === 0 ? (
          <p className="text-muted">No holidays added yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Reason</th><th></th></tr>
            </thead>
            <tbody>
              {holidays.map((h) => (
                <tr key={h.date}>
                  <td style={{ fontWeight: 500 }}>{h.date}</td>
                  <td className="text-muted">{h.description || '—'}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleDelete(h.date)}>
                      Remove
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