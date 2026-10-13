import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, X, Star } from "lucide-react";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import SearchInput from "../components/ui/SearchInput";
import { vendorApi } from "../api/vendorApi";
import { userApi } from "../api/userApi";
import { formatDate } from "../utils/formatters";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await vendorApi.getAll(statusFilter ? { status: statusFilter } : {});
      setVendors(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApproval = async (id, approvalStatus) => {
    try {
      await vendorApi.approve(id, approvalStatus);
      toast.success(`Vendor ${approvalStatus}`);
      setSelected(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleBlock = async (id, isActive) => {
    try {
      await userApi.setActive(id, isActive);
      toast.success(isActive ? "Vendor unblocked" : "Vendor blocked");
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const filtered = vendors.filter(
    (v) =>
      v.storeName?.toLowerCase().includes(search.toLowerCase()) ||
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "store", header: "Store", render: (v) => <span className="font-medium">{v.storeName}</span> },
    { key: "owner", header: "Owner", render: (v) => v.name },
    { key: "contact", header: "Contact", render: (v) => v.email || v.phone },
    { key: "rating", header: "Rating", render: (v) => (
      <span className="inline-flex items-center gap-1"><Star size={13} className="fill-accent text-accent" />{v.rating?.toFixed(1) || "—"}</span>
    ) },
    { key: "approval", header: "Approval", render: (v) => <Badge status={v.approvalStatus} /> },
    { key: "active", header: "Account", render: (v) => <Badge status={v.isActive ? "active" : "blocked"} /> },
    { key: "joined", header: "Joined", render: (v) => formatDate(v.createdAt) },
    {
      key: "actions",
      header: "",
      render: (v) => (
        <button className="text-sm font-medium text-brand hover:underline" onClick={() => setSelected(v)}>
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["", "pending", "approved", "rejected"].map((s) => (
            <FilterChip key={s} label={s || "All"} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search store, owner, email..." />
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          page={page}
          onPageChange={setPage}
          emptyTitle="No vendors found"
          emptyDescription="New vendor sign-ups will show up here for approval."
        />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.storeName}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner" value={selected.name} />
              <Field label="Contact" value={selected.email || selected.phone} />
              <Field label="Opening hours" value={`${selected.openingTime} - ${selected.closingTime}`} />
              <Field label="Address" value={selected.storeAddress?.address} />
              <Field label="Bank" value={selected.bankDetails?.bankName} />
              <Field label="Account title" value={selected.bankDetails?.accountTitle} />
            </div>

            {selected.documents?.length > 0 && (
              <div>
                <p className="mb-2 font-medium text-ink">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {selected.documents.map((doc, i) => (
                    <a key={i} href={doc} target="_blank" rel="noreferrer" className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-brand hover:bg-surface">
                      Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-surface-border pt-4">
              {selected.approvalStatus !== "approved" && (
                <button className="btn-primary" onClick={() => handleApproval(selected._id, "approved")}>
                  <Check size={16} /> Approve
                </button>
              )}
              {selected.approvalStatus !== "rejected" && (
                <button className="btn-danger" onClick={() => handleApproval(selected._id, "rejected")}>
                  <X size={16} /> Reject
                </button>
              )}
              <button className="btn-secondary" onClick={() => handleBlock(selected._id, !selected.isActive)}>
                {selected.isActive ? "Block account" : "Unblock account"}
              </button>
            </div>
          </div>
        )}
      </Modal>
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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="text-ink">{value || "—"}</p>
    </div>
  );
}
