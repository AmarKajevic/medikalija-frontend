import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { LuBuilding2, LuFileText, LuImage, LuTrash2, LuUpload } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card, CardBody, CardFooter, CardHeader } from "@shared/ui/card/Card";
import Field from "@shared/ui/form/Field";
import { Input } from "@shared/ui/form/controls";
import Button from "@shared/ui/button/Button";
import { PageLoader } from "@shared/ui/feedback/Spinner";
import { ErrorState } from "@shared/ui/feedback/EmptyState";
import { notify } from "@shared/lib/notify";
import { resizeImageToDataUrl } from "@shared/lib/resizeImage";
import { BrandIcon } from "@widgets/shell/BrandMark";
import { Facility, facilityContactLine, useFacility, useUpdateFacility } from "@entities/facility/facility";

type TextField = Exclude<keyof Facility, "logo">;

interface FieldDef {
  key: TextField;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
}

const SECTIONS: Array<{ title: string; description: string; icon: React.ReactNode; fields: FieldDef[] }> = [
  {
    title: "Naziv",
    description: "Prikazuje se u meniju, na stranici za prijavu i na specifikaciji.",
    icon: <LuBuilding2 />,
    fields: [
      { key: "name", label: "Naziv ustanove", placeholder: "npr. Dom Sunce" },
      { key: "subtitle", label: "Vrsta ustanove", placeholder: "npr. Dom za stara lica" },
    ],
  },
  {
    title: "Podaci za specifikaciju",
    description: "Ispisuju se u zaglavlju PDF-a koji dobija porodica. Popunite samo ono što želite da se vidi.",
    icon: <LuFileText />,
    fields: [
      { key: "address", label: "Adresa", placeholder: "Ulica i broj" },
      { key: "city", label: "Mesto", placeholder: "npr. 21000 Novi Sad" },
      { key: "taxId", label: "PIB" },
      { key: "registrationNumber", label: "Matični broj" },
      { key: "phone", label: "Telefon", type: "tel" },
      { key: "email", label: "E-mail", type: "email" },
      { key: "website", label: "Sajt", placeholder: "www.primer.rs" },
      { key: "bankAccount", label: "Tekući račun", hint: "Za uplatu; ispisuje se ispod obračuna.", placeholder: "160-0000000000000-00" },
    ],
  },
];

export default function FacilitySettingsPage() {
  const formId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError, refetch } = useFacility();
  const update = useUpdateFacility();
  const [form, setForm] = useState<Facility | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message="Podešavanja nisu učitana." onRetry={() => refetch()} />;
  if (!form) return <PageLoader />;

  const dirty = !!data && (Object.keys(form) as Array<keyof Facility>).some((k) => form[k] !== data[k]);
  const set = (key: keyof Facility, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const pickLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      set("logo", await resizeImageToDataUrl(file));
    } catch (err) {
      notify.error(err, "Slika nije učitana.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return notify.error("Naziv ustanove je obavezan.");
    update.mutate(form, {
      onSuccess: () => notify.success("Podešavanja su sačuvana."),
      onError: (err) => notify.error(err),
    });
  };

  const contact = facilityContactLine(form);

  return (
    <>
      <PageHeader title="Podešavanja ustanove" description="Naziv, logo i podaci koji se prikazuju u aplikaciji i na specifikacijama." />

      <form id={formId} onSubmit={onSubmit} className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader icon={<LuImage />} title="Logo" description="PNG ili JPG, najbolje sa providnom pozadinom. Smanjuje se automatski." />
            <CardBody className="flex flex-wrap items-center gap-5">
              <div className="flex h-24 w-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-white/[0.03]">
                {form.logo ? (
                  <img src={form.logo} alt="Logo ustanove" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Nema logoa</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-label="Izaberi logo"
                  tabIndex={-1}
                  onChange={(e) => void pickLogo(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" startIcon={<LuUpload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
                  {form.logo ? "Promeni logo" : "Dodaj logo"}
                </Button>
                {form.logo && (
                  <Button type="button" variant="ghost" size="sm" startIcon={<LuTrash2 className="h-4 w-4" />} onClick={() => set("logo", "")}>
                    Ukloni logo
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <CardHeader icon={section.icon} title={section.title} description={section.description} />
              <CardBody className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <Field key={f.key} label={f.label} htmlFor={`${formId}-${f.key}`} hint={f.hint}>
                    <Input
                      id={`${formId}-${f.key}`}
                      type={f.type ?? "text"}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      required={f.key === "name"}
                    />
                  </Field>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Pregled: ovako izgleda vrh specifikacije */}
        <div className="xl:sticky xl:top-20">
          <Card>
            <CardHeader title="Pregled" description="Zaglavlje specifikacije" />
            <CardBody>
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-900 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  {form.logo ? (
                    <img src={form.logo} alt="" className="h-12 max-w-[120px] object-contain" />
                  ) : (
                    <BrandIcon className="h-10 w-10 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{form.name || "Naziv ustanove"}</p>
                    {form.subtitle && <p className="truncate text-xs text-gray-500">{form.subtitle}</p>}
                  </div>
                </div>
                {contact && <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-500">{contact}</p>}
              </div>
            </CardBody>
            <CardFooter>
              {dirty && <span className="mr-auto text-xs text-warning-600 dark:text-warning-400">Nesačuvane izmene</span>}
              <Button type="submit" form={formId} loading={update.isPending} disabled={!dirty}>
                Sačuvaj
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </>
  );
}
