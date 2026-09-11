"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  XCircle,
  PauseCircle,
  Clock,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type DigitalCertificate, type CertificateStatus } from "@/lib/api-client";
import { useSession } from "@/lib/auth/session-provider";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE": return "success";
    case "EXPIRED": case "REVOKED": case "SUSPENDED": return "danger";
    case "REPLACED": return "info";
    case "VOID": return "neutral";
    default: return "neutral";
  }
}

export function AdminCertificateDetail({ certificateNumber }: { certificateNumber: string }) {
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<DigitalCertificate | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (sessionLoading || !user) return;

    async function loadData() {
      setLoading(true);
      try {
        const [cert, hist] = await Promise.all([
          api.getCertificate(certificateNumber),
          api.getCertificateHistory(certificateNumber),
        ]);
        setCertificate(cert);
        setHistory(hist);
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load certificate details");
        setLoading(false);
      }
    }
    void loadData();
  }, [certificateNumber, sessionLoading, user]);

  async function handleAction(action: "revoke" | "suspend") {
    const reason = prompt(`Please enter the reason for ${action}ing this certificate:`);
    if (!reason) return;

    setIsProcessing(true);
    try {
      if (action === "revoke") await api.revokeCertificate(certificateNumber, { reason });
      else await api.suspendCertificate(certificateNumber, { reason });

      const updated = await api.getCertificate(certificateNumber);
      setCertificate(updated);
      const updatedHist = await api.getCertificateHistory(certificateNumber);
      setHistory(updatedHist);
      alert(`Certificate ${action}ed successfully`);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Action failed");
    } finally {
      setIsProcessing(false);
    }
  }

  if (sessionLoading || loading) return <LoadingState label="Loading certificate details…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;
  if (!certificate) return <EmptyState title="Certificate not found" description="The requested certificate could not be located." />;

  return (
    <>
      <div className="heading-row">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/certificates">
            <Button variant="quiet" icon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <div className="eyebrow">Certificate Management</div>
            <h1 className="page-heading">{certificate.certificateNumber}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {user?.role === "ADMINISTRATOR" && certificate.status === "ACTIVE" && (
            <>
              <Button variant="secondary" onClick={() => handleAction("suspend")} disabled={isProcessing} icon={<PauseCircle size={16} />}>
                {isProcessing ? "Processing..." : "Suspend"}
              </Button>
              <Button variant="primary" onClick={() => handleAction("revoke")} disabled={isProcessing} icon={<XCircle size={16} />}>
                {isProcessing ? "Processing..." : "Revoke"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24, maxWidth: 800 }}>
          <div style={{ border: "2px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <Panel className="border-none">
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                  <ShieldCheck size={48} color="var(--accent)" />
                </div>
                <h2 style={{ fontFamily: "var(--font-ratio)", fontSize: 24, marginBottom: 8 }}>Digital Verification Certificate</h2>
                <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 32 }}>
                  This is to certify that the regulated instrument described below has been verified in accordance with Indian Legal Metrology standards.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, textAlign: "left", marginBottom: 32 }}>
                  <div>
                    <div className="field-label">Certificate Number</div>
                    <div className="field-value" style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{certificate.certificateNumber}</div>
                  </div>
                  <div>
                    <div className="field-label">Status</div>
                    <div className="field-value">
                      <StatusBadge value={certificate.status} tone={statusTone(certificate.status)} />
                    </div>
                  </div>
                  <div>
                    <div className="field-label">Valid From</div>
                    <div className="field-value">{new Date(certificate.validFrom).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="field-label">Valid To</div>
                    <div className="field-value" style={{ fontWeight: 700 }}>{new Date(certificate.validTo).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="field-label">Instrument ID</div>
                    <div className="field-value" style={{ fontFamily: "var(--font-mono)" }}>{certificate.instrument.publicInstrumentId}</div>
                  </div>
                  <div>
                    <div className="field-label">Serial Number</div>
                    <div className="field-value" style={{ fontFamily: "var(--font-mono)" }}>{certificate.instrument.serialNumber}</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div style={{ textAlign: "left" }}>
                    <div className="field-label">Issued By</div>
                    <div className="field-value" style={{ fontWeight: 600 }}>{certificate.issuedByName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Legal Metrology Department</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="field-label">Issue Date</div>
                    <div className="field-value">{new Date(certificate.issuedAt).toLocaleDateString("en-IN")}</div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Status History</h2>
            </PanelHeader>
            <PanelBody>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Previous Status</th>
                      <th>New Status</th>
                      <th>Reason</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 20 }}>No history records available.</td>
                      </tr>
                    ) : (
                      history.map((h, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{new Date(h.effectiveAt).toLocaleDateString("en-IN")}</td>
                          <td>{h.previousStatus ?? "—"}</td>
                          <td><StatusBadge value={h.newStatus} tone={statusTone(h.newStatus)} /></td>
                          <td style={{ fontSize: 12 }}>{h.reason ?? "—"}</td>
                          <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{h.notes ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
