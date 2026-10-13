import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import SearchInput from "../components/ui/SearchInput";
import { customerApi } from "../api/customerApi";
import { userApi } from "../api/userApi";
import { formatDate, initials } from "../utils/formatters";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await customerApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setCustomers(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const handleBlock = async (id, isActive) => {
    try {
      await userApi.setActive(id, isActive);
      toast.success(isActive ? "Customer unblocked" : "Customer blocked");
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Customer",
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand">
            {initials(c.name)}
          </div>
          <span className="font-medium">{c.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (c) => c.email || "—" },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    { key: "verified", header: "Verified", render: (c) => (c.isVerified ? <Badge status="active" /> : <Badge status="pending" />) },
    { key: "status", header: "Account", render: (c) => <Badge status={c.isActive ? "active" : "blocked"} /> },
    { key: "joined", header: "Joined", render: (c) => formatDate(c.createdAt) },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <button
          className={`text-sm font-medium hover:underline ${c.isActive ? "text-status-danger" : "text-status-success"}`}
          onClick={() => handleBlock(c._id, !c.isActive)}
        >
          {c.isActive ? "Block" : "Unblock"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["", "active", "blocked"].map((s) => (
            <FilterChip key={s} label={s || "All"} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone..." />
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          page={page}
          onPageChange={setPage}
          emptyTitle="No customers found"
          emptyDescription="Registered customers will appear here."
        />
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
        active ? "border-brand bg-brand text-white" : "border-surface-border bg-white text-ink-muted hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
