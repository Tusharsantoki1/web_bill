import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { AuthAPI, CompanyAPI } from '../api/endpoints';
import { getAccessToken, setOnAuthFail, setTokens } from '../api/client';

const AuthContext = createContext(undefined);

// Roles that may create or edit data; viewers are read-only. Mirrors
// COMPANY_EDITOR_ROLES in the backend's utils/deps.py.
const EDITOR_ROLES = ['company_admin', 'company_staff', 'collection_executive'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [initializing, setInitializing] = useState(true);

  async function loadCompany() {
    try {
      const c = await CompanyAPI.get();
      setCompany(c);
    } catch {
      setCompany(null);
    }
  }

  async function loadSubscription() {
    try {
      const s = await CompanyAPI.subscription();
      setSubscription(s);
    } catch {
      // Treat an unreadable subscription as inactive rather than assuming
      // access — the backend is the real gate either way.
      setSubscription(null);
    }
  }

  function clearSession() {
    setTokens(null, null);
    setUser(null);
    setCompany(null);
    setSubscription(null);
  }

  useEffect(() => {
    setOnAuthFail(() => clearSession());
    (async () => {
      try {
        if (getAccessToken()) {
          const me = await AuthAPI.me();
          setUser(me);
          await Promise.all([loadCompany(), loadSubscription()]);
        }
      } catch {
        clearSession();
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  async function signIn(email, password) {
    const res = await AuthAPI.login(email.trim(), password);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    await Promise.all([loadCompany(), loadSubscription()]);
    return res.user;
  }

  async function signUp(payload) {
    const res = await AuthAPI.register(payload);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    await Promise.all([loadCompany(), loadSubscription()]);
    return res.user;
  }

  function signOut() {
    clearSession();
  }

  // A bill can only be created with an active subscription AND an editing
  // role. This mirrors require_billing_access on the backend, which stays the
  // real enforcement point — this only keeps the UI honest.
  const isSubscribed = Boolean(subscription?.is_active);
  const canEdit = Boolean(user && EDITOR_ROLES.includes(user.role));
  const canCreateBills = isSubscribed && canEdit;

  const value = useMemo(
    () => ({
      user,
      company,
      subscription,
      isSubscribed,
      canEdit,
      canCreateBills,
      initializing,
      signIn,
      signUp,
      signOut,
      refreshCompany: loadCompany,
      refreshSubscription: loadSubscription,
    }),
    [user, company, subscription, isSubscribed, canEdit, canCreateBills, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
