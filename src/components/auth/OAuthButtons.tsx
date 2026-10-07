import React from "react";
import { Button } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

type OAuthProvider = "google" | "azure";

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z" />
    <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z" />
    <path fill="#FBBC05" d="M12.6 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 18Z" />
    <path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z" />
  </svg>
);

const MicrosoftMark = () => (
  <svg viewBox="0 0 23 23" className="h-4 w-4" aria-hidden="true">
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#7fba00" d="M12 1h10v10H12z" />
    <path fill="#00a4ef" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

export const OAuthButtons: React.FC = () => {
  const { usesSupabaseAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = React.useState<OAuthProvider | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!usesSupabaseAuth) return null;

  const startOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider);
    setErrorMessage(null);
    try {
      await authService.signInWithOAuth(provider);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión con este proveedor.",
      );
      setLoadingProvider(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            O continúa con
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => void startOAuth("google")}
          className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <GoogleMark />
          {loadingProvider === "google" ? "Conectando…" : "Google"}
        </Button>
        <Button
          variant="outline"
          disabled={loadingProvider !== null}
          onClick={() => void startOAuth("azure")}
          className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <MicrosoftMark />
          {loadingProvider === "azure" ? "Conectando…" : "Microsoft"}
        </Button>
      </div>
      {errorMessage && (
        <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
