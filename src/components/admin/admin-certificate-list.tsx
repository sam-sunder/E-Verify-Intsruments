"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  MagnifyingGlass,
  Funnel,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type DigitalCertificate,
  type CertificateStatus,
  type PagedResult,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE": return "success";
    case "EXPIRED": case "REVOKED": case "SUSPENDED": return "danger";
    case "REPLACED": return "info";
    case "VOID": return "neutral";
    default: return "neutral";
  }
}

export function AdminCertificateList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.listCertificates({
          query: activeSearch,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        if (!active) return;
        setCertificates(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load certificates");
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

  if (loading && certificates.length === 0) {
    return <LoadingState label="Fetching certificate registry…" />;
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
          <h1 className="page-heading">Certificate Management</h1>
          <p className="page-lede">
            Oversee all issued digital certificates and manage their validity status.
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
                  placeholder="Search by Certificate No. or Instrument..."
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
                  setStatusFilter(e.target.value as CertificateStatus | "ALL");
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
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="VOID">Void</option>
              </select>
            </div>
          </div>
        </PanelHeader>
        <PanelBody>
          {certificates.length === 0 ? (
            <EmptyState
              title="No certificates found"
              description="No digital certificates match your current search or filter criteria."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Certificate No.</th>
                    <th>Instrument</th>
                    <th>Issued</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert.certificateNumber}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}>
                        {cert.certificateNumber}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{cert.instrument.instrumentType}</div>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
                          {cert.instrument.serialNumber}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{new Date(cert.issuedAt).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{new Date(cert.validTo).toLocaleDateString("en-IN")}</td>
                      <td>
                        <StatusBadge value={cert.status} tone={statusTone(cert.status)} />
                      </td>
                      <td>
                        <Link href={`/admin/certificates/${encodeURIComponent(cert.certificateNumber)}`}>
                          <span className="link-action" style={{ fontSize: 12 }}>Manage</span>
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
