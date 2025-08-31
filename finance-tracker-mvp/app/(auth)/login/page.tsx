"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setMsg(data.error || 'Login failed');
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <br />
        <label>Password<br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
      {msg && <p>{msg}</p>}
      <p><a href="/register">Create an account</a></p>
    </div>
  );
}

