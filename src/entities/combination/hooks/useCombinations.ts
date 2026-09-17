import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";



export interface Analysis {
  _id: string;
  name: string;
  price: number;
  totalPrice: number;
}

interface Combination {
  _id: string;
  name: string;
  group: string;
  analyses: Analysis[];
}
export interface UsedCombination {
  _id: string;
  combination: {
    _id: string;
    name: string;
    analyses: Analysis[];
    totalPrice: number;
  };
  patient: { _id: string; name: string };
  totalPriceAtTheTime: number;
  createdBy: { _id: string; name: string; role: string };
  createdAt: string;
}
export interface Group {
  _id: string;
  name: string;
  combinations: {
    _id: string;
    name: string;
    totalPrice: number;
    analyses: Analysis[];
  }[];
}

export const useCombinations = (patientId: string) => {
  const queryClient = useQueryClient();

  // --- Fetch svih analiza ---
  const getAnalyses = useQuery<Analysis[]>({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data } = await api.get("/api/analysis");
      return data.success ? data.analyses : [];
    },
  });

  // --- Fetch svih kombinacija ---
  const combinationsQuery = useQuery<Combination[]>({
    queryKey: ["combinations"],
    queryFn: async () => {
      const { data } = await api.get("/api/analysis/combination");
      return data.success ? data.combinations : [];
    },
  });

  const usedCombination = useQuery<UsedCombination[]>({
  queryKey: ["combinations", patientId],
  queryFn: async () => {
    const { data } = await api.get(
      `/api/analysis/combination/combinations/${patientId}`
    );
    return data.success ? data.combinations : [];
  },
   enabled: !!patientId,
});

const getGroupsWithCombinations = useQuery<Group[]>({
  queryKey: ["groups"],
  queryFn: async () => {
    const {data} = await api.get("/api/combinationGroup")
    return data.success ? data.groups : [];
  }
})

  // --- Dodavanje nove kombinacije ---
  const addCombination = useMutation({
    mutationFn: async (payload: {
      name: string;
      group: string;
      analysisIds: string[];
    }) => {
      const { data } = await api.post(
        "/api/analysis/combination/addCombination",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combinations"] });
    },
  });

  const addCombinationToPatient = useMutation({
    mutationFn: async(combination: {
      patientId: string,
      combinationId: string,
    }) => {
      const{ patientId, combinationId} = combination
      const {data} = await api.post(`/api/analysis/combination/addToPatient/${patientId}`,{ combinationId})
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combinations", patientId] })
      queryClient.invalidateQueries({ queryKey: ["patientSpecification", patientId] })
    }
  })

  const addCombinationToGroup = useMutation({
    mutationFn: async (group: {name: string, combinations: string[]}) => {
      const {data} = await api.post(`/api/combinationGroup`, {...group})
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["groups"]})
    }
  })



  

  return {
    analyses: getAnalyses.data || [],
    isAnalysesLoading: getAnalyses.isLoading,
    combinations: combinationsQuery.data || [],
    isCombinationsLoading: combinationsQuery.isLoading,
    addCombination,
    addCombinationToPatient,
    usedCombination,
    addCombinationToGroup,
    getGroupsWithCombinations
    
    
  };
};
