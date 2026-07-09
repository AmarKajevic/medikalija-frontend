import React from 'react'

type InfoRowProps = {
  label: string;
  value: string | number | React.ReactNode;
}

const InfoRow = ({label, value} : InfoRowProps) => {
  return (
     <div className="flex items-center justify-between border-0 shadow-md rounded-md p-5 gap-4">
      <p className="font-semibold text-black">{label}</p>
      <p className="font-semibold text-black">{value}</p>
    </div>
  )
}

export default InfoRow
