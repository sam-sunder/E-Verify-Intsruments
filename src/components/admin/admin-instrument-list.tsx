"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  MagnifyingGlass,
  Plus,
  Funnel,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type Instrument,
  type InstrumentStatus,
  type PagedResult,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "neutral";
    case "EXPIRED":
    case "SUSPENDED":
    case "REVOKED":
      return "danger";
    case "ARCHIVED":
      return "info";
    default:
      return "neutral";
  }
}

export function AdminInstrumentList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InstrumentStatus | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.listInstruments({
          query: activeSearch,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        if (!active) return;
        setInstruments(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load instruments");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [activeSearch, statusFilter, pagination.page, pagination.pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  if (loading && instruments.length === 0) {
    return <LoadingState label="Fetching instrument registry…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setError(null);
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Workspace</div>
          <h1 className="page-heading">Instrument Registry</h1>
          <p className="page-lede">
            Manage all regulated weighing and measuring instruments registered within the system.
          </p>
        </div>
        <Link href="/instruments/register">
          <Button variant="primary" icon={<Plus size={16} />}>Register New Instrument</Button>
        </Link>
      </div>

      <Panel>
        <PanelHeader>
          <div style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <MagnifyingGlass size={16} style={{ position: "absolute", left: 10, top: "calc(50% - 8px)", color: "var(--ink-muted)" }} />
                <input
                  type="text"
                  placeholder="Search by ID, Serial No, or Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: 32,
                    width: "100%",
                    height: "42px",
                    borderRadius: "2px",
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Funnel size={16} style={{ color: "var(--ink-muted)" }} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as InstrumentStatus | "ALL");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                style={{
                  padding: "8px 12px",
                  height: "42px",
                  borderRadius: "2px",
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  backgroundColor: "var(--surface)",
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REVOKED">Revoked</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </PanelHeader>
        <PanelBody>
          {instruments.length === 0 ? (
            <EmptyState
              title="No instruments found"
              description="No instruments match your current search or filter criteria."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Instrument ID</th>
                    <th>Type & Category</th>
                    <th>Serial No.</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Verified</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {instruments.map((inst) => (
                    <tr key={inst.publicInstrumentId}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}>
                        {inst.publicInstrumentId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inst.instrumentType}</div>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{inst.category}</span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{inst.serialNumber}</td>
                      <td>{inst.currentLocation ?? "—"}</td>
                      <td>
                        <StatusBadge value={inst.status} tone={statusTone(inst.status)} />
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{inst.lastVerifiedAt ? new Date(inst.lastVerifiedAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td>
                        <Link href={`/admin/instruments/${encodeURIComponent(inst.publicInstrumentId)}`}>
                          <span className="link-action" style={{ fontSize: 12 }}>Passport</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span style={{ fontSize: 14, color: "var(--ink)" }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </PanelBody>
      </Panel>
    </>
  );
}
