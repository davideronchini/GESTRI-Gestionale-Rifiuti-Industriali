"use client"

import React from 'react';
import PropTypes from 'prop-types';
import useSWR from 'swr';
import { useAuth } from '@/providers/authProvider';

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = new Error('Failed to fetch');
    err.status = res.status;
    throw err;
  }
  const json = await res.json().catch(() => ({}));
  return json.data || json;
};

export default function RequireRole({ allowedRoles = [], children, fallback = null }){
  const auth = useAuth();

  // If still loading auth state, render nothing to avoid flicker
  if (auth?.isLoading) return null;

  const isAuth = Boolean(auth?.isAuthenticated);

  // If not authenticated, show fallback if provided, otherwise render nothing
  if (!isAuth) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  // Try to get role from auth context first, otherwise fetch profile
  const maybeRole = auth?.role || null;

  const { data: profile, error } = useSWR(maybeRole ? null : '/api/profile', fetcher, { revalidateOnFocus: false });

  const userRole = maybeRole || (profile && (profile.ruolo || profile.role || profile.user?.ruolo || profile.user?.role)) || null;

  // If still loading profile, render nothing (could show loader)
  if (!userRole && !error) return null;

  // If no allowedRoles specified, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) return <>{children}</>;

  const normalizedUserRole = String(userRole || '').toUpperCase();
  const allowedUpper = allowedRoles.map(r => String(r).toUpperCase());

  if (allowedUpper.includes(normalizedUserRole)) return <>{children}</>;

  // If not allowed, render fallback if provided; otherwise render nothing (useful for hiding components)
  if (fallback) return <>{fallback}</>;
  return null;
}

RequireRole.propTypes = {
  allowedRoles: PropTypes.array,
  children: PropTypes.node,
  fallback: PropTypes.node,
};
