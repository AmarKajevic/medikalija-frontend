import React from 'react'

type InfoRowProps = {
  label: string;
  value: string | number | React.ReactNode;
}

const InfoRow = ({label, value} : InfoRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-1 py-3 last:border-0 dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value}</p>
    </div>
  )
}

export default InfoRow
