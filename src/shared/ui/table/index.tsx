import { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
}

const cx = (...classes: (string | undefined)[]) => clsx(twMerge(classes.filter(Boolean).join(" ")));

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={cx("min-w-full text-sm", className)}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <thead
      className={cx(
        "border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]",
        className,
      )}
    >
      {children}
    </thead>
  );
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cx("divide-y divide-gray-100 dark:divide-gray-800", className)}>
      {children}
    </tbody>
  );
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <tr className={cx("text-gray-700 dark:text-gray-300", className)}>{children}</tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, className }) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag
      className={cx(
        isHeader
          ? "px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400"
          : "px-3 py-3",
        className,
      )}
    >
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
