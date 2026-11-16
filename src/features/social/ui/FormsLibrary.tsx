import { useState } from "react";
import { LuDownload, LuFileText } from "react-icons/lu";
import { Card, CardHeader } from "@shared/ui/card/Card";
import Button from "@shared/ui/button/Button";
import { notify } from "@shared/lib/notify";
import { FORM_GROUPS, FormGroup, SOCIAL_FORMS, SocialForm } from "@features/social/forms/catalog";
import { fetchFormTemplate, fillForm } from "@features/social/forms/fillForm";
import { downloadBlob } from "@features/social/lib/wordTemplate";

// Svi obrasci doma kao prazni dokumenti (za ručno popunjavanje ili štampu unapred).
// Popunjen obrazac za korisnika pravi se sa profila korisnika (Socijalno → Dokumentacija).
export default function FormsLibrary() {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (form: SocialForm) => {
    setBusy(form.id);
    try {
      // Bez podataka: polja ostaju prazne linije, a oblici reči kao u originalu ("мој-а")
      const blank = await fillForm(form, await fetchFormTemplate(form), { fields: {}, lists: {}, flags: {} });
      downloadBlob(blank, `${form.number} ${form.title}.docx`.replace(/[\\/:*?"<>|]+/g, " "));
    } catch (err) {
      notify.error(err, "Obrazac nije preuzet.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader icon={<LuFileText />} title="Obrasci doma" description="Prazni obrasci u postupku smeštaja. Popunjene za korisnika pravite na njegovom profilu: Socijalno → Dokumentacija." />
      {(Object.keys(FORM_GROUPS) as FormGroup[]).map((group) => (
        <section key={group} className="border-t border-gray-100 dark:border-gray-800">
          <h4 className="bg-gray-50/70 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-white/[0.02] dark:text-gray-300 sm:px-6">{FORM_GROUPS[group].label}</h4>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {SOCIAL_FORMS.filter((f) => f.group === group).map((form) => (
              <li key={form.id} className="flex items-center gap-3 px-5 py-2.5 sm:px-6">
                <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-gray-400">{form.number}</span>
                <span className="min-w-0 flex-1 text-sm text-gray-900 dark:text-white/90">{form.title}</span>
                <Button size="xs" variant="outline" startIcon={<LuDownload className="h-3.5 w-3.5" />} loading={busy === form.id} disabled={!!busy && busy !== form.id} onClick={() => void download(form)} aria-label={`Preuzmi prazan obrazac: ${form.title}`}>
                  Prazan obrazac
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Card>
  );
}
