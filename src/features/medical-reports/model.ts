import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export type ReportType = "exam" | "control" | "admission" | "specialist" | "discharge" | "other";

export const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: "exam", label: "Pregled" },
  { value: "control", label: "Kontrolni pregled" },
  { value: "admission", label: "Prijemni pregled" },
  { value: "specialist", label: "Nalaz specijaliste" },
  { value: "discharge", label: "Otpusni izveštaj" },
  { value: "other", label: "Ostalo" },
];
export const reportTypeLabel = (t: ReportType) => REPORT_TYPES.find((x) => x.value === t)?.label ?? t;

export interface Diagnosis {
  code: string;
  name: string;
}

export interface Vitals {
  bloodPressure: string;
  pulse: number | null;
  temperature: number | null;
  spo2: number | null;
  glucose: number | null;
  weight: number | null;
}

interface Person {
  _id: string;
  name: string;
  lastName: string;
  role?: string;
}

export interface MedicalReport {
  _id: string;
  patient: Person & { dateOfBirth?: string };
  author: Person;
  type: ReportType;
  visitDate: string;
  appointment?: { eventId: string | null; occurrenceStart: string | null };
  vitals: Vitals;
  anamnesis: string;
  findings: string;
  diagnoses: Diagnosis[];
  therapy: string;
  conclusion: string;
  followUp: { date: string | null; note: string };
  status: "draft" | "signed";
  signedAt: string | null;
  addenda: Array<{ _id: string; text: string; author: Person; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

/** Telo zahteva za čuvanje (ono što se uređuje u formi) */
export interface ReportInput {
  patientId?: string;
  type: ReportType;
  visitDate: string;
  appointment?: { eventId: string | null; occurrenceStart: string | null };
  vitals: { bloodPressure: string; pulse: string; temperature: string; spo2: string; glucose: string; weight: string };
  anamnesis: string;
  findings: string;
  diagnoses: Diagnosis[];
  therapy: string;
  conclusion: string;
  followUp: { date: string | null; note: string };
}

// Česte dijagnoze kod korisnika domova za stare (MKB-10). Lista je pomoć pri
// unosu — može se upisati bilo koja šifra i naziv.
export const COMMON_DIAGNOSES: Diagnosis[] = [
  { code: "I10", name: "Esencijalna (primarna) hipertenzija" },
  { code: "I11", name: "Hipertenzivna bolest srca" },
  { code: "I20", name: "Angina pektoris" },
  { code: "I25", name: "Hronična ishemijska bolest srca" },
  { code: "I48", name: "Atrijalna fibrilacija i treperenje" },
  { code: "I50", name: "Srčana insuficijencija" },
  { code: "I63", name: "Infarkt mozga" },
  { code: "I69", name: "Posledice cerebrovaskularne bolesti" },
  { code: "I70", name: "Ateroskleroza" },
  { code: "I83", name: "Proširene vene donjih ekstremiteta" },
  { code: "I95", name: "Hipotenzija" },
  { code: "E11", name: "Dijabetes melitus tip 2" },
  { code: "E10", name: "Dijabetes melitus tip 1" },
  { code: "E03", name: "Hipotireoza" },
  { code: "E78", name: "Poremećaj metabolizma lipoproteina (hiperlipidemija)" },
  { code: "E86", name: "Dehidratacija" },
  { code: "F01", name: "Vaskularna demencija" },
  { code: "F03", name: "Demencija, nespecifikovana" },
  { code: "F32", name: "Depresivna epizoda" },
  { code: "F41", name: "Anksiozni poremećaj" },
  { code: "G20", name: "Parkinsonova bolest" },
  { code: "G30", name: "Alchajmerova bolest" },
  { code: "G40", name: "Epilepsija" },
  { code: "J18", name: "Pneumonija, nespecifikovan uzročnik" },
  { code: "J44", name: "Hronična opstruktivna bolest pluća" },
  { code: "J45", name: "Astma" },
  { code: "N18", name: "Hronična bubrežna bolest" },
  { code: "N39.0", name: "Infekcija urinarnog trakta" },
  { code: "N40", name: "Hiperplazija prostate" },
  { code: "M15", name: "Poliartroza" },
  { code: "M16", name: "Koksartroza" },
  { code: "M17", name: "Gonartroza" },
  { code: "M54", name: "Bol u leđima (dorzalgija)" },
  { code: "M81", name: "Osteoporoza bez patološke frakture" },
  { code: "L89", name: "Dekubitalni ulkus" },
  { code: "R26", name: "Poremećaj hoda i pokretljivosti" },
  { code: "R32", name: "Urinarna inkontinencija" },
  { code: "R15", name: "Fekalna inkontinencija" },
  { code: "R55", name: "Sinkopa i kolaps" },
  { code: "S72", name: "Prelom butne kosti" },
  { code: "K21", name: "Gastroezofagealna refluksna bolest" },
  { code: "K59.0", name: "Opstipacija" },
  { code: "D64", name: "Anemija" },
  { code: "H25", name: "Senilna katarakta" },
  { code: "H40", name: "Glaukom" },
  { code: "Z74", name: "Zavisnost od pomoći druge osobe" },
];

/** Nov izveštaj iz termina u kalendaru (pacijent, vreme i veza sa terminom) */
export function reportUrlForAppointment(o: { patient: { _id: string } | null; eventId: string; occurrenceStart: string; allDay: boolean; start: string; title: string }) {
  const p = new URLSearchParams({ patient: o.patient!._id, eventId: o.eventId, occurrence: o.occurrenceStart, at: o.allDay ? new Date().toISOString() : o.start });
  if (/kontrol/i.test(o.title)) p.set("type", "control");
  return `/reports/new?${p}`;
}

export const MKB_PATTERN = /^[A-Z]\d{2}(\.\d{1,2})?$/;

export const emptyInput = (patientId = "", visitDate = new Date().toISOString()): ReportInput => ({
  patientId,
  type: "exam",
  visitDate,
  appointment: { eventId: null, occurrenceStart: null },
  vitals: { bloodPressure: "", pulse: "", temperature: "", spo2: "", glucose: "", weight: "" },
  anamnesis: "",
  findings: "",
  diagnoses: [],
  therapy: "",
  conclusion: "",
  followUp: { date: null, note: "" },
});

const str = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

export const inputFrom = (r: MedicalReport): ReportInput => ({
  patientId: r.patient._id,
  type: r.type,
  visitDate: r.visitDate,
  appointment: { eventId: r.appointment?.eventId ?? null, occurrenceStart: r.appointment?.occurrenceStart ?? null },
  vitals: {
    bloodPressure: r.vitals?.bloodPressure ?? "",
    pulse: str(r.vitals?.pulse),
    temperature: str(r.vitals?.temperature),
    spo2: str(r.vitals?.spo2),
    glucose: str(r.vitals?.glucose),
    weight: str(r.vitals?.weight),
  },
  anamnesis: r.anamnesis,
  findings: r.findings,
  diagnoses: r.diagnoses.map((d) => ({ code: d.code, name: d.name })),
  therapy: r.therapy,
  conclusion: r.conclusion,
  followUp: { date: r.followUp?.date ?? null, note: r.followUp?.note ?? "" },
});

// ---------- API ----------
export interface ReportQuery {
  patientId?: string;
  mine?: boolean;
  status?: "draft" | "signed";
  from?: string;
  to?: string;
  limit?: number;
}

export const reportKeys = {
  all: ["medicalReports"] as const,
  list: (q: ReportQuery) => ["medicalReports", "list", q] as const,
  one: (id: string) => ["medicalReports", "one", id] as const,
};

export function useReports(q: ReportQuery, enabled = true) {
  return useQuery({
    queryKey: reportKeys.list(q),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (q.patientId) p.set("patientId", q.patientId);
      if (q.mine) p.set("mine", "1");
      if (q.status) p.set("status", q.status);
      if (q.from) p.set("from", q.from);
      if (q.to) p.set("to", q.to);
      if (q.limit) p.set("limit", String(q.limit));
      return (await api.get(`/api/medical-reports?${p}`)).data.reports as MedicalReport[];
    },
    enabled,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.one(id),
    queryFn: async () => (await api.get(`/api/medical-reports/${id}`)).data.report as MedicalReport,
    enabled: !!id,
  });
}

function useStore() {
  const qc = useQueryClient();
  return (report: MedicalReport) => {
    qc.setQueryData(reportKeys.one(report._id), report);
    qc.invalidateQueries({ queryKey: ["medicalReports", "list"] });
  };
}

export function useSaveReport() {
  const store = useStore();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ReportInput }) =>
      (id ? await api.put(`/api/medical-reports/${id}`, input) : await api.post("/api/medical-reports", input)).data.report as MedicalReport,
    onSuccess: store,
  });
}

export function useSignReport() {
  const store = useStore();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/api/medical-reports/${id}/sign`)).data.report as MedicalReport,
    onSuccess: store,
  });
}

export function useAddAddendum() {
  const store = useStore();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => (await api.post(`/api/medical-reports/${id}/addenda`, { text })).data.report as MedicalReport,
    onSuccess: store,
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/api/medical-reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all }),
  });
}
