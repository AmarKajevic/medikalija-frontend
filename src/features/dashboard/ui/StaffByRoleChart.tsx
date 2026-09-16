import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  "main-nurse": "Glavna sestra",
  nurse: "Sestra",
  doctor: "Doktor",
};

interface StaffByRoleChartProps {
  staffByRole: { role: string; count: number }[];
}

export default function StaffByRoleChart({ staffByRole }: StaffByRoleChartProps) {
  const categories = staffByRole.map((r) => ROLE_LABELS[r.role] || r.role);
  const counts = staffByRole.map((r) => r.count);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "45%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val: number) => `${val} zaposlenih` },
    },
  };

  const series = [{ name: "Osoblje", data: counts }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Osoblje po ulozi
      </h3>
      {counts.length > 0 ? (
        <Chart options={options} series={series} type="bar" height={220} />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nema podataka o osoblju.</p>
      )}
    </div>
  );
}
