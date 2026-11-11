// Štampa procene ili individualnog plana (privremeno, dok ne stignu šabloni ustanove):
// otvara čistu stranicu za papir i dijalog za štampu. Korisnik dobija primerak plana (čl. 16 st. 5).
import { formatDay } from "@shared/lib/calendarDay";
import { DOC_TYPES, DocType, DocumentInput, GOAL_STATUS_LABEL, SocialDocument, SUPPORT_LEVELS } from "@features/social/dossier";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const para = (s: string) => esc(s).replace(/\n/g, "<br>");

export function printSocialDocument({ type, patientName, input, document: doc }: { type: DocType; patientName: string; input: DocumentInput; document: SocialDocument | null }) {
  const meta = DOC_TYPES[type];
  const level = SUPPORT_LEVELS.find((l) => l.value === input.supportLevel);
  const sections = meta.sections
    .filter((s) => input.sections[s.key]?.trim())
    .map((s) => `<h3>${esc(s.label)}</h3><p>${para(input.sections[s.key]!)}</p>`)
    .join("");
  const goals = meta.goals
    ? `<h3>Ciljevi i aktivnosti</h3>
      <table><thead><tr><th>#</th><th>Oblast</th><th>Cilj</th><th>Očekivani ishod</th><th>Aktivnosti</th><th>Odgovorni</th><th>Rok</th>${type === "plan_review" ? "<th>Ishod</th>" : ""}</tr></thead><tbody>
      ${input.goals
        .filter((g) => g.goal.trim())
        .map(
          (g, i) =>
            `<tr><td>${i + 1}</td><td>${esc(g.area ?? "")}</td><td>${para(g.goal)}</td><td>${para(g.outcome)}</td><td>${para(g.activities)}</td><td>${esc(g.responsible)}</td><td>${formatDay(g.due)}</td>${
              type === "plan_review" ? `<td>${esc(GOAL_STATUS_LABEL[g.status] ?? "")}</td>` : ""
            }</tr>`
        )
        .join("")}
      </tbody></table>
      <p><strong>Rok za ponovni pregled:</strong> ${formatDay(input.nextReview) || "—"}</p>`
    : "";

  const html = `<!doctype html><html lang="sr"><head><meta charset="utf-8"><title>${esc(meta.label)} — ${esc(patientName)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; margin: 24mm 18mm; }
  h1 { font-size: 15pt; margin: 0 0 4pt; } h3 { font-size: 11pt; margin: 14pt 0 4pt; }
  .meta { color: #444; margin-bottom: 10pt; } p { margin: 0; line-height: 1.4; }
  table { width: 100%; border-collapse: collapse; margin-top: 4pt; font-size: 10pt; }
  th, td { border: 1px solid #999; padding: 3pt 5pt; text-align: left; vertical-align: top; }
  .sign { display: flex; justify-content: space-between; margin-top: 40pt; gap: 24pt; }
  .sign div { flex: 1; border-top: 1px solid #000; padding-top: 4pt; text-align: center; font-size: 10pt; }
  .draft { color: #b54708; font-weight: bold; }
</style></head><body>
<h1>${esc(meta.label)}</h1>
<div class="meta">Korisnik: <strong>${esc(patientName)}</strong> · Datum: ${formatDay(input.date)}${doc?.status === "final" ? "" : ' · <span class="draft">NACRT</span>'}</div>
${input.participants ? `<p><strong>Učesnici:</strong> ${esc(input.participants)}</p>` : ""}
${level ? `<p><strong>Stepen podrške:</strong> ${esc(level.label)} — ${esc(level.hint)}</p>` : ""}
${sections}
${goals}
<div class="sign"><div>Stručni radnik</div><div>Korisnik / zakonski zastupnik</div></div>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
