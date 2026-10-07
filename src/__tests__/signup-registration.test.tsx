import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  completeRegistration: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  authService: { signUp: mocks.signUp },
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ completeRegistration: mocks.completeRegistration }),
}));
vi.mock('../components/auth/OAuthButtons', () => ({ OAuthButtons: () => null }));
vi.mock('../components/auth/AuthLayout', () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => children,
}));

import { SignupPage } from '../pages/auth/SignupPage';

const CurrentPath = () => {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
};

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<div>Inicio Healthdocs</div>} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  );
}

async function fillSignupForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Nombre completo'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Correo electrónico'), 'ada@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'password123');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'password123');
  return user;
}

describe('Registro por email con confirmación de Supabase', () => {
  beforeEach(() => {
    mocks.signUp.mockReset();
    mocks.completeRegistration.mockReset().mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'ada@example.com',
      role: 'patient',
      enabled: true,
    });
  });

  it('si Supabase requiere confirmar el correo, espera y no provisiona todavía', async () => {
    mocks.signUp.mockResolvedValue({ session: null, emailConfirmationRequired: true });
    renderSignup();

    const user = await fillSignupForm();
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/confirma la dirección/i);
    expect(mocks.completeRegistration).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/signup');
  });

  it('si Supabase devuelve sesión, provisiona el perfil y continúa al inicio', async () => {
    mocks.signUp.mockResolvedValue({
      session: { accessToken: 'valid-session-token' },
      emailConfirmationRequired: false,
    });
    renderSignup();

    const user = await fillSignupForm();
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/'));
    expect(mocks.signUp).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    });
    expect(mocks.completeRegistration).toHaveBeenCalledOnce();
  });
});
