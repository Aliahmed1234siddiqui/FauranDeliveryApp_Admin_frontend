import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCurrency } from "../../utils/formatters";

// data: [{ vendorName, totalCommission }]
export default function CommissionBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
        <XAxis dataKey="vendorName" tick={{ fontSize: 11, fill: "#5B6B62" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#5B6B62" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 10, border: "1px solid #E4E7E2", fontSize: 13 }} />
        <Bar dataKey="totalCommission" fill="#F2A93B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
