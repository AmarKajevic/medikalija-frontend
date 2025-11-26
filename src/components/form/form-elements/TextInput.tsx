import Input from "../input/InputField";
import Label from "../Label";

interface TextInputProps {
    id:string;
    label: string;
    placeholder?: string;
    value?:string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

}

export default function TextInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: TextInputProps) {
return (
    <div>
        <Label htmlFor={id} >{label}</Label>
         <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
)
}

