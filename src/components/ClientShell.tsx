'use client';

import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import NavBar from './NavBar';
import LoginPage from './LoginPage';

function InnerShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <NavBar />
      <main style={{ flex: 1 }}>{children}</main>
    </>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InnerShell>{children}</InnerShell>
    </AuthProvider>
  );
}
