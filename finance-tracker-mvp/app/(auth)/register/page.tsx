"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      setMsg('Registered! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1000);
    } else {
      const data = await res.json();
      setMsg(data.error || 'Failed');
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Register</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <br />
        <label>Password<br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </label>
        <br />
        <button type="submit">Create account</button>
      </form>
      {msg && <p>{msg}</p>}
      <p><a href="/login">Have an account? Login</a></p>
    </div>
  );
}

