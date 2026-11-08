import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { paths } from "@app/paths";

export type InventoryKind = "medicine" | "article";

/** Vrsta leka: u specifikaciji se vode kao posebne grupe (tablete pre ampula) */
export type MedicineForm = "oral" | "parenteral";
export const MEDICINE_FORM_LABEL: Record<MedicineForm, string> = {
  oral: "Tablete, kapsule",
  parenteral: "Ampule, rastvori, sol",
};

export interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unitsPerPackage?: number;
  packageCount?: number;
  /** Cena po jedinici (lek: pricePerUnit, artikal: price) */
  price: number;
  /** Samo lekovi */
  form?: MedicineForm;
  updatedAt?: string;
}

// Razlike između lekova i artikala na jednom mestu
export const INVENTORY = {
  medicine: {
    kind: "medicine" as const,
    endpoint: "/api/medicine",
    listKey: ["medicines"],
    listField: "medicines",
    itemField: "medicine",
    priceField: "pricePerUnit",
    title: "Lekovi",
    singular: "lek",
    singularCap: "Lek",
    genitive: "leka",
    unitLabel: "Tableta / doza u pakovanju",
    detailPath: paths.medicine,
    listPath: paths.medicines,
  },
  article: {
    kind: "article" as const,
    endpoint: "/api/articles",
    listKey: ["articles"],
    listField: "articles",
    itemField: "article",
    priceField: "price",
    title: "Artikli",
    singular: "artikal",
    singularCap: "Artikal",
    genitive: "artikla",
    unitLabel: "Komada u pakovanju",
    detailPath: paths.article,
    listPath: paths.articles,
  },
};

export type InventoryConfig = (typeof INVENTORY)[InventoryKind];

export const LOW_STOCK = 10;
export const stockStatus = (qty: number) => (qty <= 0 ? "out" : qty <= LOW_STOCK ? "low" : "ok");

type RawItem = Record<string, unknown> & { _id: string; name: string; quantity?: number; unitsPerPackage?: number; packageCount?: number };

const toItem = (cfg: InventoryConfig, raw: RawItem): InventoryItem => ({
  _id: raw._id,
  name: raw.name,
  quantity: Number(raw.quantity) || 0,
  unitsPerPackage: raw.unitsPerPackage,
  packageCount: raw.packageCount,
  price: Number(raw[cfg.priceField]) || 0,
  ...(cfg.kind === "medicine" ? { form: raw.form === "parenteral" ? ("parenteral" as const) : ("oral" as const) } : {}),
  updatedAt: raw.updatedAt as string | undefined,
});

// Keš pod ["medicines"]/["articles"] dele i formulari (StockCombobox) koji očekuju
// SIROV odgovor API-ja — zato queryFn vraća sirove podatke, a pretvaranje ide kroz select.
export const useInventoryList = (cfg: InventoryConfig) =>
  useQuery({
    queryKey: cfg.listKey,
    queryFn: async () => {
      const { data } = await api.get(cfg.endpoint);
      return (data?.[cfg.listField] ?? data ?? []) as RawItem[];
    },
    select: (raw) => raw.map((r) => toItem(cfg, r)),
  });

export const useInventoryItem = (cfg: InventoryConfig, id: string) =>
  useQuery({
    queryKey: [cfg.kind, id],
    queryFn: async () => {
      const { data } = await api.get(`${cfg.endpoint}/${id}`);
      return toItem(cfg, data[cfg.itemField] as RawItem);
    },
    enabled: !!id,
  });

const useInvalidate = (cfg: InventoryConfig) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: cfg.listKey });
    qc.invalidateQueries({ queryKey: [cfg.kind] });
    qc.invalidateQueries({ queryKey: ["allMedicines"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };
};

export interface StockInput {
  packages: number;
  units: number;
}

export const useCreateItem = (cfg: InventoryConfig) => {
  const invalidate = useInvalidate(cfg);
  return useMutation({
    mutationFn: async (v: { name: string; price: number; unitsPerPackage: number; form?: MedicineForm } & StockInput) => {
      const { data } = await api.post(`${cfg.endpoint}/add`, {
        name: v.name,
        ...(v.form ? { form: v.form } : {}),
        [cfg.priceField]: v.price,
        unitsPerPackage: v.unitsPerPackage || undefined,
        packages: v.packages,
        quantity: v.units,
        fromFamily: false,
      });
      return data;
    },
    onSuccess: invalidate,
  });
};

export const useUpdateItem = (cfg: InventoryConfig) => {
  const invalidate = useInvalidate(cfg);
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.put(`${cfg.endpoint}/${id}`, body);
      return data;
    },
    onSuccess: invalidate,
  });
};

/** Razvrstavanje lekova (više odjednom); menja i vrstu na stavkama u specifikacijama */
export const useSetMedicineForm = () => {
  const invalidate = useInvalidate(INVENTORY.medicine);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { ids: string[]; form: MedicineForm }) => (await api.patch("/api/medicine/form", v)).data as { message: string; modified: number },
    onSuccess: () => {
      invalidate();
      // Grupe lekova u specifikacijama se menjaju
      for (const key of ["specification", "patientSpecification", "billingPeriodSpecification"]) qc.invalidateQueries({ queryKey: [key] });
    },
  });
};

export const useDeleteItem = (cfg: InventoryConfig) => {
  const invalidate = useInvalidate(cfg);
  return useMutation({
    mutationFn: (id: string) => api.delete(`${cfg.endpoint}/${id}`),
    onSuccess: invalidate,
  });
};
