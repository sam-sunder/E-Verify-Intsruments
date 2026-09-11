"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  Gauge,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type Instrument,
  type InstrumentStatus,
  type Pagination,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "EXPIRED":
    case "SUSPENDED":
    case "REVOKED":
      return "danger";
    case "INACTIVE":
    case "ARCHIVED":
      return "neutral";
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

export function InstrumentsList() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchInstruments() {
      try {
        const res = await api.listInstruments({
          query: activeQuery.trim() || undefined,
          status: (statusFilter as InstrumentStatus) || undefined,
          page,
          pageSize: 10,
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

    void fetchInstruments();
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

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <span>Instruments</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Regulated Equipment</div>
          <h1 className="page-heading">My Instruments</h1>
          <p className="page-lede">
            Registry of verified, active, and pending weighing and measuring instruments registered under your legal metrology profile.
          </p>
        </div>
        <div>
          <Link href="/instruments/register">
            <Button variant="primary" icon={<Plus size={16} />}>Register Instrument</Button>
          </Link>
        </div>
      </div>

      {/* Filter toolbar */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <div className="filter-group" style={{ flex: 1 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID, serial, manufacturer, or model…"
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
            aria-label="Filter by instrument status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REVOKED">Revoked</option>
            <option value="ARCHIVED">Archived</option>
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
            <h2 className="section-heading">Registered Instruments Registry</h2>
            <p className="field-hint">
              Showing {instruments.length} of {pagination.totalItems} instrument{pagination.totalItems === 1 ? "" : "s"}
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          {loading ? (
            <LoadingState label="Loading instrument registry…" />
          ) : instruments.length === 0 ? (
            <EmptyState
              title="No instruments found"
              description={query || statusFilter ? "No instruments match the selected filters. Try clearing your search parameters." : "You have not registered any regulated instruments yet."}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Digital Instrument ID</th>
                    <th>Type & Category</th>
                    <th>Manufacturer & Model</th>
                    <th>Serial Number</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Verified</th>
                    <th>Next Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instruments.map((inst) => (
                    <tr key={inst.publicInstrumentId}>
                      <td>
                        <Link
                          href={`/instruments/${encodeURIComponent(inst.publicInstrumentId)}`}
                          style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}
                        >
                          {inst.publicInstrumentId}
                        </Link>
                      </td>
                      <td>
                        <div><strong>{inst.instrumentType}</strong></div>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{inst.category}</span>
                      </td>
                      <td>
                        <div>{inst.manufacturer || "—"}</div>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{inst.model || "—"}</span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{inst.serialNumber}</td>
                      <td>{inst.currentLocation ?? "—"}</td>
                      <td>
                        <StatusBadge value={inst.status} tone={statusTone(inst.status)} />
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(inst.lastVerifiedAt)}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(inst.nextDueDate)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <Link href={`/instruments/${encodeURIComponent(inst.publicInstrumentId)}`}>
                            <span className="link-action" style={{ fontSize: 12 }}>Passport</span>
                          </Link>
                          <Link href={`/applications/new?instrumentId=${encodeURIComponent(inst.publicInstrumentId)}`}>
                            <span className="link-action" style={{ fontSize: 12, color: "var(--accent)" }}>Apply</span>
                          </Link>
                        </div>
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
