"use client"

import { useAuth } from "@/providers/authProvider";
import { useEffect, useRef } from "react";

/**
 * Hook personalizzato per gestire l'autenticazione e i redirect in modo consistente
 * Previene redirect doppi e gestisce sia l'autenticazione iniziale che gli errori 401
 * 
 * @param {Object} options - Opzioni di configurazione
 * @param {Array} options.errors - Array di errori da monitorare per status 401
 * @param {boolean} options.requireAuth - Se true, richiede autenticazione (default: true)
 * @param {boolean} options.handleInitialAuth - Se gestire l'autenticazione iniziale (default: true)
 * @param {boolean} options.handle401Errors - Se gestire errori 401 (default: true)
 * @returns {Object} - Stato dell'autenticazione e funzioni di utilità
 */
export function useAuthGuard(options = {}) {
  const { 
    errors = [], 
    requireAuth = true,
    handleInitialAuth = true,
    handle401Errors = true 
  } = options;
  
  const auth = useAuth();
  const hasProcessedInitialAuth = useRef(false);
  const redirectInProgress = useRef(false);

  // Effetto per gestire l'autenticazione iniziale
  useEffect(() => {
    if (!handleInitialAuth || !requireAuth) return;
    
    console.log('useAuthGuard - auth check - isLoading:', auth.isLoading, 'isAuthenticated:', auth.isAuthenticated, 'hasProcessedInitialAuth:', hasProcessedInitialAuth.current);
    
    // Evita redirect se l'auth non è ancora inizializzato o se già processato
    if (auth.isLoading || hasProcessedInitialAuth.current) return;
    
    // Evita redirect se già in corso (usa il controllo del provider)
    if (auth.isRedirectRecent && auth.isRedirectRecent()) {
      console.log('useAuthGuard - Redirect recently executed, skipping');
      return;
    }
    
    // Controlla l'autenticazione iniziale
    if (!auth.isAuthenticated) {
      console.log('useAuthGuard - Not authenticated on initial load, redirecting to login');
      hasProcessedInitialAuth.current = true;
      redirectInProgress.current = true;
      const success = auth.loginRequiredRedirect('initial authentication check');
      if (!success) {
        redirectInProgress.current = false;
      }
      return;
    }
    
    // Segna come processato se l'utente è autenticato
    hasProcessedInitialAuth.current = true;
  }, [auth.isLoading, auth.isAuthenticated, auth.loginRequiredRedirect, auth.isRedirectRecent, handleInitialAuth, requireAuth]);

  // Effetto per gestire gli errori 401 delle API
  useEffect(() => {
    if (!handle401Errors || !requireAuth) return;
    
    // Non processare errori se non siamo ancora autenticati o se il redirect è in corso
    if (!auth.isAuthenticated || auth.isLoading) return;
    
    // Evita redirect se già in corso
    if (auth.isRedirectRecent && auth.isRedirectRecent()) {
      console.log('useAuthGuard - Redirect recently executed for 401, skipping');
      return;
    }
    
    // Controlla se qualsiasi errore ha status 401
    const has401Error = errors.some(error => error?.status === 401);
    
    if (has401Error) {
      console.log('useAuthGuard - 401 error detected from API, redirecting to login');
      redirectInProgress.current = true;
      const success = auth.loginRequiredRedirect('401 API error');
      if (!success) {
        redirectInProgress.current = false;
      }
    }
  }, [...errors.map(error => error?.status), auth.isAuthenticated, auth.isLoading, auth.loginRequiredRedirect, auth.isRedirectRecent, handle401Errors, requireAuth]);

  // Reset dei flag quando l'autenticazione cambia
  useEffect(() => {
    if (auth.isAuthenticated) {
      redirectInProgress.current = false;
    } else {
      hasProcessedInitialAuth.current = false;
    }
  }, [auth.isAuthenticated]);

  return {
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    redirectInProgress: redirectInProgress.current,
    email: auth.email,
    // Funzione per chiamare redirect manualmente se necessario
    triggerRedirect: (reason = 'manual trigger') => {
      if (!redirectInProgress.current && !auth.isRedirectRecent()) {
        redirectInProgress.current = true;
        const success = auth.loginRequiredRedirect(reason);
        if (!success) {
          redirectInProgress.current = false;
        }
        return success;
      }
      return false;
    },
    // Funzione per resettare lo stato del guard (utile per testing)
    reset: () => {
      hasProcessedInitialAuth.current = false;
      redirectInProgress.current = false;
      if (auth.resetRedirectTimeout) {
        auth.resetRedirectTimeout();
      }
    }
  };
}