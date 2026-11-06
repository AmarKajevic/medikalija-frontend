import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { LuPlus } from "react-icons/lu";
import { useAuth } from "@app/providers/AuthContext";
import { hasRole, SOCIAL_WRITE_ROLES } from "@app/paths";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import Tabs from "@shared/ui/tabs/Tabs";
import Field from "@shared/ui/form/Field";
import { Select } from "@shared/ui/form/controls";
import SearchSelect, { SearchOption } from "@shared/ui/combobox/SearchSelect";
import Avatar from "@shared/ui/avatar/Avatar";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { usePatients } from "@features/patients/hooks/usePatients";
import { SOCIAL_CATEGORIES, SocialCategory, useSocialNotes } from "@features/social/model";
import SocialNotesList from "@features/social/ui/SocialNotesList";
import SocialNoteDialog from "@features/social/ui/SocialNoteDialog";

type View = "followups" | "all";

// Socijalni rad: podsetnici koji čekaju i sve beleške, po pacijentu i vrsti.
export default function SocialPage() {
  const { user } = useAuth();
  const canWrite = hasRole(user?.role, SOCIAL_WRITE_ROLES);
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") as View) || "followups";
  const patientId = params.get("patient") ?? "";
  const category = (params.get("category") as SocialCategory) || undefined;
  const [creating, setCreating] = useState(false);
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const followups = useSocialNotes({ followUp: "open", limit: 500 });
  const all = useSocialNotes({ patientId: patientId || undefined, category, limit: 500 }, view === "all");
  const current = view === "followups" ? followups : all;
  const { data: patientsData } = usePatients();
  const patientOptions: SearchOption[] = useMemo(
    () =>
      ((patientsData?.patients ?? []) as Array<{ _id: string; name: string; lastName: string }>)
        .sort((a, b) => `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`, "sr"))
        .map((p) => ({ value: p._id, label: `${p.lastName} ${p.name}`, icon: <Avatar name={p.name} lastName={p.lastName} size="xs" /> })),
    [patientsData]
  );

  const overdue = (followups.data ?? []).filter((n) => n.followUp.date && new Date(n.followUp.date) < new Date(new Date().setHours(0, 0, 0, 0))).length;

  return (
    <>
      <PageHeader
        title="Socijalni karton"
        description="Razgovori sa korisnicima i porodicom, saradnja sa CSR-om i ustanovama, dokumenta i podsetnici."
        actions={
          canWrite && (
            <Button startIcon={<LuPlus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Nova beleška
            </Button>
          )
        }
      />
      <div className="mb-4">
        <Tabs
          value={view}
          onChange={(v) => setParam("view", v)}
          items={[
            { value: "followups", label: `Podsetnici${followups.data?.length ? ` (${followups.data.length})` : ""}` },
            { value: "all", label: "Sve beleške" },
          ]}
        />
      </div>

      {view === "all" && (
        <Card className="mb-4">
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Pacijent" htmlFor="social-patient">
              <SearchSelect id="social-patient" value={patientId} onChange={(v) => setParam("patient", v)} options={patientOptions} emptyLabel="Svi pacijenti" placeholder="Kucajte ime..." />
            </Field>
            <Field label="Vrsta" htmlFor="social-category">
              <Select id="social-category" value={category ?? ""} onChange={(e) => setParam("category", e.target.value)}>
                <option value="">Sve vrste</option>
                {SOCIAL_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>
      )}

      {view === "followups" && overdue > 0 && (
        <p className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2.5 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {overdue === 1 ? "1 podsetnik kasni." : `${overdue} podsetnika kasni.`}
        </p>
      )}

      {current.isError ? (
        <ErrorState message="Beleške nisu učitane." onRetry={() => current.refetch()} />
      ) : (
        <Card>
          <SocialNotesList
            notes={current.data ?? []}
            loading={current.isLoading}
            showPatient
            emptyText={view === "followups" ? "Nema otvorenih podsetnika." : "Nema beleški za izabrane filtere."}
          />
        </Card>
      )}

      <SocialNoteDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
