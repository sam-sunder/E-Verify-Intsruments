"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
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
  type VerificationApplication,
  type ApplicationStatus,
  type PagedResult,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "CERTIFICATE_ISSUED":
    case "VERIFIED":
      return "success";
    case "UNDER_REVIEW":
    case "ASSIGNED":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    case "SUBMITTED":
    case "DRAFT":
      return "info";
    default:
      return "neutral";
  }
}

export function AdminApplicationList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.listApplications({
          query: activeSearch,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        if (!active) return;
        setApplications(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load applications");
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

  if (loading && applications.length === 0) {
    return <LoadingState label="Fetching application queue…" />;
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
          <h1 className="page-heading">Verification Applications</h1>
          <p className="page-lede">
            Review, assign, and process verification applications for regulated instruments.
          </p>
        </div>
      </div>

      <Panel>
        <PanelHeader>
          <div style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, maxWidth: 400 }}>
              <div style={{ position: "relative", flex: 1 }}>
                <MagnifyingGlass size={16} style={{ position: "absolute", left: 10, top: "calc(50% - 8px)", color: "var(--ink-muted)" }} />
                <input
                  type="text"
                  placeholder="Search by Application No. or Instrument..."
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
                  setStatusFilter(e.target.value as ApplicationStatus | "ALL");
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
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="VERIFIED">Verified</option>
                <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </PanelHeader>
        <PanelBody>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications found"
              description="No verification applications match your current search or filter criteria."
            />
          ) : (
            <>
              <div style={{ display: "grid", gap: 0 }}>
                {applications.map((app) => (
                  <div
                    key={app.applicationNumber}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ display: "grid", gap: "4px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link
                          href={`/admin/applications/${encodeURIComponent(app.applicationNumber)}`}
                          style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)", fontSize: "15px" }}
                        >
                          {app.applicationNumber}
                        </Link>
                        <StatusBadge value={app.status} tone={statusTone(app.status)} />
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600 }}>
                        {app.instrument.instrumentType}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", gap: "12px" }}>
                        <span>{app.applicationType.replaceAll("_", " ")}</span>
                        <span>Serial: <code style={{ fontFamily: "var(--font-mono)" }}>{app.instrument.serialNumber}</code></span>
                        <span>Submitted: {new Date(app.submittedAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "grid", gap: "8px" }}>
                      <Link href={`/admin/applications/${encodeURIComponent(app.applicationNumber)}`}>
                        <Button variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Review</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

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
            </>
          )}
        </PanelBody>
      </Panel>
    </>
  );
}
