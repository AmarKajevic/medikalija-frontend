import { useForm } from "react-hook-form";

const useCleanForm = <T extends Record<string, any>>() => {
  const methods = useForm<T>();

  const getPayload = (data: T) => {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
  };

  return {
    ...methods,
    getPayload,
  };
};

export default useCleanForm;