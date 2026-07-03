import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../api/client';
import { Button, Field, Input, ErrorText } from '../components/ui';
import styles from './Login.module.css';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>PC</div>
          <div>
            <div className={styles.name}>Pride Consultancy</div>
            <div className={styles.sub}>Ughrani Management</div>
          </div>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.hint}>Welcome back. Please log in to your company account.</p>
        <form onSubmit={onSubmit}>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" loading={loading} className={styles.submit}>
            Sign in
          </Button>
        </form>
      </div>
      <p className={styles.footer}>© 2026 Pride Consultancy · Ughrani Management Software</p>
    </div>
  );
}
