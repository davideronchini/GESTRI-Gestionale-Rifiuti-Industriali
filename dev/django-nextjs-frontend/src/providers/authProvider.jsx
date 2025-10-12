"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
const { createContext, useContext, useState, useEffect, useCallback, useRef } = require("react");
import { mutate } from 'swr';

const AuthContext = createContext(null);

// Costanti di configurazione
const LOGIN_REDIRECT_URL = '/';
const LOGOUT_REDIRECT_URL = '/login';
const LOGIN_REQUIRED_URL = '/login';
const LOCAL_STORAGE_KEY = 'is-logged-in';
const LOCAL_EMAIL_KEY = 'email';
// No time-based debouncing: rely on isRedirecting flag to prevent duplicate redirects

export function AuthProvider({children}){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Key used to force remount of the children tree on logout
  const [remountKey, setRemountKey] = useState(0);
  const lastRedirectTime = useRef(0);
  const isRedirecting = useRef(false); // Flag per tracciare se un redirect è in corso
  const router = useRouter();
  // `pathname` contains the current URL path (e.g. '/documento/crea').
  // Use it to make decisions based on the active route (normalize, compare, etc.).
  const pathname = usePathname();
  // `searchParams` represents URL query parameters
  // (e.g. for '?next=/profile' get the value with searchParams.get('next')).
  const searchParams = useSearchParams();

  // Normalized pathname used throughout to avoid trailing-slash / query mismatches
  const normalizePath = (p) => {
    if (!p) return '/';
    // strip query string if present (usePathname usually excludes query but be defensive)
    const beforeQuery = String(p).split('?')[0];
    // remove trailing slash except for root
    if (beforeQuery !== '/' && beforeQuery.endsWith('/')) {
      return beforeQuery.replace(/\/+$/, '');
    }
    return beforeQuery || '/';
  };

  const normalizedPathname = normalizePath(pathname);

  // Inizializzazione dello stato di autenticazione da localStorage
  useEffect(()=>{

    const init = async () => {
      const storedAuthStatus = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_EMAIL_KEY) : null;

  const isAuth = storedAuthStatus === 'true';

      // If localStorage says not authenticated, just initialize state from storage
      if (!isAuth) {
        setIsAuthenticated(false);
        setEmail(storedEmail || '');
        setIsLoading(false);
        return;
      }

      // If localStorage says authenticated, verify with server to avoid stale true
      try {
        const res = await fetch('/api/whoami', { method: 'GET', credentials: 'include' });
  if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const remoteEmail = json?.email || json?.data?.email || null;
          setIsAuthenticated(true);
          if (remoteEmail) {
            setEmail(remoteEmail);
            localStorage.setItem(LOCAL_EMAIL_KEY, remoteEmail);
          } else if (storedEmail) {
            setEmail(storedEmail);
          }
        } else {
          // server says not authenticated (401 or other): clear local state
          setIsAuthenticated(false);
          setEmail('');
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
            localStorage.removeItem(LOCAL_EMAIL_KEY);
          }
        }
      } catch (err) {
  // Network or other error: be conservative and clear stored auth to avoid stale state
  // NOTE: if you'd rather keep the stored value on transient network errors, change this behavior.
  setIsAuthenticated(false);
  setEmail('');
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
          localStorage.removeItem(LOCAL_EMAIL_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  },[])

  // sincronizza lo stato quando localStorage cambia (es. altre tab)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === LOCAL_EMAIL_KEY) {
        setEmail(e.newValue || '');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (maybeEmail)=>{
    
    
  // Reset redirect flags
  lastRedirectTime.current = 0;
  isRedirecting.current = false;
    
    // Aggiorna localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    
    if (maybeEmail){
      localStorage.setItem(LOCAL_EMAIL_KEY, `${maybeEmail}`);
      setEmail(maybeEmail);
    } else {
      localStorage.removeItem(LOCAL_EMAIL_KEY);
      setEmail('');
    }
    
    // Aggiorna lo stato React
    setIsAuthenticated(true);

  
    
    // Gestisci "next" parameter (decodifica e valida)
    const nextUrlRaw = searchParams?.get('next');
    const nextDecoded = nextUrlRaw ? decodeURIComponent(nextUrlRaw) : null;
    const invalidNext = new Set(['/login', '/register', '/logout']);
    const isSafeNext = nextDecoded && nextDecoded.startsWith('/') && !invalidNext.has(nextDecoded);

    const redirectTo = isSafeNext ? nextDecoded : LOGIN_REDIRECT_URL;

    // Invalidate main SWR caches and wait for revalidation to finish so pages load fresh data
    const invalidatePrefix = async (prefix) => {
      try {
        // Normalize base (remove trailing slashes) so we don't generate keys like //
        const base = String(prefix || '').replace(/\/+$/, '');
        const candidates = [
          base,
          `${base}/`,
          `${base}/by-date/`,
          // also include a common double-slash variant just in case some parts of the app
          // constructed keys with a trailing slash on the prefix
          `${base}//by-date/`,
        ];

        const promises = candidates.map(k => mutate(k, null, { revalidate: true }).catch(() => {}));
        await Promise.all(promises);
      } catch (e) {
        // ignore
      }
    };

    try {
      // Invalidate profile and attivita-related keys (by prefix) then other common prefixes
      await Promise.all([
        invalidatePrefix('/api/profile'),
        invalidatePrefix('/api/attivita'),
      ]);
      // Fire-and-forget for less critical caches
      invalidatePrefix('/api/documenti').catch(() => {});
      invalidatePrefix('/api/mezzi').catch(() => {});
      invalidatePrefix('/api/utenti').catch(() => {});

      // Force remount of children so components re-mount and fetch fresh data
      try { setRemountKey(k => k + 1); } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore mutate errors but still proceed to redirect
    }

    try { router.replace(redirectTo); } catch (error) { if (typeof window !== 'undefined') window.location.href = redirectTo; }
  }, [router, searchParams]);

  const logout = useCallback(()=>{
    // Make logout return a Promise-like behavior by creating and storing it on the function
    // so callers can optionally await auth.logout()
    let resolveLogout;
    const logoutPromise = new Promise((resolve) => { resolveLogout = resolve; });

    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
    setEmail('');
    localStorage.removeItem(LOCAL_EMAIL_KEY);

    // Reset dei flag
    lastRedirectTime.current = 0;
    isRedirecting.current = false;

    // Also call backend logout route to remove server-side tokens (cookies)
    (async () => {
      try {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {
        // ignore network errors on logout
      }

      // Clear common SWR caches so subsequent logins fetch fresh data
      const invalidatePrefix = async (prefix) => {
        try {
          const candidates = [
            prefix,
            prefix.replace(/\/$/, ''),
            `${prefix}/by-date/`,
            `${prefix}/`,
          ];
          const promises = candidates.map(k => mutate(k, null, { revalidate: true }).catch(() => {}));
          await Promise.all(promises);
        } catch (e) {
          // ignore
        }
      };

      try {
        // Await the most important invalidations to minimize stale UI windows
        await Promise.all([
          invalidatePrefix('/api/profile'),
          invalidatePrefix('/api/attivita'),
        ]).catch(() => {});

        // Fire-and-forget for secondary caches
        invalidatePrefix('/api/documenti').catch(() => {});
        invalidatePrefix('/api/mezzi').catch(() => {});
        invalidatePrefix('/api/utenti').catch(() => {});
      } catch (e) {
        // ignore
      }

      // Force a remount of the app subtree to fully reset client-side state
      try { setRemountKey(k => k + 1); } catch (e) { /* ignore */ }

      try { router.replace(LOGOUT_REDIRECT_URL); } catch (error) { if (typeof window !== 'undefined') window.location.href = LOGOUT_REDIRECT_URL; }

      // Resolve the promise so callers can continue after logout completes
      resolveLogout();
    })();

    // Attach the promise to the function for callers who want to await it
    logoutPromise.then(() => {});
    return logoutPromise;
  }, [router]);

  const loginRequiredRedirect = useCallback((reason = 'authentication required')=>{
    
    // Evita loop se già su pagine pubbliche
    const publicPages = ['/login', '/register', '/logout'];
    // Use normalized pathname for comparison to handle trailing slashes and variants
    if (publicPages.includes(normalizedPathname) || normalizedPathname.startsWith('/api')) {
      console.log('🚨 AuthProvider: Already on public page or API path, skipping redirect');
      return false;
    }

    // Avoid redirect if one is already in progress
    if (isRedirecting.current) return false;
    // Set the flag to indicate a redirect is happening and prevent duplicates
    lastRedirectTime.current = Date.now();
    isRedirecting.current = true;

    // Update auth state before redirect
    setIsAuthenticated(false);
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
      localStorage.removeItem(LOCAL_EMAIL_KEY);
    }
    setEmail('');

    // Costruisci URL di redirect con next parameter (solo per pagine protette)
    // Decide whether to include a `next` parameter. Use the normalized pathname and
    // avoid saving root or public pages as next to prevent redirect back to login.
    const shouldSaveNext = !publicPages.includes(normalizedPathname) && normalizedPathname !== '/';
    let loginUrl = LOGIN_REQUIRED_URL;

    if (shouldSaveNext) {
      // Non includere il query string esistente nel next parameter per evitare loop
      loginUrl = `${LOGIN_REQUIRED_URL}?next=${encodeURIComponent(normalizedPathname)}`;
    }

    // If we're already navigating to the same login URL (including next), avoid calling replace
    try {
      const currentHref = typeof window !== 'undefined' ? window.location.pathname + (window.location.search || '') : '';
      if (currentHref === loginUrl || currentHref === LOGIN_REQUIRED_URL) {
        // still update flags to reflect that logout happened
        setIsAuthenticated(false);
        setIsLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
          localStorage.removeItem(LOCAL_EMAIL_KEY);
        }
        setEmail('');
        // don't perform router.replace; return false to indicate no navigation executed
        return false;
      }
    } catch (e) {
      // ignore any access errors to window
    }

    try { router.replace(loginUrl); } catch (error) { if (typeof window !== 'undefined') window.location.href = loginUrl; }
    isRedirecting.current = false;
    
    return true;
  }, [pathname, router, setIsAuthenticated, setIsLoading, setEmail]);

  // Funzione di utilità per verificare se un redirect è recente
  const isRedirectRecent = useCallback(() => {
    return !!isRedirecting.current;
  }, []);

  // Funzione per resettare il timestamp di redirect
  const resetRedirectTimeout = useCallback(() => {
    lastRedirectTime.current = 0;
    isRedirecting.current = false;
  }, []);

  return <AuthContext.Provider value={{
    isAuthenticated, 
    login, 
    logout, 
    loginRequiredRedirect, 
    email,
    isLoading,
    isRedirectRecent,
    resetRedirectTimeout,
    // Expose constants for consistency
    constants: {
      LOGIN_REDIRECT_URL,
      LOGOUT_REDIRECT_URL,
      LOGIN_REQUIRED_URL
    }
  }}>
    {/* key forces React to remount the entire subtree when incremented */}
    <div key={remountKey}>{children}</div>
  </AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}