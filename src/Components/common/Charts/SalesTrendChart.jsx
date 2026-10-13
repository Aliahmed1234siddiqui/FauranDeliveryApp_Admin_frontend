import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

// data: [{ _id: "2026-01", totalSales, orderCount }] from GET /admin/analytics/sales
export default function SalesTrendChart({ data }) {
  const chartData = data.map((d) => ({ month: d._id, sales: d.totalSales, orders: d.orderCount }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5B6B62" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#5B6B62" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value, name) => (name === "sales" ? [formatCurrency(value), "Sales"] : [value, "Orders"])}
          contentStyle={{ borderRadius: 10, border: "1px solid #E4E7E2", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="sales" stroke="#0F6E56" strokeWidth={2} fill="url(#salesFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
