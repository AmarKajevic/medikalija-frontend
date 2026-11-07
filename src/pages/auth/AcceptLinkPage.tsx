import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { LuCircleAlert, LuLink2Off } from "react-icons/lu";
import { api } from "@shared/api/api";
import { useAuth } from "@app/providers/AuthContext";
import { paths } from "@app/paths";
import { roleLabel } from "@shared/lib/format";
import Spinner from "@shared/ui/feedback/Spinner";
import { ButtonLink } from "@shared/ui/button/Button";
import { useFacility } from "@entities/facility/facility";
import { serverMessage } from "@features/auth/model";
import NewPasswordForm from "@features/auth/ui/NewPasswordForm";
import GoogleSignInButton from "@features/auth/ui/GoogleSignInButton";
import AuthShell from "./AuthShell";

interface LinkInfo {
  purpose: "invite" | "reset";
  expiresAt: string;
  name: string;
  lastName: string;
  email: string | null;
  username: string | null;
  role: string;
  invitedBy: string | null;
  google: boolean;
}

// Prihvatanje pozivnice (/invite/:token) i nova lozinka (/reset-password/:token).
export default function AcceptLinkPage() {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login, user: current, logout } = useAuth();
  const { facility } = useFacility();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: link, isLoading, error: loadError } = useQuery({
    queryKey: ["authLink", token],
    queryFn: async () => (await api.get(`/api/auth/link/${token}`)).data.link as LinkInfo,
    retry: false,
  });
  const config = useQuery({
    queryKey: ["authConfig"],
    queryFn: async () => (await api.get("/api/auth/config")).data as { googleClientId: string | null },
    staleTime: 60 * 60_000,
  });

  const finish = async (data: { user: Parameters<typeof login>[0]; accessToken: string }) => {
    // Drugi nalog na istom računaru (npr. admin proverava link) se prvo odjavljuje
    if (current && String(current._id) !== String(data.user._id)) await logout();
    login(data.user, data.accessToken);
    navigate(paths.home, { replace: true });
  };

  const accept = async (password: string) => {
    setError(null);
    setSaving(true);
    try {
      const { data } = await api.post(`/api/auth/link/${token}`, { password });
      await finish(data);
    } catch (err) {
      setError(serverMessage(err, "Lozinka nije sačuvana. Pokušajte ponovo."));
    } finally {
      setSaving(false);
    }
  };

  const google = async (credential: string) => {
    setError(null);
    try {
      const { data } = await api.post("/api/auth/google", { credential, inviteToken: token });
      await finish(data);
    } catch (err) {
      setError(serverMessage(err, "Google prijava nije uspela."));
    }
  };

  if (isLoading) {
    return (
      <AuthShell title="Učitavanje...">
        <Spinner />
      </AuthShell>
    );
  }

  if (loadError || !link) {
    return (
      <AuthShell title="Link nije važeći" description={serverMessage(loadError, "Link je istekao ili je već iskorišćen.")}>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800">
          <LuLink2Off className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Zatražite novi link od uprave doma. Ako već imate nalog, prijavite se.</p>
          <ButtonLink to={paths.signIn} variant="outline" size="sm">
            Na prijavu
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }

  const invite = link.purpose === "invite";
  const loginWith = link.email ?? link.username;

  return (
    <AuthShell
      title={invite ? `Dobro došli, ${link.name}` : "Nova lozinka"}
      description={
        invite ? (
          <>
            {link.invitedBy ? `${link.invitedBy} vas poziva` : "Pozvani ste"} da koristite aplikaciju doma <strong className="font-medium text-gray-700 dark:text-gray-200">{facility.name}</strong> kao{" "}
            <strong className="font-medium text-gray-700 dark:text-gray-200">{roleLabel(link.role).toLowerCase()}</strong>.
          </>
        ) : (
          `${link.name} ${link.lastName}, postavite novu lozinku. Posle toga ste odjavljeni sa svih ostalih uređaja.`
        )
      }
      footer={<Link to={paths.signIn} className="font-medium text-brand-600 hover:underline dark:text-brand-400">Već imate nalog? Prijavite se</Link>}
    >
      <div className="space-y-5">
        {loginWith && (
          <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
            Prijavljivaćete se sa: <strong className="font-medium text-gray-900 dark:text-white">{loginWith}</strong>
          </p>
        )}
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {invite && config.data?.googleClientId && (
          <>
            <GoogleSignInButton clientId={config.data.googleClientId} onCredential={google} />
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" /> ili postavite lozinku <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
          </>
        )}
        <NewPasswordForm
          submitLabel={invite ? "Aktiviraj nalog" : "Sačuvaj novu lozinku"}
          loading={saving}
          personal={[link.name, link.lastName, link.username ?? "", link.email?.split("@")[0] ?? ""]}
          onSubmit={accept}
        />
        <p className="text-center text-xs text-gray-400">
          Link važi do {new Date(link.expiresAt).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}.
        </p>
      </div>
    </AuthShell>
  );
}
