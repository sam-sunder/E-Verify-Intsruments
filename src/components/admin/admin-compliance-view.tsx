"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Warning,
  Clock,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, apiRequest, type ComplianceSummary } from "@/lib/api-client";

export function AdminComplianceView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [summaryRes, recordsRes] = await Promise.all([
          api.getComplianceSummary(),
          apiRequest<any[]>("/compliance/records"),
        ]);
        setSummary(summaryRes);
        setRecords(recordsRes);
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load compliance data");
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  if (loading) return <LoadingState label="Fetching compliance data…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Workspace</div>
          <h1 className="page-heading">Compliance Overview</h1>
          <p className="page-lede">
            System-wide compliance monitoring for all regulated instruments.
          </p>
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          {/* Summary Stats */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-label">Valid Certificates</div>
              <div className="metric-value" style={{ color: "var(--success)" }}>
                {summary?.totals.VALID ?? 0}
              </div>
              <div className="metric-sub">
                <CheckCircle size={14} /> Full compliance
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Due Soon / Upcoming</div>
              <div className="metric-value" style={{ color: "var(--warning)" }}>
                {(summary?.totals.DUE_SOON ?? 0) + (summary?.totals.UPCOMING ?? 0)}
              </div>
              <div className="metric-sub">
                <Clock size={14} /> Action required soon
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Critical / Expired</div>
              <div
                className="metric-value"
                style={{ color: (summary?.totals.CRITICAL ?? 0) + (summary?.totals.EXPIRED ?? 0) > 0 ? "var(--danger)" : "var(--ink-muted)" }}
              >
                {(summary?.totals.CRITICAL ?? 0) + (summary?.totals.EXPIRED ?? 0)}
              </div>
              <div className="metric-sub">
                <Warning size={14} /> Immediate action needed
              </div>
            </div>
          </div>

          {/* Compliance Records */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Detailed Compliance Records</h2>
            </PanelHeader>
            <PanelBody>
              {records.length === 0 ? (
                <EmptyState
                  title="No compliance records found"
                  description="There are currently no detailed compliance records available in the system."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Instrument ID</th>
                        <th>Certificate No.</th>
                        <th>Compliance Status</th>
                        <th>Expiry Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.certificates.map((c) => (
                        <tr key={c.certificateNumber}>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{c.instrumentId}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{c.certificateNumber}</td>
                          <td>
                            <StatusBadge
                              value={c.complianceStatus}
                              tone={c.state === "VALID" ? "success" : (c.state === "EXPIRED" || c.state === "CRITICAL" ? "danger" : "warning")}
                            />
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{new Date(c.validTo).toLocaleDateString("en-IN")}</td>
                          <td>
                            <Link href={`/admin/certificates/${encodeURIComponent(c.certificateNumber)}`}>
                              <span className="link-action" style={{ fontSize: 12 }}>Manage</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
