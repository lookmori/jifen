'use client';
import { useState, useEffect, useCallback } from 'react';
import type { JWTPayload } from '@/lib/auth';

let sessionCache: JWTPayload | null = null;
let listeners: ((s: JWTPayload | null) => void)[] = [];

function notify(session: JWTPayload | null) {
  sessionCache = session;
  listeners.forEach(fn => fn(session));
}

export function useAuth() {
  const [session, setSession] = useState<JWTPayload | null>(sessionCache);
  const [loading, setLoading] = useState(!sessionCache);

  useEffect(() => {
    const listener = (s: JWTPayload | null) => setSession(s);
    listeners.push(listener);

    if (!sessionCache && loading) {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            notify(d.data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  const login = useCallback(async (phone: string, password: string, schoolId?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, schoolId }),
    });
    const data = await res.json();
    if (data.success && !data.needsSchoolSelect) {
      notify(data.data);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    notify(null);
    window.location.href = '/login';
  }, []);

  return { session, loading, login, logout, isAdmin: session?.role === 'admin' };
}
