'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Credenciales incorrectas o usuario no existe ✨');
      setLoading(false);
    } else {
      router.push('/dashboard/orders');
      router.refresh(); // Important to refresh layout and middleware
    }
  };

  return (
    <div className="login-container">
      <div className="login-decor login-decor-1"></div>
      <div className="login-decor login-decor-2"></div>
      <div className="login-card">
        <div className="login-header">
          <h1>DannyR</h1>
          <p>✨ Welcome back, hermosa ✨</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label" style={{color: 'var(--login-text)'}}>Email 🌸</label>
            <input 
              type="email" 
              className="input login-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{color: 'var(--login-text)'}}>Password 💖</label>
            <input 
              type="password" 
              className="input login-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          
          {error && <div className="login-error">🥺 {error}</div>}
          
          <button type="submit" className="btn login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Ingresar al sistema 🌸'}
          </button>
        </form>
      </div>
    </div>
  );
}
