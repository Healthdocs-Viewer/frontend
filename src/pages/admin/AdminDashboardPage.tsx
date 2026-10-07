import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";

export function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-5 lg:p-8">
      <h1 className="text-2xl font-semibold text-content">Administración</h1>
      <Card className="mt-6 shadow-none">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-content">Panel en preparación</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Tu cuenta tiene el rol de administrador. Las funciones de administración
              estarán disponibles cuando definamos sus permisos y flujos.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
