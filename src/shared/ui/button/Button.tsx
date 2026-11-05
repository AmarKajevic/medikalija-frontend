import { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "@shared/ui/feedback/Spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs gap-1.5",
  sm: "h-9 px-3.5 text-sm gap-2",
  md: "h-11 px-5 text-sm gap-2",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 focus-visible:ring-brand-500/30",
  secondary:
    "bg-gray-900 text-white shadow-theme-xs hover:bg-gray-800 focus-visible:ring-gray-500/30 dark:bg-white/10 dark:hover:bg-white/15",
  outline:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-brand-500/30 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.04]",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500/20 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
  danger: "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 focus-visible:ring-error-500/30",
};

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  loading = false,
  className = "",
  disabled,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition focus:outline-hidden focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    {...rest}
  >
    {loading ? <Spinner size="sm" /> : startIcon && <span className="flex items-center">{startIcon}</span>}
    {children}
    {endIcon && <span className="flex items-center">{endIcon}</span>}
  </button>
);

export default Button;
