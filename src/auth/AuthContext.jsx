import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { AuthAPI, CompanyAPI } from '../api/endpoints';
import { getAccessToken, setOnAuthFail, setTokens } from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [initializing, setInitializing] = useState(true);

  async function loadCompany() {
    try {
      const c = await CompanyAPI.get();
      setCompany(c);
    } catch {
      setCompany(null);
    }
  }

  function clearSession() {
    setTokens(null, null);
    setUser(null);
    setCompany(null);
  }

  useEffect(() => {
    setOnAuthFail(() => clearSession());
    (async () => {
      try {
        if (getAccessToken()) {
          const me = await AuthAPI.me();
          setUser(me);
          await loadCompany();
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
    await loadCompany();
    return res.user;
  }

  async function signUp(payload) {
    const res = await AuthAPI.register(payload);
    setTokens(res.access_token, res.refresh_token);
    setUser(res.user);
    await loadCompany();
    return res.user;
  }

  function signOut() {
    clearSession();
  }

  const value = useMemo(
    () => ({ user, company, initializing, signIn, signUp, signOut, refreshCompany: loadCompany }),
    [user, company, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
