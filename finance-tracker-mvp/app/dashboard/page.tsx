"use client";

import { useEffect, useState } from 'react';

type Txn = {
  id: number;
  date: string;
  description: string;
  merchant?: string | null;
  amountRupees: number;
  type: 'INFLOW' | 'OUTFLOW';
  category?: string | null;
};

export default function DashboardPage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [tDate, setTDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [tDesc, setTDesc] = useState('');
  const [tMerchant, setTMerchant] = useState('');
  const [tAmount, setTAmount] = useState<number>(0);
  const [tType, setTType] = useState<'INFLOW'|'OUTFLOW'>('OUTFLOW');
  const [tCategory, setTCategory] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTxns(data.data);
      } else {
        setMsg('Please login at /login');
      }
      setLoading(false);
    })();
  }, []);

  async function addTxn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: new Date(tDate).toISOString(),
        description: tDesc,
        merchant: tMerchant || undefined,
        amountRupees: Number(tAmount),
        type: tType,
        category: tCategory || undefined,
      }),
    });
    if (res.ok) {
      const list = await fetch('/api/transactions').then(r=>r.json());
      setTxns(list.data);
      setTDesc(''); setTMerchant(''); setTAmount(0); setTCategory('');
    } else {
      const data = await res.json();
      setMsg(data.error || 'Failed to add');
    }
  }

  async function uploadBill(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const res = await fetch('/api/bills', { method: 'POST', body: fd });
    if (res.ok) setMsg('Bill uploaded'); else setMsg('Upload failed');
    formEl.reset();
  }

  async function analyze() {
    setMsg('Analyzing...');
    const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (!res.ok) { setMsg('Analyze failed'); return; }
    const data = await res.json();
    setMsg(`${data.insights.join(' ')} | Recommendations: ${data.recommendations.join(' ')}`);
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dashboard</h1>
      {msg && <p>{msg}</p>}

      <section>
        <h2>Add transaction</h2>
        <form onSubmit={addTxn} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', alignItems: 'end' }}>
          <label>Date<br /><input type="date" value={tDate} onChange={e=>setTDate(e.target.value)} required /></label>
          <label>Description<br /><input value={tDesc} onChange={e=>setTDesc(e.target.value)} required /></label>
          <label>Merchant<br /><input value={tMerchant} onChange={e=>setTMerchant(e.target.value)} /></label>
          <label>Amount (₹)<br /><input type="number" step="0.01" value={tAmount} onChange={e=>setTAmount(Number(e.target.value))} required /></label>
          <label>Type<br /><select value={tType} onChange={e=>setTType(e.target.value as any)}><option>OUTFLOW</option><option>INFLOW</option></select></label>
          <label>Category<br /><input value={tCategory} onChange={e=>setTCategory(e.target.value)} placeholder="groceries, rent, dining..." /></label>
          <button type="submit" style={{ gridColumn: '1 / -1' }}>Add</button>
        </form>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Upload bill</h2>
        <form onSubmit={uploadBill} encType="multipart/form-data">
          <input type="file" name="file" required />
          <button type="submit">Upload</button>
        </form>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <button onClick={analyze}>Analyze last 30 days</button>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Transactions</h2>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Merchant</th><th>Type</th><th>Category</th><th>Amount (₹)</th></tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                  <td>{t.description}</td>
                  <td>{t.merchant || ''}</td>
                  <td>{t.type}</td>
                  <td>{t.category || ''}</td>
                  <td style={{ textAlign: 'right' }}>{t.amountRupees.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

