import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import SignInForm from "@features/auth/ui/SignInForm";
import AuthShell from "./AuthShell";

export default function SignInPage() {
  const { user } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={paths.home} replace />;
  const idle = (location.state as { reason?: string } | null)?.reason === "idle";
  return (
    <AuthShell
      title="Prijava"
      description="Prijavite se e-mailom ili korisničkim imenom koje ste dobili u pozivnici."
      footer={
        <>
          Nemate nalog? Pristup dobijate pozivnicom uprave doma.
          <br />
          <Link to={paths.forgotPassword} className="mt-2 inline-block font-medium text-brand-600 hover:underline dark:text-brand-400">
            Zaboravljena lozinka?
          </Link>
        </>
      }
    >
      {idle && (
        <p role="status" className="mb-5 rounded-lg border border-blue-light-100 bg-blue-light-50 px-3 py-2.5 text-sm text-gray-700 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-gray-200">
          Odjavljeni ste jer niste ništa radili 30 minuta. Prijavite se ponovo.
        </p>
      )}
      <SignInForm />
    </AuthShell>
  );
}
