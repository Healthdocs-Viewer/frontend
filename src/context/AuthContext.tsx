import React, { createContext, useContext, useEffect, useState } from "react";
import { LoginRequest, UserProfile } from "../types/api";
import {
  apiClient,
  isMockMode,
  setMockMode as updateMockMode,
} from "../services/apiClient";
import { authService } from "../services/authService";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  /** Mensaje de error 403: el usuario está autenticado pero sin permisos. Nunca indica sesión expirada. */
  forbiddenMessage: string | null;
  isMock: boolean;
  usesManagedAuth: boolean;
  usesSupabaseAuth: boolean;
  setMock: (enabled: boolean) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  completeRegistration: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  clearForbiddenAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(isMockMode());

  useEffect(() => {
    let active = true;

    const unsubscribeAuth = authService.onAuthStateChange(
      (event, accessToken) => {
        if (!active) return;
        setToken(accessToken);
        if (
          event === "SIGNED_OUT" ||
          (!authService.usesManagedProvider && accessToken === null)
        ) {
          setUser(null);
          setForbiddenMessage(null);
        }
      },
    );

    const restoreSession = async () => {
      try {
        const stored = await authService.getToken();
        if (!active) return;
        if (!stored) {
          setToken(null);
          setUser(null);
          return;
        }

        if (authService.isMockSession(stored)) {
          await authService.logout();
          setUser(null);
          setToken(null);
          return;
        }

        setToken(stored);
        // Supabase can authenticate a newly confirmed email before Healthdocs has
        // provisioned its business profile. Registration is idempotent, so it also
        // restores existing profiles without changing their roles.
        if (authService.usesSupabaseAuth) {
          await apiClient.auth.register();
        }
        const profile = await apiClient.auth.getMe();
        if (active) setUser(profile);
      } catch (err: any) {
        const code: string = err?.code ?? "";
        const status: number = err?.status ?? 0;
        if (status === 401 || code === "UNAUTHORIZED" || code === "NO_TOKEN") {
          void authService.logout().catch(() => undefined);
          if (active) {
            setUser(null);
            setToken(null);
          }
        } else if (status === 403 || code === "FORBIDDEN") {
          if (active)
            setForbiddenMessage(
              err?.message ||
                "Tu cuenta no tiene acceso habilitado en este momento.",
            );
        }
        // Un fallo de red conserva la sesión del proveedor y permite reintentar luego.
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restoreSession();

    const handleUnauthorized = () => {
      void authService.logout().catch(() => undefined);
      setUser(null);
      setToken(null);
    };
    const handleForbidden = (event: Event) => {
      const ce = event as CustomEvent<{ message?: string }>;
      setForbiddenMessage(
        ce.detail?.message ||
          "Permisos insuficientes para realizar esta operación.",
      );
    };
    const handleMockChanged = (event: Event) =>
      setIsMock((event as CustomEvent<boolean>).detail);

    window.addEventListener("healthdocs_unauthorized", handleUnauthorized);
    window.addEventListener("healthdocs_forbidden", handleForbidden);
    window.addEventListener("healthdocs_mock_mode_changed", handleMockChanged);

    return () => {
      active = false;
      unsubscribeAuth();
      window.removeEventListener("healthdocs_unauthorized", handleUnauthorized);
      window.removeEventListener("healthdocs_forbidden", handleForbidden);
      window.removeEventListener(
        "healthdocs_mock_mode_changed",
        handleMockChanged,
      );
    };
  }, [isMock]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      setToken(session.accessToken);
      if (authService.usesSupabaseAuth) {
        await apiClient.auth.register();
      }
      const profile = await apiClient.auth.getMe();
      setUser(profile);
      setForbiddenMessage(null);
    } catch (error) {
      setUser(null);
      const authError = error as { code?: string; status?: number };
      if (
        authService.usesManagedProvider &&
        (authError.code === "UNAUTHORIZED" || authError.status === 401)
      ) {
        throw new Error(
          "La cuenta del proveedor inició sesión, pero aún no está vinculada a un usuario de Healthdocs.",
        );
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    try {
      await apiClient.auth.register();
      const profile = await apiClient.auth.getMe();
      const activeToken = await authService.getToken();
      setToken(activeToken);
      setUser(profile);
      setForbiddenMessage(null);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setForbiddenMessage(null);
  };

  const setMock = (enabled: boolean) => {
    void logout().catch(() => undefined);
    updateMockMode(enabled);
    setIsMock(enabled);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        forbiddenMessage,
        isMock,
        usesManagedAuth: authService.usesManagedProvider,
        usesSupabaseAuth: authService.usesSupabaseAuth,
        setMock,
        login,
        completeRegistration,
        logout,
        clearForbiddenAlert: () => setForbiddenMessage(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  return context;
}
