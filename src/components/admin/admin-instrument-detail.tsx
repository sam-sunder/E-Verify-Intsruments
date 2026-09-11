"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Gauge,
  ClockCounterClockwise,
  ShieldCheck,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type Instrument, type InstrumentHistory } from "@/lib/api-client";
import { useSession } from "@/lib/auth/session-provider";

type Tab = "specs" | "lifecycle" | "compliance" | "audit";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE": return "success";
    case "INACTIVE": return "neutral";
    case "EXPIRED": case "SUSPENDED": case "REVOKED": return "danger";
    case "ARCHIVED": return "info";
    default: return "neutral";
  }
}

export function AdminInstrumentDetail({ publicInstrumentId }: { publicInstrumentId: string }) {
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [history, setHistory] = useState<InstrumentHistory | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("specs");

  useEffect(() => {
    if (sessionLoading || !user) return;

    async function loadData() {
      setLoading(true);
      try {
        const [inst, hist] = await Promise.all([
          api.getInstrument(publicInstrumentId),
          api.getInstrumentHistory(publicInstrumentId),
        ]);
        setInstrument(inst);
        setHistory(hist);
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load instrument details");
        setLoading(false);
      }
    }
    void loadData();
  }, [publicInstrumentId, sessionLoading, user]);

  if (sessionLoading || loading) return <LoadingState label="Loading instrument passport…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;
  if (!instrument) return <EmptyState title="Instrument not found" description="The requested instrument record could not be located." />;

  return (
    <>
      <div className="heading-row">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/instruments">
            <Button variant="quiet" icon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <div className="eyebrow">Instrument Passport</div>
            <h1 className="page-heading">{instrument.publicInstrumentId}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon={<Gauge size={16} />}>Edit Details</Button>
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          {/* Core Identity Card */}
          <Panel>
            <PanelHeader>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <h2 className="section-heading">Core Identity</h2>
                <StatusBadge value={instrument.status} tone={statusTone(instrument.status)} />
              </div>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
                <div>
                  <div className="field-label">Instrument Type</div>
                  <div className="field-value">{instrument.instrumentType}</div>
                </div>
                <div>
                  <div className="field-label">Category</div>
                  <div className="field-value">{instrument.category}</div>
                </div>
                <div>
                  <div className="field-label">Serial Number</div>
                  <div className="field-value" style={{ fontFamily: "var(--font-mono)" }}>{instrument.serialNumber}</div>
                </div>
                <div>
                  <div className="field-label">Manufacturer</div>
                  <div className="field-value">{instrument.manufacturer ?? "—"}</div>
                </div>
                <div>
                  <div className="field-label">Model</div>
                  <div className="field-value">{instrument.model ?? "—"}</div>
                </div>
                <div>
                  <div className="field-label">Capacity</div>
                  <div className="field-value">{instrument.capacity ?? "—"} {instrument.unitOfMeasure ?? ""}</div>
                </div>
                <div>
                  <div className="field-label">Registration No.</div>
                  <div className="field-value">{instrument.registrationNumber ?? "—"}</div>
                </div>
                <div>
                  <div className="field-label">Current Location</div>
                  <div className="field-value">{instrument.currentLocation ?? "—"}</div>
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* Detail Tabs */}
          <Panel>
            <div className="tab-nav" style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
              <button
                className={`tab-item ${activeTab === "specs" ? "active" : ""}`}
                onClick={() => setActiveTab("specs")}
              >
                <Gauge size={16} /> Technical Specs
              </button>
              <button
                className={`tab-item ${activeTab === "lifecycle" ? "active" : ""}`}
                onClick={() => setActiveTab("lifecycle")}
              >
                <ClockCounterClockwise size={16} /> Lifecycle
              </button>
              <button
                className={`tab-item ${activeTab === "compliance" ? "active" : ""}`}
                onClick={() => setActiveTab("compliance")}
              >
                <ShieldCheck size={16} /> Compliance
              </button>
              <button
                className={`tab-item ${activeTab === "audit" ? "active" : ""}`}
                onClick={() => setActiveTab("audit")}
              >
                <FileText size={16} /> Audit
              </button>
            </div>
            <PanelBody>
              {activeTab === "specs" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <div className="info-row">
                    <span className="info-label">Registered At:</span>
                    <span className="info-value">{new Date(instrument.registeredAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Last Verified:</span>
                    <span className="info-value">{instrument.lastVerifiedAt ? new Date(instrument.lastVerifiedAt).toLocaleDateString("en-IN") : "Never"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Next Due Date:</span>
                    <span className="info-value" style={{ fontWeight: 700 }}>{instrument.nextDueDate ? new Date(instrument.nextDueDate).toLocaleDateString("en-IN") : "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Remarks:</span>
                    <span className="info-value">{instrument.remarks ?? "No remarks provided."}</span>
                  </div>
                </div>
              )}

              {activeTab === "lifecycle" && (
                <div style={{ display: "grid", gap: 24 }}>
                  <div>
                    <h3 className="section-heading-sm">Ownership History</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Effective From</th>
                            <th>New Owner</th>
                            <th>Reason</th>
                            <th>Approved By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history?.ownership.map((o, i) => (
                            <tr key={i}>
                              <td>{new Date(o.effectiveFrom).toLocaleDateString("en-IN")}</td>
                              <td>{o.newOwner?.fullName ?? "—"}</td>
                              <td>{o.reason ?? "—"}</td>
                              <td>{o.approvedBy?.fullName ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="section-heading-sm">Location History</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Effective From</th>
                            <th>New Location</th>
                            <th>Reason</th>
                            <th>Approved By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history?.locations.map((l, i) => (
                            <tr key={i}>
                              <td>{new Date(l.effectiveFrom).toLocaleDateString("en-IN")}</td>
                              <td>{l.newLocation ?? "—"}</td>
                              <td>{l.reason ?? "—"}</td>
                              <td>{l.approvedBy?.fullName ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "compliance" && (
                <div style={{ display: "grid", gap: 24 }}>
                  <div>
                    <h3 className="section-heading-sm">Verification History</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Compliant</th>
                            <th>Findings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history?.verifications.map((v, i) => (
                            <tr key={i}>
                              <td>{new Date(v.verificationDate).toLocaleDateString("en-IN")}</td>
                              <td><StatusBadge value={v.resultStatus} tone={statusTone(v.resultStatus)} /></td>
                              <td>{v.isCompliant ? <CheckCircle size={16} color="var(--success)" /> : <Warning size={16} color="var(--danger)" />}</td>
                              <td>{v.findingsSummary ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="section-heading-sm">Compliance Assessments</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Risk Level</th>
                            <th>Summary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history?.compliance.map((c, i) => (
                            <tr key={i}>
                              <td>{new Date(c.assessmentDate).toLocaleDateString("en-IN")}</td>
                              <td>{c.complianceStatus}</td>
                              <td>{c.riskLevel ?? "—"}</td>
                              <td>{c.summary}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "audit" && (
                <div style={{ display: "grid", gap: 24 }}>
                  <div>
                    <h3 className="section-heading-sm">System Audit Logs</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Details</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history?.audit.map((a, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: "var(--font-mono)" }}>{new Date(a.changedAt).toLocaleString("en-IN")}</td>
                              <td><strong style={{ fontSize: 12 }}>{a.actionType}</strong></td>
                              <td style={{ fontSize: 12 }}>
                                {a.oldValue ? `${a.oldValue} → ${a.newValue}` : a.newValue}
                              </td>
                              <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{a.notes ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
