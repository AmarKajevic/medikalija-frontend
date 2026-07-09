type FormInputProps = {
  name: string;
  register: any;
  placeholder?: string;
};

const FormInput = ({ name, register, placeholder }: FormInputProps) => {
  return (
    <input
      className="border-0 mt-2 shadow-md rounded-lg p-2"
      {...register(name, {
        setValueAs: (v: any) => (v === "" ? undefined : Number(v)),
      })}
      placeholder={placeholder}
    />
  );
};

export default FormInput;