"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { hasGoogleClientId } from "@/components/auth/Providers";
import { useAuth } from "@/hooks/useAuth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
}

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const finishLogin = useCallback(() => {
    onSuccess?.();
    router.push("/room");
  }, [onSuccess, router]);

  const handleCredential = useCallback(
    async (response: CredentialResponse) => {
      if (!response.credential) {
        setError("Google sign-in was cancelled.");
        return;
      }

      setError(null);

      try {
        await loginWithGoogle(response.credential);
        finishLogin();
      } catch {
        setError("Sign-in failed. Please try again.");
      }
    },
    [finishLogin, loginWithGoogle]
  );

  const handleDevLogin = useCallback(async () => {
    setError(null);

    try {
      await loginWithGoogle("dev-mock-credential");
      finishLogin();
    } catch {
      setError("Sign-in failed. Please try again.");
    }
  }, [finishLogin, loginWithGoogle]);

  const hasApi = Boolean(process.env.NEXT_PUBLIC_API_URL);
  const showGoogleButton = hasGoogleClientId();
  const showDevFallback = !hasApi && !showGoogleButton;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {showGoogleButton ? (
        <div className="flex justify-center [&>div]:!w-full">
          <GoogleLogin
            onSuccess={handleCredential}
            onError={() => setError("Google sign-in failed. Please try again.")}
            useOneTap={false}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width="320"
          />
        </div>
      ) : showDevFallback ? (
        <Button
          type="button"
          size="lg"
          disabled={isLoading}
          onClick={handleDevLogin}
          className="h-12 w-full max-w-xs gap-3 rounded-full border border-neutral-300 bg-white px-6 text-base font-normal text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      ) : (
        <p className="text-sm text-neutral-500">
          Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable sign-in.
        </p>
      )}

      {showDevFallback && (
        <p className="text-xs text-neutral-400">
          Dev mode — set NEXT_PUBLIC_API_URL for backend cookie auth
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
