import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, UserRound } from "lucide-react";
import { authService } from "../../services/authService";
import { OAuthButtons } from "../../components/auth/OAuthButtons";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { useAuth } from "../../context/AuthContext";

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { completeRegistration } = useAuth();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [registrationPending, setRegistrationPending] = React.useState(false);

  const provisionHealthdocsAccount = async () => {
    await completeRegistration();
    setRegistrationPending(false);
    navigate("/", { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!registrationPending && password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (registrationPending) {
        await provisionHealthdocsAccount();
        return;
      }

      const result = await authService.signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      setPassword("");
      setConfirmPassword("");
      if (result.emailConfirmationRequired) {
        setSuccessMessage(
          "Cuenta creada. Revisa tu correo y confirma la dirección. Al volver a Healthdocs se completará tu perfil si el enlace inicia sesión automáticamente; si no, inicia sesión para terminar el registro.",
        );
      } else {
        setRegistrationPending(true);
        await provisionHealthdocsAccount();
      }
    } catch (error) {
      const apiError = error as { message?: string };
      setErrorMessage(
        error instanceof Error
          ? error.message
          : apiError?.message ||
              (registrationPending
                ? "La cuenta de autenticación ya se creó, pero Healthdocs no pudo terminar el perfil. Reintenta la operación."
                : "No fue posible crear la cuenta. Intenta de nuevo."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Regístrate en Healthdocs Viewer
          </p>
        </div>
        {errorMessage && (
          <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Nombre completo
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required={!registrationPending}
                disabled={registrationPending}
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required={!registrationPending}
                disabled={registrationPending}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required={!registrationPending}
                disabled={registrationPending}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-confirm-password" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                required={!registrationPending}
                disabled={registrationPending}
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la contraseña"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
          >
            {isSubmitting
              ? registrationPending
                ? "Terminando registro…"
                : "Creando cuenta…"
              : registrationPending
                ? "Reintentar creación del perfil"
                : "Crear cuenta"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <OAuthButtons />

        <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
