import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";



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
  const { token } = useAuth();
 

  // --- Fetch svih analiza ---
  const getAnalyses = useQuery<Analysis[]>({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data } = await axios.get("http://localhost:5000/api/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.success ? data.analyses : [];
    },
  });

  // --- Fetch svih kombinacija ---
  const combinationsQuery = useQuery<Combination[]>({
    queryKey: ["combinations"],
    queryFn: async () => {
      const { data } = await axios.get(
        "http://localhost:5000/api/analysis/combination",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.success ? data.combinations : [];
    },
  });

  const usedCombination = useQuery<UsedCombination[]>({
  queryKey: ["combinations", patientId],
  queryFn: async () => {
    const { data } = await axios.get(
      `http://localhost:5000/api/analysis/combination/combinations/${patientId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.success ? data.combinations : [];
  },
   enabled: !!patientId,
});

const getGroupsWithCombinations = useQuery<Group[]>({
  queryKey: ["groups"],
  queryFn: async () => {
    const {data} = await axios.get("http://localhost:5000/api/combinationGroup",{
      headers:
      {Authorization: `Bearer ${token}`}
    })
    return data.success ? data.groups : [];
  }
})

  // const patientCombinationQuery = useQuery<UsedCombination[]>({
    
  //   queryKey: ["combinations", patientId],
  //   queryFn: async () => {

  //     const {data} = await axios.get(`http://localhost:5000/api/analysis/combination/combinations/${patientId}`,{
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       }
  //     })
      
  //      return data.success && Array.isArray(data.combinations)
  //       ? data.combinations
  //       : [];
  //   }
  // })

  // --- Dodavanje nove kombinacije ---
  const addCombination = useMutation({
    mutationFn: async (payload: {
      name: string;
      group: string;
      analysisIds: string[];
    }) => {
      const { data } = await axios.post(
        "http://localhost:5000/api/analysis/combination/addCombination",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const {data} = await axios.post(`http://localhost:5000/api/analysis/combination/addToPatient/${patientId}`,{ combinationId},{
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combinations", patientId] })
    }
  })

  const addCombinationToGroup = useMutation({
    mutationFn: async (group: {name: string, combinations: string[]}) => {
      const {data} = await axios.post(`http://localhost:5000/api/combinationGroup`, {...group}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
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
