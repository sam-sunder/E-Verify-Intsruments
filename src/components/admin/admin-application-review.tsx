"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Warning,
  Gauge,
  ShieldCheck
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { api, type VerificationApplication } from "@/lib/api-client";
import { useSession } from "@/lib/auth/session-provider";

const PIPELINE_STEPS = [
  { id: "SUBMITTED", label: "Submitted", description: "Application received and awaiting initial review" },
  { id: "UNDER_REVIEW", label: "Under Review", description: "Administrator is reviewing the application details" },
  { id: "ASSIGNED", label: "Assigned", description: "An officer has been assigned for field verification" },
  { id: "VERIFIED", label: "Verified", description: "Field verification completed successfully" },
  { id: "CERTIFICATE_ISSUED", label: "Certified", description: "Digital certificate has been issued" },
];

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

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    "SUBMITTED": 0,
    "UNDER_REVIEW": 1,
    "ASSIGNED": 2,
    "VERIFIED": 3,
    "CERTIFICATE_ISSUED": 4,
  };
  return map[status] ?? -1;
}

export function AdminApplicationReview({ applicationNumber }: { applicationNumber: string }) {
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<VerificationApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !user) return;

    async function loadData() {
      setLoading(true);
      try {
        const app = await api.getApplication(applicationNumber);
        setApplication(app);
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load application details");
        setLoading(false);
      }
    }
    void loadData();
  }, [applicationNumber, sessionLoading, user]);

  async function handleAction(action: "start" | "approve" | "reject" | "cancel", input?: { reason: string }) {
    setActionLoading(action);
    try {
      if (action === "start") await api.startApplicationReview(applicationNumber);
      if (action === "approve") await api.approveApplication(applicationNumber);
      if (action === "reject") await api.rejectApplication(applicationNumber, input || { reason: "Rejected by administrator" });
      if (action === "cancel") await api.cancelApplication(applicationNumber, input || { reason: "Cancelled by administrator" });

      // Refresh data
      const updated = await api.getApplication(applicationNumber);
      setApplication(updated);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Form states: Certificate Issuance
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [certValidTo, setCertValidTo] = useState("");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (isIssueModalOpen) {
      setCertValidTo(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    }
  }, [isIssueModalOpen]);

  async function handleIssueCertificate() {
    if (!certValidTo) {
      alert("Please enter a validity date");
      return;
    }

    setIssuing(true);
    try {
      const verification = await api.getVerificationByApplication(applicationNumber);
      await api.issueCertificate({
        verificationId: verification.id,
        validTo: certValidTo,
      });

      alert("Digital certificate issued successfully");
      setIsIssueModalOpen(false);
      const updated = await api.getApplication(applicationNumber);
      setApplication(updated);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Certificate issuance failed");
    } finally {
      setIssuing(false);
    }
  }

  if (sessionLoading || loading) return <LoadingState label="Loading application details…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;
  if (!application) return <EmptyState title="Application not found" description="The requested application could not be located." />;

  const currentStepIndex = getStepIndex(application.status);

  return (
    <>
      <div className="heading-row">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/applications">
            <Button variant="quiet" icon={<ArrowLeft size={16} />} />
          </Link>
          <div>
            <div className="eyebrow">Application Review</div>
            <h1 className="page-heading">{application.applicationNumber}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {application.status === "SUBMITTED" && (
            <Button
              variant="primary"
              onClick={() => handleAction("start")}
              disabled={actionLoading === "start"}
              icon={<FileText size={16} />}
            >
              {actionLoading === "start" ? "Starting..." : "Start Review"}
            </Button>
          )}
          {application.status === "UNDER_REVIEW" && (
            <>
              <Button
                variant="secondary"
                onClick={() => handleAction("reject")}
                disabled={actionLoading === "reject"}
                icon={<XCircle size={16} />}
              >
                {actionLoading === "reject" ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleAction("approve")}
                disabled={actionLoading === "approve"}
                icon={<CheckCircle size={16} />}
              >
                {actionLoading === "approve" ? "Approving..." : "Approve & Assign"}
              </Button>
            </>
          )}
          {application.status === "VERIFIED" && (
            <Button
              variant="primary"
              onClick={() => setIsIssueModalOpen(true)}
              icon={<ShieldCheck size={16} />}
            >
              Issue Digital Certificate
            </Button>
          )}
          {application.status !== "CERTIFICATE_ISSUED" && application.status !== "REJECTED" && application.status !== "CANCELLED" && (
            <Button
              variant="quiet"
              onClick={() => handleAction("cancel")}
              disabled={actionLoading === "cancel"}
              icon={<Warning size={16} />}
            >
              {actionLoading === "cancel" ? "Cancelling..." : "Cancel Application"}
            </Button>
          )}
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          {/* Lifecycle Stepper */}
          <Panel>
            <PanelBody>
              <div className="lifecycle-stepper" style={{ display: "flex", justifyContent: "space-between", position: "relative", padding: "20px 0" }}>
                {PIPELINE_STEPS.map((step, index) => (
                  <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, width: 120 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: index <= currentStepIndex ? "var(--accent)" : "var(--border)",
                        color: index <= currentStepIndex ? "var(--surface)" : "var(--ink-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        transition: "all 0.2s",
                      }}
                    >
                      {index < currentStepIndex ? <CheckCircle size={16} /> : index + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: "center" }}>{step.label}</span>
                    <span style={{ fontSize: 10, color: "var(--ink-muted)", textAlign: "center", marginTop: 4 }}>{step.description}</span>
                  </div>
                ))}
                {/* Connector Line */}
                <div style={{
                  position: "absolute",
                  top: "calc(50% - 16px)",
                  left: "5%",
                  right: "5%",
                  height: 2,
                  background: "var(--border)",
                  zIndex: 0,
                }} />
              </div>
            </PanelBody>
          </Panel>

          {/* Application Details */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Application Details</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
                <div>
                  <div className="field-label">Application Type</div>
                  <div className="field-value">{application.applicationType.replaceAll("_", " ")}</div>
                </div>
                <div>
                  <div className="field-label">Status</div>
                  <div className="field-value">
                    <StatusBadge value={application.status} tone={statusTone(application.status)} />
                  </div>
                </div>
                <div>
                  <div className="field-label">Submitted At</div>
                  <div className="field-value">{new Date(application.submittedAt).toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div className="field-label">Due Date</div>
                  <div className="field-value">{application.dueDate ? new Date(application.dueDate).toLocaleDateString("en-IN") : "—"}</div>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <div className="field-label">Remarks</div>
                <div className="field-value" style={{ background: "var(--surface-soft)", padding: 12, borderRadius: "var(--radius-sm)", minHeight: 60 }}>
                  {application.remarks ?? "No remarks provided."}
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* Instrument Summary */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Instrument Information</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
                <div>
                  <div className="field-label">Type</div>
                  <div className="field-value">{application.instrument.instrumentType}</div>
                </div>
                <div>
                  <div className="field-label">Serial Number</div>
                  <div className="field-value" style={{ fontFamily: "var(--font-mono)" }}>{application.instrument.serialNumber}</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Link href={`/admin/instruments/${encodeURIComponent(application.instrument.digitalInstrumentId)}`}>
                  <Button variant="secondary" icon={<Gauge size={16} />}>View Instrument Passport</Button>
                </Link>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
      {/* Certificate Issuance Modal */}
      <IssueCertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onConfirm={handleIssueCertificate}
        validTo={certValidTo}
        setValidTo={setCertValidTo}
        isProcessing={issuing}
      />
    </>
  );
}

export function IssueCertificateModal({
  isOpen,
  onClose,
  onConfirm,
  validTo,
  setValidTo,
  isProcessing
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validTo: string;
  setValidTo: (val: string) => void;
  isProcessing: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
      <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "var(--radius-md)", maxWidth: "400px", width: "100%", display: "grid", gap: "20px", boxShadow: "var(--shadow)" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px" }}>Issue Digital Certificate</h3>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "var(--ink-muted)" }}>
            Specify the validity period for the digital certificate.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="field-label">Expiry Date</label>
          <input
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            style={{
              padding: "10px 12px",
              height: "42px",
              borderRadius: "2px",
              border: "1px solid var(--border)",
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isProcessing} icon={<CheckCircle size={16} />}>
            {isProcessing ? "Issuing..." : "Confirm & Issue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
