import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Store, Bike, PackageSearch, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../components/ui/StatCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Badge from "../components/ui/Badge";
import SalesTrendChart from "../components/charts/SalesTrendChart";
import { dashboardApi } from "../api/dashboardApi";
import { orderApi } from "../api/orderApi";
import { vendorApi } from "../api/vendorApi";
import { riderApi } from "../api/riderApi";
import { formatCurrency, formatDateTime } from "../utils/formatters";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [commission, setCommission] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingVendors, setPendingVendors] = useState(0);
  const [pendingRiders, setPendingRiders] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [salesRes, commissionRes, inventoryRes, ordersRes, vendorsRes, ridersRes] = await Promise.all([
          dashboardApi.getSalesAnalytics(),
          dashboardApi.getCommissionSummary(),
          dashboardApi.getInventoryOverview(),
          orderApi.getAll(),
          vendorApi.getAll({ status: "pending" }),
          riderApi.getAll({ status: "pending" }),
        ]);

        setSales(salesRes.data.data);
        setCommission(commissionRes.data.data);
        setInventory(inventoryRes.data.data);
        setRecentOrders(ordersRes.data.data.slice(0, 6));
        setPendingVendors(vendorsRes.data.data.length);
        setPendingRiders(ridersRes.data.data.length);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  const totalRevenue = commission.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const totalCommission = commission.reduce((sum, c) => sum + (c.totalCommission || 0), 0);
  const totalOrders = sales.reduce((sum, s) => sum + (s.orderCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={Wallet} accent="brand" />
        <StatCard label="Platform Commission" value={formatCurrency(totalCommission)} icon={TrendingUp} accent="amber" />
        <StatCard label="Delivered Orders" value={totalOrders} icon={PackageSearch} accent="info" />
        <StatCard label="Pending Vendors" value={pendingVendors} icon={Store} accent={pendingVendors ? "danger" : "brand"} />
        <StatCard label="Pending Riders" value={pendingRiders} icon={Bike} accent={pendingRiders ? "danger" : "brand"} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sales trend */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Sales Trend</h3>
            <span className="text-xs text-ink-muted">Monthly, delivered orders</span>
          </div>
          {sales.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No delivered orders yet.</p>
          ) : (
            <SalesTrendChart data={sales} />
          )}
        </div>

        {/* Low stock alerts */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" />
            <h3 className="font-semibold text-ink">Low Stock Alerts</h3>
          </div>
          {inventory.length === 0 ? (
            <p className="text-sm text-ink-muted">All products are well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {inventory.slice(0, 6).map((item) => (
                <li key={item._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.vendor?.storeName}</p>
                  </div>
                  <span className="badge bg-status-warningBg text-status-warning">{item.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-ink-muted">No orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id} className="border-b border-surface-border last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">#{o._id.slice(-6)}</td>
                    <td className="px-3 py-2.5">{o.customer?.name}</td>
                    <td className="px-3 py-2.5">{o.vendor?.storeName || o.vendor?.name}</td>
                    <td className="px-3 py-2.5">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-3 py-2.5">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
