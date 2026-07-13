import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { AuthAPI } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { Button, Field, Input, ErrorText } from '../components/ui';
import styles from './Register.module.css';

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    company_name: '',
    admin_name: '',
    email: '',
    password: '',
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await AuthAPI.register(formData);
      navigate('/login', { replace: true });
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
        <h1 className={styles.title}>Register</h1>
        <p className={styles.hint}>Create a new company account.</p>
        <form onSubmit={onSubmit}>
          <Field label="Company Name">
            <Input
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Your Company Pvt Ltd"
              required
            />
          </Field>
          <Field label="Admin Name">
            <Input
              name="admin_name"
              value={formData.admin_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" loading={loading} className={styles.submit}>
            Register
          </Button>
        </form>
        <div className={styles.loginLink}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
      <p className={styles.footer}>© 2026 Pride Consultancy · Ughrani Management Software</p>
    </div>
  );
}
