import { ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router";
import { useAuth } from "@app/providers/AuthContext";
import { paths, Role } from "@app/paths";
import { ForbiddenPage } from "@pages/system/StatusPage";

// Neprijavljen korisnik ide na prijavu, a posle nje nazad na traženu stranicu
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={paths.signIn} replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  return roles.includes(user?.role as Role) ? <>{children}</> : <ForbiddenPage />;
}

// Preusmerenje sa starih URL-ova (sačuvani linkovi i obeleživači i dalje rade)
export function LegacyRedirect({ to }: { to: string | ((params: Record<string, string | undefined>) => string) }) {
  const params = useParams();
  return <Navigate to={typeof to === "function" ? to(params) : to} replace />;
}
