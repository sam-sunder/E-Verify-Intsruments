"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  FileText,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type ApplicationStatus,
  type ApplicationType,
  type Pagination,
  type VerificationApplication,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "CERTIFICATE_ISSUED":
    case "VERIFIED":
      return "success";
    case "UNDER_REVIEW":
    case "ASSIGNED":
    case "DUE_SOON":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    case "SUBMITTED":
      return "info";
    default:
      return "neutral";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function ApplicationsList() {
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [activeQuery, setActiveQuery] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchApplications() {
      try {
        const res = await api.listApplications({
          query: activeQuery.trim() || undefined,
          status: (statusFilter as ApplicationStatus) || undefined,
          applicationType: (typeFilter as ApplicationType) || undefined,
          page,
          pageSize: 10,
        });
        if (!active) return;
        setApplications(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load verification applications");
        setLoading(false);
      }
    }

    void fetchApplications();
    return () => {
      active = false;
    };
  }, [activeQuery, statusFilter, typeFilter, page, reloadCounter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setActiveQuery(query);
  }

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <span>Applications</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Verification Lifecycle</div>
          <h1 className="page-heading">Verification Applications</h1>
          <p className="page-lede">
            Track verification, stamping, and re-verification requests submitted to Legal Metrology authorities.
          </p>
        </div>
        <div>
          <Link href="/applications/new">
            <Button variant="primary" icon={<Plus size={16} />}>New Application</Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="filter-group" style={{ flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by application number, instrument ID, or serial…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary" icon={<MagnifyingGlass size={15} />}>
            Search
          </Button>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setLoading(true); }}
            aria-label="Filter by application status"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="VERIFIED">Verified</option>
            <option value="CERTIFICATE_ISSUED">Certificate Issued</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); setLoading(true); }}
            aria-label="Filter by application type"
          >
            <option value="">All Types</option>
            <option value="INITIAL_VERIFICATION">Initial Verification</option>
            <option value="RE_VERIFICATION">Re-Verification</option>
            <option value="REPLACEMENT_REQUEST">Replacement Request</option>
            <option value="COMPLIANCE_REVIEW">Compliance Review</option>
          </select>
        </div>
      </form>

      {error ? (
        <ErrorState message={error} action={<Button variant="secondary" onClick={() => { setLoading(true); setError(null); setReloadCounter((c) => c + 1); }}>Try Again</Button>} />
      ) : null}

      <Panel>
        <PanelHeader>
          <div>
            <h2 className="section-heading">Applications Register</h2>
            <p className="field-hint">
              Showing {applications.length} of {pagination.totalItems} application{pagination.totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          {loading ? (
            <LoadingState label="Loading applications…" />
          ) : applications.length === 0 ? (
            <EmptyState
              title="No applications found"
              description={query || statusFilter || typeFilter ? "No verification applications match the selected criteria." : "You have not submitted any verification applications yet."}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Application Number</th>
                    <th>Target Instrument</th>
                    <th>Application Type</th>
                    <th>Status</th>
                    <th>Submitted Date</th>
                    <th>Target Date</th>
                    <th>Reviewed By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.applicationNumber}>
                      <td>
                        <Link
                          href={`/applications/${encodeURIComponent(app.applicationNumber)}`}
                          style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}
                        >
                          {app.applicationNumber}
                        </Link>
                      </td>
                      <td>
                        <div>
                          <Link
                            href={`/instruments/${encodeURIComponent(app.instrument.digitalInstrumentId)}`}
                            style={{ fontWeight: 600, color: "var(--ink)" }}
                          >
                            {app.instrument.instrumentType}
                          </Link>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
                          SN: {app.instrument.serialNumber}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>{app.applicationType.replaceAll("_", " ")}</span>
                      </td>
                      <td>
                        <StatusBadge value={app.status} tone={statusTone(app.status)} />
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(app.submittedAt)}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(app.dueDate)}</td>
                      <td>{app.reviewedByName || "Pending review"}</td>
                      <td>
                        <Link href={`/applications/${encodeURIComponent(app.applicationNumber)}`}>
                          <span className="link-action" style={{ fontSize: 12 }}>Track Progress</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination bar */}
          {pagination.totalPages > 1 ? (
            <div className="pagination-bar">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} items total)
              </div>
              <div className="pagination-controls">
                <Button
                  variant="secondary"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  icon={<CaretLeft size={14} />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => {
                    setLoading(true);
                    setPage((p) => p + 1);
                  }}
                  icon={<CaretRight size={14} />}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </PanelBody>
      </Panel>
    </>
  );
}
