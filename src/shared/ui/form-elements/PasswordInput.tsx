import { useState } from "react";
import Label from "@shared/ui/form/Label";
import Input from "@shared/ui/form/input/InputField";
import { EyeIcon, EyeCloseIcon } from "@shared/icons";

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative w-full">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pr-12" // 👈 prostor za ikonicu
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 flex items-center z-50"
        >
          {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              )}
        </button>
      </div>
    </div>
  );
}
