import {
  createClient,
  type AuthChangeEvent,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { LoginRequest, LoginResponse } from "../types/api";
import {
  isMockTokenExpired,
  mockBackendService,
  MockHttpError,
} from "./mockApi";

const TOKEN_KEY = "healthdocs_jwt_token";
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER ?? "local";

export interface AuthSession {
  accessToken: string;
}

export interface SignUpResult {
  session: AuthSession | null;
  emailConfirmationRequired: boolean;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
}

export type AuthStateListener = (
  event: AuthChangeEvent | "LOCAL_CHANGED",
  accessToken: string | null,
) => void;

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY para usar Supabase Auth.",
    );
  }

  supabaseClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

function useMockApi(): boolean {
  if (AUTH_PROVIDER !== "local") return false;
  const configured = localStorage.getItem("healthdocs_use_mock_api");
  return configured === null ? true : configured === "true";
}

function notifyForbidden(message: string): void {
  window.dispatchEvent(
    new CustomEvent("healthdocs_forbidden", { detail: { message } }),
  );
}

async function parseLoginError(
  response: Response,
): Promise<Error & { code?: string; status?: number }> {
  let body: { code?: string; message?: string } = {};
  try {
    body = await response.json();
  } catch {
    // Use a stable fallback for non-JSON gateway errors.
  }
  return Object.assign(
    new Error(
      body.message || response.statusText || "No se pudo iniciar sesión.",
    ),
    {
      code: body.code || `HTTP_${response.status}`,
      status: response.status,
    },
  );
}

/** Single frontend boundary for provider-specific authentication and token handling. */
export const authService = {
  get usesManagedProvider(): boolean {
    return AUTH_PROVIDER !== "local";
  },
  get usesSupabaseAuth(): boolean {
    return AUTH_PROVIDER === "supabase";
  },
  isMockSession(token: string): boolean {
    return (
      AUTH_PROVIDER === "local" && useMockApi() && isMockTokenExpired(token)
    );
  },

  async login(credentials: LoginRequest): Promise<AuthSession> {
    if (AUTH_PROVIDER === "supabase") {
      console.log("Hello from authService before supabase login");
      const { data, error } =
        await getSupabaseClient().auth.signInWithPassword(credentials);
      if (error) throw error;
      if (!data.session)
        throw new Error("Supabase no devolvió una sesión válida.");
      return { accessToken: data.session.access_token };
    }
    if (AUTH_PROVIDER !== "local") {
      throw new Error(
        `Proveedor de autenticación frontend no soportado: ${AUTH_PROVIDER}`,
      );
    }

    let result: LoginResponse;
    if (useMockApi()) {
      try {
        result = await mockBackendService.login(credentials);
      } catch (error) {
        if (error instanceof MockHttpError && error.status === 403)
          notifyForbidden(error.message);
        throw error;
      }
    } else {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await parseLoginError(response);
        if (error.status === 403) notifyForbidden(error.message);
        throw error;
      }
      result = (await response.json()) as LoginResponse;
    }

    setStoredToken(result.token);
    window.dispatchEvent(
      new CustomEvent("healthdocs_auth_state_changed", {
        detail: result.token,
      }),
    );
    return { accessToken: result.token };
  },

  async signUp(request: SignUpRequest): Promise<SignUpResult> {
    if (AUTH_PROVIDER !== "supabase") {
      throw new Error("El registro de usuarios está disponible con Supabase Auth.");
    }

    const { data, error } = await getSupabaseClient().auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        // Return to the configured frontend site after the confirmation link.
        // Supabase's auth listener restores the resulting session on app startup.
        emailRedirectTo: window.location.origin,
        data: {
          full_name: request.fullName,
        },
      },
    });
    if (error) throw error;
    return {
      session: data.session ? { accessToken: data.session.access_token } : null,
      emailConfirmationRequired: !data.session,
    };
  },

  async signInWithOAuth(provider: "google" | "azure"): Promise<void> {
    if (AUTH_PROVIDER !== "supabase") {
      throw new Error("El inicio de sesión social requiere Supabase Auth.");
    }

    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        ...(provider === "azure" ? { scopes: "email" } : {}),
      },
    });
    if (error) throw error;
  },

  async logout(): Promise<void> {
    if (AUTH_PROVIDER === "supabase") {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
      return;
    }
    if (AUTH_PROVIDER !== "local") {
      throw new Error(
        `Proveedor de autenticación frontend no soportado: ${AUTH_PROVIDER}`,
      );
    }
    clearStoredToken();
    window.dispatchEvent(
      new CustomEvent("healthdocs_auth_state_changed", { detail: null }),
    );
  },

  async getToken(): Promise<string | null> {
    if (AUTH_PROVIDER === "supabase") {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      return data.session?.access_token ?? null;
    }
    if (AUTH_PROVIDER !== "local") {
      throw new Error(
        `Proveedor de autenticación frontend no soportado: ${AUTH_PROVIDER}`,
      );
    }
    return getStoredToken();
  },

  async getSession(): Promise<AuthSession | null> {
    const accessToken = await this.getToken();
    return accessToken ? { accessToken } : null;
  },

  onAuthStateChange(listener: AuthStateListener): () => void {
    if (AUTH_PROVIDER === "supabase") {
      try {
        const { data } = getSupabaseClient().auth.onAuthStateChange(
          (event, session) => {
            listener(event, session?.access_token ?? null);
          },
        );
        return () => data.subscription.unsubscribe();
      } catch {
        // Missing public configuration is surfaced by login/getToken without crashing React startup.
        return () => undefined;
      }
    }
    if (AUTH_PROVIDER !== "local") return () => undefined;

    const handler = (event: Event) => {
      listener(
        "LOCAL_CHANGED",
        (event as CustomEvent<string | null>).detail ?? null,
      );
    };
    window.addEventListener("healthdocs_auth_state_changed", handler);
    return () =>
      window.removeEventListener("healthdocs_auth_state_changed", handler);
  },
};

// Local-provider compatibility helpers; application code should use authService.
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
