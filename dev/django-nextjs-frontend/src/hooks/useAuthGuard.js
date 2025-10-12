"use client"

import { useAuth } from "@/providers/authProvider";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Hook personalizzato per gestire l'autenticazione e i redirect in modo consistente
 * Semplificato per evitare loop e redirect multipli
 *
 * @param {Object} options - Opzioni di configurazione
 * @param {Array} options.errors - Array di errori da monitorare per status 401
 * @param {boolean} options.requireAuth - Se true, richiede autenticazione (default: true)
 * @returns {Object} - Stato dell'autenticazione e funzioni di utilità
 */
export function useAuthGuard(options = {}) {
  const { errors = [], requireAuth = true } = options;
  const auth = useAuth();
  const pathname = usePathname();
  const hasCheckedAuth = useRef(false);
  const has401ErrorProcessed = useRef(false);

  // Normalize path to match AuthProvider behavior (remove trailing slash and query)
  const normalizePath = (p) => {
    if (!p) return '/';
    const beforeQuery = String(p).split('?')[0];
    if (beforeQuery !== '/' && beforeQuery.endsWith('/')) {
      return beforeQuery.replace(/\/+$/, '');
    }
    return beforeQuery || '/';
  };
  const normalizedPathname = normalizePath(pathname);

  // Lista delle pagine pubbliche che non richiedono autenticazione
  const publicPages = ['/login', '/register', '/logout'];
  const isPublicPage = publicPages.includes(normalizedPathname) || normalizedPathname.startsWith('/api');

  // Effetto per gestire l'autenticazione iniziale - SI ESEGUE UNA SOLA VOLTA
  useEffect(() => {
    if (!requireAuth) return;

    // Non verificare autenticazione su pagine pubbliche
    if (isPublicPage) {
      console.log('🔒 useAuthGuard: Public page, skipping auth check');
      return;
    }

    // Evita controlli multipli
    if (hasCheckedAuth.current) return;

    // Attendi che l'inizializzazione sia completa
    if (auth.isLoading) return;

    console.log('🔒 useAuthGuard: Checking initial authentication');

    // Segna come controllato PRIMA di fare qualsiasi redirect
    hasCheckedAuth.current = true;

    // Se non autenticato, reindirizza
    if (!auth.isAuthenticated) {
      console.log('🔒 useAuthGuard: Not authenticated, redirecting');
      // Ritorna il risultato per consentire al chiamante di sapere se è stato eseguito
      auth.loginRequiredRedirect('initial authentication check');
    } else {
      console.log('🔒 useAuthGuard: User authenticated');
    }
    // NOTE: intentionally not depending on pathname to avoid retrigger on internal route changes
  }, [auth.isLoading, auth.isAuthenticated, requireAuth, isPublicPage]);

  // Effetto per gestire gli errori 401 delle API
  useEffect(() => {
    if (!requireAuth) return;

    // Non gestire 401 su pagine pubbliche
    if (isPublicPage) return;

    // Non processare se l'auth sta caricando o se il redirect è recente
    if (auth.isLoading || (auth.isRedirectRecent && auth.isRedirectRecent())) return;

    // Controlla se c'è un errore 401
    const has401Error = errors.some(error => error?.status === 401 || error?.isAuthError === true);

    // Se c'è un 401 e non è già stato processato
    if (has401Error && !has401ErrorProcessed.current) {
      console.log('🔒 useAuthGuard: 401 error detected, redirecting');
      has401ErrorProcessed.current = true;

      // Esegui il redirect; loginRequiredRedirect già gestisce debounce e skip
      auth.loginRequiredRedirect('401 API error');

      // Do not use time-based resets here. We intentionally keep the
      // `has401ErrorProcessed` flag set so duplicate 401 handling is avoided.
      // The flag will be cleared by other effects when authentication state
      // changes or when navigation occurs.
    }
    // intentionally leaving out auth from deps to avoid re-running when internal auth object identity changes
  }, [errors, requireAuth, isPublicPage]);

  // Reset del flag quando l'utente si autentica nuovamente o cambia pagina
  useEffect(() => {
    if (auth.isAuthenticated) {
      has401ErrorProcessed.current = false;
    } else {
      // only reset initial check when authentication really changed to false
      hasCheckedAuth.current = false;
    }
  }, [auth.isAuthenticated]);

  // Reset quando cambia pathname (cambio pagina)
  // Avoid resetting hasCheckedAuth on every pathname change which can cause re-evaluation loops
  // Only reset when navigating to a public page or when pathname becomes different AND user is unauthenticated
  useEffect(() => {
    if (isPublicPage) return;
    // If user is not authenticated, allow the auth check to run again on meaningful navigation
    if (!auth.isAuthenticated) {
      hasCheckedAuth.current = false;
    }
  }, [normalizedPathname, isPublicPage, auth.isAuthenticated]);

  return {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    redirectInProgress: auth.isRedirectRecent ? auth.isRedirectRecent() : false,
    email: auth.email,
    // Funzione per chiamare redirect manualmente se necessario
    triggerRedirect: (reason = 'manual trigger') => {
      // ensure we never redirect from public pages
      if (isPublicPage) return false;

      // Prevent calling loginRequiredRedirect while a redirect is considered recent
      if (auth.isRedirectRecent && auth.isRedirectRecent()) {
        console.log('🔒 useAuthGuard.triggerRedirect: redirect recently executed, skipping:', reason);
        return false;
      }

      try {
        return auth.loginRequiredRedirect(reason);
      } catch (e) {
        console.error('🔒 useAuthGuard.triggerRedirect: failed to execute redirect', e);
        return false;
      }
    }
  };
}