"use client"

import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Wrapper component che gestisce l'autenticazione per tutte le pagine protette
 * Utilizza useAuthGuard per gestire redirect in modo consistente
 */
export default function AuthProtectedWrapper({ children, errors = [] }) {
  const authGuard = useAuthGuard({ errors });

  // Mostra loading mentre l'auth si inizializa
  if (authGuard.isLoading) {
    return <div>Caricamento...</div>;
  }

  // Se non autenticato o redirect in corso, non mostrare nulla
  if (!authGuard.isAuthenticated || authGuard.redirectInProgress) {
    return null;
  }

  // Clona i children e passa il authGuard come prop se necessario
  return children;
}