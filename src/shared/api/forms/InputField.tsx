type FormInputProps = {
  name: string;
  register: any;
  placeholder?: string;
  type?: "text" | "number"; // novo
};

const FormInput = ({ name, register, placeholder, type = "number" }: FormInputProps) => {
  return (
    <input
      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
      {...register(name, {
        // Konvertuj samo ako je type="number"
        setValueAs: (v: any) => {
          if (type === "number") {
            return v === "" ? undefined : Number(v);
          }
          return v; // za text ostavi string
        },
      })}
      placeholder={placeholder}
      type={type}
    />
  );
};

export default FormInput