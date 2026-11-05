import toast from "react-hot-toast";

// Poruka greške iz odgovora API-ja (backend vraća { message }) ili rezervna poruka.
export const getErrorMessage = (error: unknown, fallback = "Došlo je do greške. Pokušajte ponovo.") => {
  const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return err?.response?.data?.message || err?.response?.data?.error || fallback;
};

export const notify = {
  success: (message: string) => toast.success(message),
  error: (error: unknown, fallback?: string) =>
    toast.error(typeof error === "string" ? error : getErrorMessage(error, fallback)),
  info: (message: string) => toast(message),
};
