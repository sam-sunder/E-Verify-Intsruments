"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  MagnifyingGlass,
  Clock,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type Instrument } from "@/lib/api-client";

export function AdminAuditLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [foundInstrument, setFoundInstrument] = useState<Instrument | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setLoading(true);
    setError(null);

    try {
      // Try to find the instrument by the query
      const res = await api.listInstruments({ query: searchQuery, pageSize: 1 });
      if (res.data.length === 0) {
        setFoundInstrument(null);
        setAuditLogs([]);
        throw new Error("No instrument found matching the search query.");
      }

      const instrument = res.data[0];
      setFoundInstrument(instrument);

      const history = await api.getInstrumentHistory(instrument.publicInstrumentId);
      setAuditLogs(history.audit);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "An error occurred during search");
      setFoundInstrument(null);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Workspace</div>
          <h1 className="page-heading">System Audit Trails</h1>
          <p className="page-lede">
            View historical records of changes and actions for regulated instruments.
          </p>
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Search Instrument History</h2>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 600 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <MagnifyingGlass size={16} style={{ position: "absolute", left: 10, top: "calc(50% - 8px)", color: "var(--ink-muted)" }} />
                  <input
                    type="text"
                    placeholder="Enter Instrument ID or Serial Number..."
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
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Searching..." : "Fetch Logs"}
                </Button>
              </form>
            </PanelBody>
          </Panel>

          {loading && <LoadingState label="Retrieving audit trails…" />}

          {error && !loading && (
            <div style={{ padding: 12, background: "var(--surface-soft)", borderLeft: "3px solid var(--danger)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--danger)" }}>
              {error}
            </div>
          )}

          {!loading && !foundInstrument && !error && (
            <EmptyState
              title="No instrument selected"
              description="Search for an instrument by its ID or serial number to view its audit history."
            />
          )}

          {!loading && foundInstrument && (
            <Panel>
              <PanelHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Gauge size={18} />
                    <h2 className="section-heading">Audit Log: {foundInstrument.publicInstrumentId}</h2>
                  </div>
                  <Link href={`/admin/instruments/${encodeURIComponent(foundInstrument.publicInstrumentId)}`}>
                    <span className="link-action" style={{ fontSize: 12 }}>View Passport <ArrowRight size={12} /></span>
                  </Link>
                </div>
              </PanelHeader>
              <PanelBody>
                {auditLogs.length === 0 ? (
                  <EmptyState
                    title="No audit logs found"
                    description="There are no recorded changes for this instrument."
                  />
                ) : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Change</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                              {new Date(log.changedAt).toLocaleString("en-IN")}
                            </td>
                            <td style={{ fontWeight: 600, fontSize: 12 }}>{log.actionType}</td>
                            <td style={{ fontSize: 12 }}>
                              {log.oldValue ? `${log.oldValue} → ${log.newValue}` : log.newValue}
                            </td>
                            <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{log.notes ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PanelBody>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
