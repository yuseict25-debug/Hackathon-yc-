"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthHydrator } from "@/components/auth/AuthHydrator";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || "unset"}>
      <AuthHydrator />
      {children}
    </GoogleOAuthProvider>
  );
}

export function hasGoogleClientId(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}
