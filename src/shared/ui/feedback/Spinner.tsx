const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };

export default function Spinner({ size = "md", className = "" }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Učitavanje"
      className={`inline-block animate-spin rounded-full border-current border-r-transparent ${sizes[size]} ${className}`}
    />
  );
}

export function PageLoader({ label = "Učitavanje..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-500">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06] ${className}`} />;
}
