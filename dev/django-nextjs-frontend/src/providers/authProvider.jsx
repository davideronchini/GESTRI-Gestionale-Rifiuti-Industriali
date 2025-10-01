"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
const { createContext, useContext, useState, useEffect, useCallback, useRef } = require("react");

const AuthContext = createContext(null);

// Costanti di configurazione
const LOGIN_REDIRECT_URL = '/';
const LOGOUT_REDIRECT_URL = '/login';
const LOGIN_REQUIRED_URL = '/login';
const LOCAL_STORAGE_KEY = 'is-logged-in';
const LOCAL_EMAIL_KEY = 'email';
const REDIRECT_TIMEOUT_MS = 5000; // Timeout per prevenire redirect doppi

export function AuthProvider({children}){
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Aggiunto stato di loading
  const lastRedirectTime = useRef(0); // Timestamp dell'ultimo redirect per evitare duplicati
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(()=>{
    console.log('AuthProvider initializing, checking localStorage');
    const storedAuthStatus = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    console.log('Stored auth status:', storedAuthStatus);
    setIsAuthenticated(storedAuthStatus === 'true');

    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_EMAIL_KEY) : null;
    if(storedEmail){
      setEmail(storedEmail);
    }
    
    // Indica che l'inizializzazione è completata
    console.log('AuthProvider initialization complete, isAuthenticated:', storedAuthStatus === 'true');
    setIsLoading(false);
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

  const login = (maybeEmail)=>{
    console.log('Login called, setting authenticated to true');
    
    // Reset del timestamp di redirect quando facciamo login
    lastRedirectTime.current = 0;
    
    // Prima aggiorna localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    console.log('localStorage set to true, current value:', localStorage.getItem(LOCAL_STORAGE_KEY));
    
    if (maybeEmail){
      localStorage.setItem(LOCAL_EMAIL_KEY, `${maybeEmail}`);
      setEmail(maybeEmail);
    } else {
      localStorage.removeItem(LOCAL_EMAIL_KEY);
      setEmail('');
    }
    
    // Aggiorna lo stato React
    setIsAuthenticated(true);

    console.log('Login completed, now redirecting...');
    
    // gestisci "next" (decodifica e valida)
    const nextUrlRaw = searchParams.get('next');
    const nextDecoded = nextUrlRaw ? decodeURIComponent(nextUrlRaw) : null;
    const invalidNext = new Set(['/login', '/logout']);
    const isSafeNext = nextDecoded && nextDecoded.startsWith('/') && !invalidNext.has(nextDecoded);

    if (isSafeNext){
      router.replace(nextDecoded);
    } else {
      router.replace(LOGIN_REDIRECT_URL);
    }
  }

  const logout = ()=>{
    setIsAuthenticated(false);
    localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
    setEmail('');
    localStorage.removeItem(LOCAL_EMAIL_KEY);
    router.replace(LOGOUT_REDIRECT_URL);
  }

  const loginRequiredRedirect = useCallback((reason = 'authentication required')=>{
    console.log('🚨 loginRequiredRedirect called:', reason, 'Current pathname:', pathname);
    
    // Evita loop se già su /login
    if (pathname === LOGIN_REQUIRED_URL) {
      console.log('Already on login page, skipping redirect');
      return false;
    }

    // Evita redirect multipli usando timeout
    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;
    console.log('Time since last redirect:', timeSinceLastRedirect, 'ms');
    
    if (timeSinceLastRedirect < REDIRECT_TIMEOUT_MS) {
      console.log('Redirect attempted too recently, skipping duplicate redirect');
      return false;
    }

    lastRedirectTime.current = now;
    console.log('🚨 Setting lastRedirectTime to:', now);

    // Aggiorna stato di autenticazione
    console.log('🚨 Setting authentication state to false');
    setIsAuthenticated(false);
    setIsLoading(false);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'false');
      localStorage.removeItem(LOCAL_EMAIL_KEY);
    }
    setEmail('');

    // Costruisci URL di redirect con next parameter
    const qs = searchParams?.toString();
    const currentPathWithQuery = qs ? `${pathname}?${qs}` : pathname;
    const loginWithNextUrl = `${LOGIN_REQUIRED_URL}?next=${encodeURIComponent(currentPathWithQuery)}`;
    
    console.log('🚨 Redirecting to login with next URL:', loginWithNextUrl);
    router.replace(loginWithNextUrl);
    
    return true; // Indica che il redirect è stato eseguito
  }, [pathname, searchParams, router]);

  // Funzione di utilità per verificare se un redirect è recente
  const isRedirectRecent = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRedirect = now - lastRedirectTime.current;
    return timeSinceLastRedirect < REDIRECT_TIMEOUT_MS;
  }, []);

  // Funzione per resettare il timestamp di redirect (utile per testing o situazioni speciali)
  const resetRedirectTimeout = useCallback(() => {
    lastRedirectTime.current = 0;
    console.log('Redirect timeout reset');
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
    // Esponi le costanti per consistency
    constants: {
      LOGIN_REDIRECT_URL,
      LOGOUT_REDIRECT_URL,
      LOGIN_REQUIRED_URL,
      REDIRECT_TIMEOUT_MS
    }
  }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth(){
  return useContext(AuthContext)
}