import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

interface Analysis {
  _id: string;
  name?: string;
  price?: number;
}

interface Item {
  _id: string;
  name?: string;
  category: string;
  price?: number;
  amount?: number;
  analyses?: Analysis[];
}

interface Specification {
  items: Item[];
  totalPrice?: number;
}

const formatCombination = (item: Item) => {
  const analysesDetails = (item.analyses ?? [])
    .map(({ name, price }) => `${name ?? "Nepoznata analiza"} (${price?.toFixed(2) ?? "0.00"} RSD)`)
    .join(", ");

  

  return {
    ...item,
    formattedName: `  ${analysesDetails}`,
    formattedQuantity: `${1 }`
  };
};

const formatMedicine = (item: Item) => ({
  ...item,
  formattedName: item.name ?? "Nepoznata medicina",
  formattedQuantity: `${item.amount ?? 0}`,
});

const formatItem = (item: Item) => {
  switch (item.category) {
    case "medicine":
      return formatMedicine(item);
    case "combination":
      return formatCombination(item);
    default:
      return {
        ...item,
        formattedName: item.name ?? "Nepoznata stavka",
        formattedQuantity: `${item.amount ?? 0}`,
      };
  }
};

export const usePatientSpecification = (patientId: string) => {
  const { token } = useAuth();

  return useQuery<Specification & { _id: string }>({
    enabled: !!patientId,
    queryKey: ["specification", patientId],
    queryFn: async () => {
      try {
        const { data } = await axios.get(
          `https://medikalija-api.vercel.app/api/specification/${patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const specification = data?.specification ?? data;
        const items = specification.items ?? [];

        const formattedItems = items.map(formatItem);

        return {
          _id: specification._id,          // ✅ ključni dodatak
          items: formattedItems,
          totalPrice: specification.totalPrice ?? 0,
        };
      } catch (error) {
        console.error("Greška pri učitavanju specifikacije:", error);
        throw new Error("Greška pri učitavanju specifikacije.");
      }
    },
  });
};

export const useSpecificationHistory = (patientId: string) => {
  const { token } = useAuth();

   return useQuery({
    enabled: !!patientId,
    queryKey: ["specification-history", patientId],
    queryFn: async () => {
      const response = await axios.get(
        `https://medikalija-api.vercel.app/api/specification/history/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });
};



export const useSingleSpecification = (specificationId: string) => {
  const { token } = useAuth();

  return useQuery({
    enabled: !!specificationId,
    queryKey: ["single-specification", specificationId],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://medikalija-api.vercel.app/api/specification/view/${specificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const spec = data.specification;

      if (!spec) return null;

      // ✅ formatiraj stavke isto kao u usePatientSpecification
      const items = (spec.items ?? []).map(formatItem);

      return {
        _id: spec._id,
        items,
        totalPrice: spec.totalPrice ?? 0,

        // ✅ NOVA POLJA — OBAVEZNO
        lodgingPrice: spec.lodgingPrice ?? 0,
        extraCostAmount: spec.extraCostAmount ?? 0,
        extraCostLabel: spec.extraCostLabel ?? "",

        // ✅ zbog prikaza perioda
        startDate: spec.startDate,
        endDate: spec.endDate,
        billing: spec.billing ?? null,
      };
    },
  });
};
export function useFutureSpecPeriods(patientId: string) {
  return useQuery({
    queryKey: ["futureSpecPeriods", patientId],
    queryFn: async () => {
      const res = await axios.get(
        `https://medikalija-api.vercel.app/api/specification/${patientId}/future-spec-periods`
      );
      return res.data;
    },
    enabled: !!patientId,
  });
}
