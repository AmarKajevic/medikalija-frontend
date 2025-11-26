import { useState } from "react";
import Label from "../Label";

interface AutoDateInputProps {
  id: string;
  label: string;
  onChange?: (value: string) => void;
}

export default function AutoDateInput({ id, label, onChange }: AutoDateInputProps) {
  const [value, setValue] = useState("");

  const handleSetDateTime = () => {
    const now = new Date();

    // Formatiraj lepo: YYYY-MM-DD HH:mm:ss
    const formatted =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      " " +
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    setValue(formatted);
    if (onChange) onChange(formatted);
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          value={value}
          readOnly
          className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100"
        />
        <button
          type="button"
          onClick={handleSetDateTime}
          className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 mx-auto my-2 w-[180px] h-[42px]"
        >
          Postavi datum
        </button>
      </div>
    </div>
  );
}
