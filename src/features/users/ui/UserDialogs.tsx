import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { LuCheck, LuCircleAlert, LuCopy, LuMail, LuSend, LuUser } from "react-icons/lu";
import { api } from "@shared/api/api";
import { serverMessage, useAuthConfig } from "@features/auth/model";
import Dialog from "@shared/ui/dialog/Dialog";
import Button from "@shared/ui/button/Button";
import Field from "@shared/ui/form/Field";
import { Input, Select } from "@shared/ui/form/controls";
import { notify } from "@shared/lib/notify";
import { IssuedLink, ManagedUser, ROLES, useAddStaff, useInviteUser, useUpdateUser, useUserLink } from "@features/users/model";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;

/** Predlog korisničkog imena iz imena i prezimena: "Sanja Petrović" → "sanja.p" */
const suggestUsername = (name: string, lastName: string) =>
  `${name}.${lastName.slice(0, 1)}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9.]/g, "");

// ---------- Pozovi korisnika ----------
type Existing = { _id: string; name: string; lastName: string; status: "invited" | "active" | "suspended"; canLogin: boolean };

export function InviteDialog({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: (user: Pick<ManagedUser, "name" | "lastName" | "email">, link: IssuedLink) => void }) {
  const formId = useId();
  const invite = useInviteUser();
  const update = useUpdateUser();
  const link = useUserLink();
  const [conflict, setConflict] = useState<{ message: string; existing: Existing } | null>(null);
  const [form, setForm] = useState({ name: "", lastName: "", role: "nurse", method: "email" as "email" | "username", email: "", username: "" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (open) setForm({ name: "", lastName: "", role: "nurse", method: "email", email: "", username: "" });
    setConflict(null);
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) return notify.error("Unesite ime i prezime.");
    if (form.method === "email" && !EMAIL.test(form.email.trim())) return notify.error("Unesite ispravnu e-mail adresu.");
    if (form.method === "username" && !USERNAME.test(form.username.trim().toLowerCase())) return notify.error("Korisničko ime: 3–30 znakova, mala slova, brojevi i tačka.");
    invite.mutate(
      {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        ...(form.method === "email" ? { email: form.email.trim() } : { username: form.username.trim().toLowerCase() }),
      },
      {
        onSuccess: (res) => onInvited(res.user, res.invite),
        onError: (err) => {
          const res = (err as { response?: { status?: number; data?: { message?: string; existing?: Existing } } }).response;
          if (res?.status === 409 && res.data?.existing) setConflict({ message: res.data.message ?? "", existing: res.data.existing });
          else notify.error(err);
        },
      }
    );
  };

  // Ponuđena rešenja kad adresa već pripada nekome
  const restore = (e: Existing) =>
    update.mutate(
      { id: e._id, status: "active" },
      {
        onSuccess: () => {
          notify.success(`${e.name} ${e.lastName} ponovo ima pristup.`);
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  const reinvite = (e: Existing) =>
    link.mutate(
      { id: e._id, kind: "invite" },
      { onSuccess: (l) => onInvited({ name: e.name, lastName: e.lastName, email: form.email.trim() || null }, l), onError: (err) => notify.error(err) }
    );

  const id = (k: string) => `${formId}-${k}`;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Pozovi korisnika"
      description="Osoba dobija link kojim aktivira nalog. Niko ne može da se registruje sam."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={invite.isPending}>
            Napravi pozivnicu
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        {conflict && (
          <div role="alert" className="space-y-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
            <p className="flex gap-2">
              <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {conflict.message}
            </p>
            {conflict.existing.canLogin && conflict.existing.status !== "active" && (
              <div className="flex flex-wrap gap-2 pl-6">
                {conflict.existing.status === "suspended" && (
                  <Button type="button" size="xs" loading={update.isPending} onClick={() => restore(conflict.existing)}>
                    Vrati pristup: {conflict.existing.name} {conflict.existing.lastName}
                  </Button>
                )}
                {conflict.existing.status === "invited" && (
                  <Button type="button" size="xs" loading={link.isPending} onClick={() => reinvite(conflict.existing)}>
                    Pošalji novu pozivnicu
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ime" htmlFor={id("n")}>
            <Input id={id("n")} autoFocus value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Prezime" htmlFor={id("l")}>
            <Input id={id("l")} value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Uloga" htmlFor={id("r")} hint="Određuje šta osoba vidi i sme da radi u aplikaciji.">
          <Select id={id("r")} value={form.role} onChange={(e) => set({ role: e.target.value })}>
            {ROLES.filter((r) => r.login).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="space-y-3">
          <legend className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Kako će se prijavljivati</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["email", <LuMail key="m" className="h-4 w-4" />, "E-mail adresom", "Može i prijava Google-om"],
                ["username", <LuUser key="u" className="h-4 w-4" />, "Korisničkim imenom", "Za osoblje bez e-maila"],
              ] as const
            ).map(([value, icon, label, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  form.method === value ? "border-brand-400 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10" : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  className="sr-only"
                  checked={form.method === value}
                  onChange={() => set({ method: value, username: form.username || suggestUsername(form.name, form.lastName) })}
                />
                <span className="mt-0.5 text-gray-500">{icon}</span>
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {form.method === "email" ? (
            <Field label="E-mail" htmlFor={id("e")}>
              <Input id={id("e")} type="email" autoComplete="off" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="ime@primer.rs" />
            </Field>
          ) : (
            <Field label="Korisničko ime" htmlFor={id("u")} hint="Mala slova, brojevi i tačka, npr. sanja.p">
              <Input id={id("u")} autoComplete="off" autoCapitalize="none" value={form.username} onChange={(e) => set({ username: e.target.value.toLowerCase() })} placeholder="sanja.p" />
            </Field>
          )}
        </fieldset>
      </form>
    </Dialog>
  );
}

// ---------- Link (pozivnica ili nova lozinka) za kopiranje ----------
export function LinkDialog({ link, title, person, email: knownEmail, onClose }: { link: IssuedLink | null; title: string; person: string; email?: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: config } = useAuthConfig();
  useEffect(() => {
    setCopied(false);
    setEmail(knownEmail ?? "");
  }, [link, knownEmail]);

  // Server šalje mejl ako je podešen; inače se otvara mejl program sa gotovom porukom
  const sendToEmail = async () => {
    if (!link) return;
    const to = email.trim();
    if (!EMAIL.test(to)) return notify.error("Unesite ispravnu e-mail adresu.");
    if (!config?.emailEnabled) {
      openComposer(to, link);
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/api/auth/links/send", { url: link.url, email: to });
      notify.success(data.message);
    } catch (err) {
      notify.error(serverMessage(err, "Mejl nije poslat."));
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
    } catch {
      inputRef.current?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    notify.success("Link je kopiran.");
  };

  return (
    <Dialog open={!!link} onClose={onClose} size="md" title={title} footer={<Button size="sm" onClick={onClose}>Gotovo</Button>}>
      {link && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {link.emailSent ? (
              <>
                Link je poslat mejlom osobi <strong>{person}</strong>. Možete ga i kopirati i poslati drugim putem.
              </>
            ) : (
              <>
                Pošaljite ovaj link osobi <strong>{person}</strong> — porukom, Viberom ili lično. Otvara se na telefonu ili računaru.
              </>
            )}
          </p>
          <div className="flex gap-2" data-no-translit>
            <Input ref={inputRef} readOnly value={link.url} aria-label="Link" onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
            <Button variant={copied ? "outline" : "primary"} startIcon={copied ? <LuCheck className="h-4 w-4" /> : <LuCopy className="h-4 w-4" />} onClick={copy}>
              {copied ? "Kopirano" : "Kopiraj"}
            </Button>
          </div>
          <div className="space-y-1.5 border-t border-gray-100 pt-4 dark:border-gray-800">
            <label htmlFor="link-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pošalji na e-mail
            </label>
            <div className="flex gap-2">
              <Input
                id="link-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@primer.rs"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  void sendToEmail();
                }}
              />
              <Button variant="outline" startIcon={<LuSend className="h-4 w-4" />} loading={sending} onClick={() => void sendToEmail()}>
                {config?.emailEnabled ? "Pošalji" : "Otvori u mejlu"}
              </Button>
            </div>
            {config && !config.emailEnabled && (
              <p className="text-xs text-gray-500">Otvara se Gmail (na telefonu mejl aplikacija) sa gotovom porukom i linkom. Samo kliknete „Pošalji”.</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Važi do {new Date(link.expiresAt).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} i može se iskoristiti samo jednom. Novi link poništava prethodni.
          </p>
        </div>
      )}
    </Dialog>
  );
}

/** Gotova poruka sa linkom (kad server nema podešeno slanje mejlova) */
function messageFor(link: IssuedLink) {
  const invite = link.url.includes("/invite/");
  const subject = invite ? "Pozivnica za aplikaciju doma" : "Link za novu lozinku";
  const until = new Date(link.expiresAt).toLocaleString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const body = [
    "Zdravo,",
    "",
    invite ? "pozivam vas da koristite aplikaciju doma. Otvorite link i postavite svoju lozinku:" : "otvorite link i postavite novu lozinku:",
    link.url,
    "",
    `Link važi do ${until} i može se iskoristiti samo jednom.`,
  ].join("\n");
  return { subject, body };
}

/**
 * Telefon: mailto otvara mejl aplikaciju. Računar: mailto radi samo ako je instaliran
 * mejl program (Outlook…), pa se umesto toga otvara Gmail u novoj kartici.
 */
function openComposer(to: string, link: IssuedLink) {
  const { subject, body } = messageFor(link);
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch) {
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return;
  }
  const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  window.open(`https://mail.google.com/mail/?${params}`, "_blank", "noopener");
}

// ---------- Promena uloge ----------
export function RoleDialog({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  const update = useUpdateUser();
  const [role, setRole] = useState("");
  useEffect(() => setRole(user?.role ?? ""), [user]);
  const options = ROLES.filter((r) => r.login === (user ? ROLES.find((x) => x.value === user.role)?.login ?? true : true));
  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      size="sm"
      title="Promena uloge"
      description={user ? `${user.name} ${user.lastName}` : ""}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button
            size="sm"
            loading={update.isPending}
            disabled={!user || role === user.role}
            onClick={() =>
              user &&
              update.mutate(
                { id: user._id, role },
                {
                  onSuccess: () => {
                    notify.success("Uloga je promenjena.");
                    onClose();
                  },
                  onError: (err) => notify.error(err),
                }
              )
            }
          >
            Sačuvaj
          </Button>
        </>
      }
    >
      <Field label="Uloga" htmlFor="role-select" hint="Promena važi odmah, i u otvorenoj sesiji posle osvežavanja.">
        <Select id="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
          {options.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}

// ---------- Izmena podataka (ime, e-mail, korisničko ime) ----------
export function EditUserDialog({ user, onClose }: { user: ManagedUser | null; onClose: () => void }) {
  const formId = useId();
  const update = useUpdateUser();
  const [form, setForm] = useState({ name: "", lastName: "", email: "", username: "" });
  useEffect(() => setForm({ name: user?.name ?? "", lastName: user?.lastName ?? "", email: user?.email ?? "", username: user?.username ?? "" }), [user]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.email.trim() && !EMAIL.test(form.email.trim())) return notify.error("E-mail adresa nije ispravna.");
    update.mutate(
      { id: user._id, name: form.name.trim(), lastName: form.lastName.trim(), email: form.email.trim(), username: form.username.trim().toLowerCase() },
      {
        onSuccess: () => {
          notify.success("Podaci su sačuvani.");
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };
  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      size="md"
      title="Izmena podataka"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={update.isPending}>
            Sačuvaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Ime" htmlFor={`${formId}-n`}>
          <Input id={`${formId}-n`} value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Prezime" htmlFor={`${formId}-l`}>
          <Input id={`${formId}-l`} value={form.lastName} onChange={set("lastName")} />
        </Field>
        <Field label="E-mail" htmlFor={`${formId}-e`} hint="Za prijavu i Google">
          <Input id={`${formId}-e`} type="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Korisničko ime" htmlFor={`${formId}-u`} hint="Za prijavu bez e-maila">
          <Input id={`${formId}-u`} autoCapitalize="none" value={form.username} onChange={set("username")} />
        </Field>
      </form>
    </Dialog>
  );
}

// ---------- Osoblje bez pristupa (evidencija) ----------
export function StaffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const formId = useId();
  const add = useAddStaff();
  const [form, setForm] = useState({ name: "", lastName: "", role: "Caregiver" });
  useEffect(() => {
    if (open) setForm({ name: "", lastName: "", role: "Caregiver" });
  }, [open]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) return notify.error("Unesite ime i prezime.");
    add.mutate(
      { name: form.name.trim(), lastName: form.lastName.trim(), role: form.role },
      {
        onSuccess: () => {
          notify.success("Dodato u evidenciju osoblja.");
          onClose();
        },
        onError: (err) => notify.error(err),
      }
    );
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="md"
      title="Osoblje bez pristupa"
      description="Vodi se u evidenciji osoblja, bez prijave u aplikaciju."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Otkaži
          </Button>
          <Button size="sm" type="submit" form={formId} loading={add.isPending}>
            Dodaj
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Ime" htmlFor={`${formId}-n`}>
          <Input id={`${formId}-n`} autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Prezime" htmlFor={`${formId}-l`}>
          <Input id={`${formId}-l`} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
        </Field>
        <Field label="Posao" htmlFor={`${formId}-r`} className="sm:col-span-2">
          <Select id={`${formId}-r`} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLES.filter((r) => !r.login).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Dialog>
  );
}
