import React, { createContext, useContext, useEffect, useState } from 'react';
import { LoginRequest, UserProfile } from '../types/api';
import {
  apiClient,
  clearStoredToken,
  getStoredToken,
  isMockMode,
  setMockMode as updateMockMode,
  setStoredToken,
} from '../services/apiClient';
import { isMockTokenExpired } from '../services/mockApi';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  /** Mensaje de error 403: el usuario está autenticado pero sin permisos. Nunca indica sesión expirada. */
  forbiddenMessage: string | null;
  isMock: boolean;
  setMock: (enabled: boolean) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearForbiddenAlert: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(isMockMode());

  /**
   * Restaurar sesión si existe un token almacenado.
   *
   * Reglas:
   * - Sin token          → sin sesión, continuar normalmente.
   * - GET /me OK         → sesión válida, restaurar usuario.
   * - Error 401/NO_TOKEN → token inválido o expirado → limpiar sesión.
   * - Error 403          → usuario autenticado sin acceso al recurso → mantener sesión,
   *                        mostrar aviso (no limpiar token).
   * - Error de red       → estado desconocido → mantener token, no cerrar sesión,
   *                        el usuario podrá reintentar cuando haya conectividad.
   */
  useEffect(() => {
    async function restoreSession() {
      const stored = getStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }
      if (isMockMode() && isMockTokenExpired(stored)) {
        clearStoredToken();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      try {
        const profile = await apiClient.auth.getMe();
        setUser(profile);
        setToken(stored);
      } catch (err: any) {
        const code: string = err?.code ?? '';
        const status: number = err?.status ?? 0;

        const isAuthFailure =
          status === 401 ||
          code === 'UNAUTHORIZED' ||
          code === 'NO_TOKEN';

        const isForbidden =
          status === 403 ||
          code === 'FORBIDDEN';

        if (isAuthFailure) {
          // Token inválido o expirado: cerrar sesión limpiamente.
          clearStoredToken();
          setUser(null);
          setToken(null);
        } else if (isForbidden) {
          // Identidad autenticada sin acceso. Mantener sesión; mostrar aviso.
          const message =
            err?.message || 'Tu cuenta no tiene acceso habilitado en este momento.';
          setForbiddenMessage(message);
        }
        // Error de red (TypeError u otros): no limpiar sesión; isLoading pasa a false
        // y la app intentará de nuevo en la próxima acción del usuario.
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, [isMock]);

  /**
   * Escuchar eventos globales de seguridad emitidos por apiClient.
   *
   * 401 → cerrar sesión (limpiar token + usuario).
   * 403 → mostrar aviso de permisos, NO cerrar sesión.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      // clearStoredToken() ya fue llamado por notifyUnauthorized en apiClient
      // para rutas protegidas, pero en el nuevo diseño notifyUnauthorized NO limpia.
      // Lo hacemos aquí como única fuente de verdad.
      clearStoredToken();
      setUser(null);
      setToken(null);
    };

    const handleForbidden = (event: Event) => {
      const ce = event as CustomEvent<{ message?: string }>;
      const message =
        ce.detail?.message || 'Permisos insuficientes para realizar esta operación.';
      setForbiddenMessage(message);
    };

    const handleMockChanged = (event: Event) => {
      const ce = event as CustomEvent<boolean>;
      setIsMock(ce.detail);
    };

    window.addEventListener('healthdocs_unauthorized', handleUnauthorized);
    window.addEventListener('healthdocs_forbidden', handleForbidden);
    window.addEventListener('healthdocs_mock_mode_changed', handleMockChanged);

    return () => {
      window.removeEventListener('healthdocs_unauthorized', handleUnauthorized);
      window.removeEventListener('healthdocs_forbidden', handleForbidden);
      window.removeEventListener('healthdocs_mock_mode_changed', handleMockChanged);
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await apiClient.auth.login(credentials);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setForbiddenMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setToken(null);
    setForbiddenMessage(null);
  };

  const setMock = (enabled: boolean) => {
    updateMockMode(enabled);
    setIsMock(enabled);
    logout();
  };

  const clearForbiddenAlert = () => {
    setForbiddenMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        forbiddenMessage,
        isMock,
        setMock,
        login,
        logout,
        clearForbiddenAlert,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
