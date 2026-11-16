// Radna lista socijalnog radnika: rokovi po Pravilniku (procena, plan, pregled plana) i podsetnici
// iz beleški u jednom spisku, po hitnosti. Čista funkcija (bez Reacta) — lako se testira.
import type { SocialDeadline } from "@features/social/dossier";
import type { SocialNote } from "@features/social/model";

export type TaskFilter = "all" | "overdue" | "week";

export interface SocialTask {
  id: string;
  kind: "deadline" | "followup";
  /** Šta treba uraditi ("Procena", "Pozvati CSR…") */
  title: string;
  /** Dodatni opis ("10 dana od prijema", tekst beleške) */
  detail: string;
  patient: { _id: string; name: string; lastName: string };
  due: Date;
  /** Dana do roka (negativno = kasni) */
  days: number;
  noteId?: string;
}

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Dani do datuma po kalendaru (rok "2026-11-20" je ceo taj dan) */
export function daysFrom(iso: string, now = new Date()) {
  const day = iso.length === 10 || iso.endsWith("T00:00:00.000Z") ? new Date(`${iso.slice(0, 10)}T00:00:00`) : new Date(iso);
  return Math.round((startOfDay(day).getTime() - startOfDay(now).getTime()) / DAY);
}

export function buildSocialTasks(deadlines: SocialDeadline[], followups: SocialNote[], labels: Record<string, string>, now = new Date()): SocialTask[] {
  const tasks: SocialTask[] = [
    ...deadlines.map((d) => ({
      id: `d-${d.patient._id}-${d.kind}`,
      kind: "deadline" as const,
      title: labels[d.kind] ?? d.kind,
      detail: d.basis,
      patient: d.patient,
      due: new Date(d.due),
      days: daysFrom(d.due, now),
    })),
    ...followups
      .filter((n) => n.followUp.date && !n.followUp.done)
      .map((n) => ({
        id: `n-${n._id}`,
        kind: "followup" as const,
        title: n.title || n.text.split("\n")[0]!.slice(0, 80),
        detail: n.title ? n.text.split("\n")[0]!.slice(0, 120) : "",
        patient: n.patient,
        due: new Date(n.followUp.date!),
        days: daysFrom(n.followUp.date!, now),
        noteId: n._id,
      })),
  ];
  return tasks.sort((a, b) => a.days - b.days || a.patient.lastName.localeCompare(b.patient.lastName, "sr"));
}

export const filterTasks = (tasks: SocialTask[], filter: TaskFilter) =>
  filter === "overdue" ? tasks.filter((t) => t.days < 0) : filter === "week" ? tasks.filter((t) => t.days <= 7) : tasks;
