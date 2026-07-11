import { useForm } from "react-hook-form";

const useCleanForm = <T extends Record<string, any>>() => {
  const methods = useForm<T>();

const getPayload = (data: T) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => {
      if (v === undefined) return false;
      if (typeof v === "number" && isNaN(v)) return false;
      return true;
    })
  );
};

  return {
    ...methods,
    getPayload,
  };
};

export default useCleanForm;