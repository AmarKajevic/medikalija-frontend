// shared/ui/SearchableSelect/types.ts
export type Option<Extra = unknown> = {
  value: string;
  label: string;
  extra?: Extra; 
};

export type SearchableSelectProps<T extends Option> = {
  value?: string;
  onChange: (value: string) => void;
  options: T[];
  placeholder?: string;
  renderOption?: (option: T) => React.ReactNode;
  className?: string;
  optionClassName?: string;
  emptyMessage?: string;
};