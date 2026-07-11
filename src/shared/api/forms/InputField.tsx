type FormInputProps = {
  name: string;
  register: any;
  placeholder?: string;
  type?: "text" | "number"; // novo
};

const FormInput = ({ name, register, placeholder, type = "number" }: FormInputProps) => {
  return (
    <input
      className="border-0 mt-2 shadow-md rounded-lg p-2"
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