"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type CertificateStatus,
  type DigitalCertificate,
  type Pagination,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
    case "REVOKED":
    case "VOID":
      return "danger";
    case "SUSPENDED":
      return "warning";
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

function getExpiryInfo(validTo: string, status: string, now: number): { text: string; isUrgent: boolean; isExpired: boolean } {
  if (status !== "ACTIVE") {
    return { text: status, isUrgent: status === "SUSPENDED", isExpired: status === "EXPIRED" };
  }
  if (now === 0) {
    return { text: "Active", isUrgent: false, isExpired: false };
  }
  const diffDays = Math.ceil((new Date(validTo).getTime() - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { text: `Expired (${Math.abs(diffDays)}d ago)`, isUrgent: true, isExpired: true };
  }
  if (diffDays <= 7) {
    return { text: `Critical · ${diffDays}d remaining`, isUrgent: true, isExpired: false };
  }
  if (diffDays <= 30) {
    return { text: `Expiring soon · ${diffDays}d`, isUrgent: true, isExpired: false };
  }
  return { text: `${diffDays} days valid`, isUrgent: false, isExpired: false };
}

export function CertificatesList() {
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchCertificates() {
      try {
        const res = await api.listCertificates({
          query: activeQuery.trim() || undefined,
          status: (statusFilter as CertificateStatus) || undefined,
          page,
          pageSize: 10,
        });
        if (!active) return;
        setCertificates(res.data);
        setPagination(res.pagination);
        setNow(Date.now());
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load certificates");
        setLoading(false);
      }
    }

    void fetchCertificates();
    return () => {
      active = false;
    };
  }, [activeQuery, statusFilter, page, reloadCounter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setActiveQuery(query);
  }

  const urgentCerts = certificates.filter((c) => {
    const info = getExpiryInfo(c.validTo, c.status, now);
    return info.isUrgent;
  });

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <span>Certificates</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Statutory Stamping & Verification</div>
          <h1 className="page-heading">Digital Certificates</h1>
          <p className="page-lede">
            Official Legal Metrology certificates and digital stamps verifying instrument accuracy, compliance, and legal commercial usage.
          </p>
        </div>
      </div>

      {/* Urgent Expiry Banner */}
      {urgentCerts.length > 0 ? (
        <div className="alert-banner alert-banner-warning">
          <div className="alert-banner-body">
            <strong>
              <Warning size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Attention: {urgentCerts.length} certificate(s) expired or expiring within 30 days
            </strong>
            <p>
              Under the Legal Metrology Act, commercial use of unstamped or expired instruments is prohibited. Schedule periodic re-verification to maintain validity.
            </p>
          </div>
        </div>
      ) : null}

      {/* Filter Bar */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="filter-group" style={{ flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by certificate number, instrument ID, or serial…"
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
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by certificate status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REVOKED">Revoked</option>
            <option value="REPLACED">Replaced</option>
          </select>
        </div>
      </form>

      {error ? (
        <ErrorState
          message={error}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setLoading(true);
                setError(null);
                setReloadCounter((c) => c + 1);
              }}
            >
              Try Again
            </Button>
          }
        />
      ) : null}

      <Panel>
        <PanelHeader>
          <div>
            <h2 className="section-heading">Certificates Register</h2>
            <p className="field-hint">
              Showing {certificates.length} of {pagination.totalItems} certificate{pagination.totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          {loading ? (
            <LoadingState label="Loading digital certificates…" />
          ) : certificates.length === 0 ? (
            <EmptyState
              title="No certificates found"
              description={query || statusFilter ? "No certificates match the selected criteria." : "No digital certificates have been issued yet. Certificates are issued after an authorized officer completes field verification."}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Certificate Number</th>
                    <th>Instrument</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>Validity Window</th>
                    <th>Status</th>
                    <th>Issued By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => {
                    const expiry = getExpiryInfo(cert.validTo, cert.status, now);
                    return (
                      <tr key={cert.certificateNumber}>
                        <td>
                          <Link
                            href={`/certificates/${encodeURIComponent(cert.certificateNumber)}`}
                            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}
                          >
                            {cert.certificateNumber}
                          </Link>
                        </td>
                        <td>
                          <div>
                            <Link
                              href={`/instruments/${encodeURIComponent(cert.instrument.publicInstrumentId)}`}
                              style={{ fontWeight: 600, color: "var(--ink)" }}
                            >
                              {cert.instrument.instrumentType}
                            </Link>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
                            SN: {cert.instrument.serialNumber}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(cert.validFrom)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(cert.validTo)}</td>
                        <td>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: expiry.isUrgent ? 700 : 400,
                              color: expiry.isExpired ? "var(--danger)" : expiry.isUrgent ? "var(--warning)" : "var(--ink-muted)",
                            }}
                          >
                            {expiry.text}
                          </span>
                        </td>
                        <td>
                          <StatusBadge value={cert.status} tone={statusTone(cert.status)} />
                        </td>
                        <td>{cert.issuedByName}</td>
                        <td>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <Link href={`/certificates/${encodeURIComponent(cert.certificateNumber)}`}>
                              <span className="link-action" style={{ fontSize: 12 }}>View</span>
                            </Link>
                            {expiry.isUrgent ? (
                              <Link
                                href={`/applications/new?instrumentId=${encodeURIComponent(
                                  cert.instrument.publicInstrumentId
                                )}&type=RE_VERIFICATION&previousApplicationId=${encodeURIComponent(
                                  cert.applicationNumber
                                )}`}
                              >
                                <Button variant="secondary" style={{ minHeight: 28, padding: "3px 8px", fontSize: 11 }} icon={<ArrowsClockwise size={12} />}>
                                  Re-Verify
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
