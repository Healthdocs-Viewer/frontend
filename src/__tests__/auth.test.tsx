/**
 * Pruebas de autenticación: login, restauración de sesión, 401, 403, errores de red.
 *
 * Estrategia: se prueba mockBackendService directamente (sin fetch real) y la lógica
 * de AuthContext mediante un componente de prueba que usa el hook useAuth().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { mockBackendService, MockHttpError, TEST_USERS } from '../services/mockApi';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  isMockMode,
  apiClient,
} from '../services/apiClient';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Componente de prueba que expone el estado de AuthContext como atributos de datos. */
const AuthTestConsumer: React.FC = () => {
  const { user, token, isLoading, forbiddenMessage, login, logout, completeRegistration } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="role">{user ? user.role : 'null'}</span>
      <span data-testid="token">{token ? 'present' : 'null'}</span>
      <span data-testid="forbidden">{forbiddenMessage ?? 'null'}</span>
      <button
        data-testid="logout-btn"
        onClick={logout}
      >
        Logout
      </button>
      <button
        data-testid="login-paciente"
        onClick={() => login({ email: 'paciente', password: 'paciente123' })}
      >
        Login Paciente
      </button>
      <button
        data-testid="login-estudiante"
        onClick={() => login({ email: 'estudiante', password: 'estudiante123' })}
      >
        Login Estudiante
      </button>
      <button
        data-testid="login-profesor"
        onClick={() => login({ email: 'profesor', password: 'profesor123' })}
      >
        Login Profesor
      </button>
      <button
        data-testid="login-bad"
        onClick={() => login({ email: 'bad', password: 'wrong' }).catch(() => {})}
      >
        Login Bad
      </button>
      <button
        data-testid="complete-registration"
        onClick={() => completeRegistration().catch(() => {})}
      >
        Complete registration
      </button>
    </div>
  );
};

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthTestConsumer />
    </AuthProvider>
  );
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  // Limpiar localStorage antes de cada prueba
  localStorage.clear();
  // Modo mock activo (por defecto)
  localStorage.setItem('healthdocs_use_mock_api', 'true');
  // Resetear la base de datos mock
  mockBackendService.resetDatabase();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── 1. Login de cada rol ─────────────────────────────────────────────────────

describe('Login — cada rol', () => {
  it('login como paciente devuelve user con role paciente', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-paciente'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('paciente');
      expect(screen.getByTestId('role').textContent).toBe('patient');
      expect(screen.getByTestId('token').textContent).toBe('present');
    });
  });

  it('login como estudiante devuelve user con role estudiante', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-estudiante'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('estudiante');
      expect(screen.getByTestId('role').textContent).toBe('researcher');
    });
  });

  it('login como profesor devuelve user con role profesor', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-profesor'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('profesor');
      expect(screen.getByTestId('role').textContent).toBe('coordinator');
    });
  });

  it('login con credenciales incorrectas lanza error 401 y no autentica', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('login-bad'));
    });

    // La UI queda sin usuario autenticado
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });
  });
});

// ─── 2. Restauración de sesión via GET /me ────────────────────────────────────

describe('Restauración de sesión', () => {
  it('con token válido en localStorage → restaura sesión via getMe', async () => {
    // Simular que ya había un login previo
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    renderAuth();

    // Debe iniciar en loading=true y luego resolver
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('paciente');
      expect(screen.getByTestId('role').textContent).toBe('paciente');
      expect(screen.getByTestId('token').textContent).toBe('present');
    });
  });

  it('sin token en localStorage → no hay sesión y no dispara errores', async () => {
    // localStorage vacío (sin token)
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });
  });
});

describe('Registro de Healthdocs', () => {
  it('provisiona la cuenta y después carga el perfil con GET /me', async () => {
    const profile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'nuevo@example.com',
      role: 'patient' as const,
      enabled: true,
    };
    const register = vi.spyOn(apiClient.auth, 'register').mockResolvedValue(profile);
    const getMe = vi.spyOn(apiClient.auth, 'getMe').mockResolvedValue(profile);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('complete-registration'));
    });

    expect(register).toHaveBeenCalledOnce();
    expect(getMe).toHaveBeenCalledOnce();
    expect(register.mock.invocationCallOrder[0]).toBeLessThan(getMe.mock.invocationCallOrder[0]);
    expect(screen.getByTestId('user').textContent).toBe(profile.email);
    expect(screen.getByTestId('role').textContent).toBe('patient');
  });
});

// ─── 3. Token inválido o expirado ─────────────────────────────────────────────

describe('Token inválido o expirado', () => {
  it('un token basura en localStorage → cierra sesión al intentar getMe', async () => {
    // Poner un token inválido
    localStorage.setItem('healthdocs_jwt_token', 'token_invalido_xxxxxxxxxxx');

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      // El token se limpia y el usuario queda sin sesión
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    // El token también se borra del localStorage
    expect(getStoredToken()).toBeNull();
  });

  it('MockHttpError 401 de getMe → limpia token y usuario', async () => {
    // Poner un token válido, luego mockear getMe para lanzar 401
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    vi.spyOn(mockBackendService, 'getMe').mockRejectedValueOnce(
      new MockHttpError(401, 'UNAUTHORIZED', 'Token expirado')
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    expect(getStoredToken()).toBeNull();
  });

  it('token mock expirado en localStorage → se rechaza y limpia antes de restaurar sesión', async () => {
    const expiredPayload = {
      sub: 'b0000001-0000-0000-0000-000000000001',
      role: 'patient',
      email: 'paciente',
      exp: Math.floor(Date.now() / 1000) - 3600,
    };
    const expiredToken = `mock_jwt_${btoa(JSON.stringify(expiredPayload))}`;
    localStorage.setItem('healthdocs_jwt_token', expiredToken);

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    expect(getStoredToken()).toBeNull();
  });

  it('operaciones mock rechazan tokens mock expirados con 401 UNAUTHORIZED', async () => {
    const expiredPayload = {
      sub: 'b0000001-0000-0000-0000-000000000001',
      role: 'patient',
      email: 'paciente',
      exp: Math.floor(Date.now() / 1000) - 10,
    };
    const expiredToken = `mock_jwt_${btoa(JSON.stringify(expiredPayload))}`;

    await expect(mockBackendService.getMe(expiredToken)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Token expirado',
    });

    await expect(
      mockBackendService.createCase(expiredToken, { studyName: 'Radiografía de tórax' })
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Token expirado',
    });
  });
});

// ─── 4. Respuesta 403 ─────────────────────────────────────────────────────────

describe('Respuesta 403', () => {
  it('403 en getMe → mantiene el token pero muestra mensaje de permisos', async () => {
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    vi.spyOn(mockBackendService, 'getMe').mockRejectedValueOnce(
      new MockHttpError(403, 'FORBIDDEN', 'Cuenta no habilitada')
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      // El usuario NO se autentica (getMe rechazó), pero el TOKEN no se borra
      expect(getStoredToken()).not.toBeNull();
      // Se muestra el mensaje de forbidden
      expect(screen.getByTestId('forbidden').textContent).toContain('Cuenta no habilitada');
    });
  });

  it('403 en getMe → NO dispara evento healthdocs_unauthorized', async () => {
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    vi.spyOn(mockBackendService, 'getMe').mockRejectedValueOnce(
      new MockHttpError(403, 'FORBIDDEN', 'Sin rol habilitado')
    );

    const unauthorizedSpy = vi.fn();
    window.addEventListener('healthdocs_unauthorized', unauthorizedSpy);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(unauthorizedSpy).not.toHaveBeenCalled();
    window.removeEventListener('healthdocs_unauthorized', unauthorizedSpy);
  });
});

// ─── 5. Error de red ──────────────────────────────────────────────────────────

describe('Error de red en getMe', () => {
  it('error de red (TypeError) → mantiene el token, no cierra sesión', async () => {
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    // Simular error de red
    vi.spyOn(mockBackendService, 'getMe').mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      // El token NO se borra en error de red
      expect(getStoredToken()).not.toBeNull();
      // No hay mensaje de forbidden (solo es un error de red)
      expect(screen.getByTestId('forbidden').textContent).toBe('null');
    });
  });
});

// ─── 6. Verificar credenciales alineadas al backend ──────────────────────────

describe('Credenciales alineadas con el backend', () => {
  it('TEST_USERS tiene credenciales sin dominio de email', () => {
    for (const u of TEST_USERS) {
      expect(u.email).not.toContain('@');
      expect(u.email).not.toContain('.local');
    }
  });

  it('cada rol tiene su contraseña correcta', () => {
    const paciente = TEST_USERS.find((u) => u.user.role === 'patient');
    expect(paciente?.email).toBe('paciente');
    expect(paciente?.password).toBe('paciente123');

    const estudiante = TEST_USERS.find((u) => u.user.role === 'researcher');
    expect(estudiante?.email).toBe('estudiante');
    expect(estudiante?.password).toBe('estudiante123');

    const profesor = TEST_USERS.find((u) => u.user.role === 'coordinator');
    expect(profesor?.email).toBe('profesor');
    expect(profesor?.password).toBe('profesor123');
  });

  it('todos los TEST_USERS tienen enabled: true según contrato OpenAPI 0.2.1', () => {
    for (const u of TEST_USERS) {
      expect(u.user.enabled).toBe(true);
    }
  });
});

// ─── 7. Logout ───────────────────────────────────────────────────────────────

describe('Logout', () => {
  it('logout limpia usuario, token y localStorage', async () => {
    const loginRes = await mockBackendService.login({ email: 'paciente', password: 'paciente123' });
    setStoredToken(loginRes.token);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('paciente'));

    await act(async () => {
      await userEvent.click(screen.getByTestId('logout-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    expect(getStoredToken()).toBeNull();
  });
});
