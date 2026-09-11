"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Gauge,
  PaperPlaneTilt,
  PencilSimple,
  ShieldCheck,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type DigitalCertificate,
  type VerificationApplication,
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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

type StepKey = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ASSIGNED" | "VERIFIED" | "CERTIFICATE_ISSUED";

const PIPELINE_STEPS: Array<{ key: StepKey; label: string; sub: string }> = [
  { key: "DRAFT", label: "Draft", sub: "Created" },
  { key: "SUBMITTED", label: "Submitted", sub: "Awaiting review" },
  { key: "UNDER_REVIEW", label: "Under Review", sub: "Documentation check" },
  { key: "ASSIGNED", label: "Officer Assigned", sub: "Inspection scheduled" },
  { key: "VERIFIED", label: "Field Verified", sub: "Tested on premises" },
  { key: "CERTIFICATE_ISSUED", label: "Certificate Issued", sub: "Official stamping" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "DRAFT":
      return 0;
    case "SUBMITTED":
      return 1;
    case "UNDER_REVIEW":
      return 2;
    case "ASSIGNED":
      return 3;
    case "VERIFIED":
      return 4;
    case "CERTIFICATE_ISSUED":
      return 5;
    default:
      return 1;
  }
}

export function ApplicationDetail({ applicationNumber }: { applicationNumber: string }) {
  const [application, setApplication] = useState<VerificationApplication | null>(null);
  const [matchingCertificate, setMatchingCertificate] = useState<DigitalCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editRemarks, setEditRemarks] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const app = await api.getApplication(applicationNumber);
        if (!active) return;
        setApplication(app);
        setEditRemarks(app.remarks || "");

        if (app.status === "CERTIFICATE_ISSUED" || app.status === "VERIFIED") {
          try {
            const certsRes = await api.listCertificates({
              instrumentId: app.instrument.digitalInstrumentId,
              pageSize: 1,
            });
            if (active && certsRes.data.length > 0) {
              setMatchingCertificate(certsRes.data[0]);
            }
          } catch {
            // certificate lookup is non-fatal
          }
        }
        if (active) setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load application details");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [applicationNumber, reloadCounter]);

  async function handleSubmitDraft() {
    if (!application) return;
    setSubmittingDraft(true);
    setError(null);
    try {
      const updated = await api.submitApplication(application.applicationNumber);
      setApplication(updated);
      setActionSuccess("Application successfully submitted to Legal Metrology authorities.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to submit application");
    } finally {
      setSubmittingDraft(false);
    }
  }

  async function handleSaveDraftRemarks(e: React.FormEvent) {
    e.preventDefault();
    if (!application) return;
    setSavingDraft(true);
    setError(null);
    try {
      const updated = await api.updateApplication(application.applicationNumber, {
        remarks: editRemarks.trim() || null,
      });
      setApplication(updated);
      setIsEditingDraft(false);
      setActionSuccess("Draft remarks updated.");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update draft remarks");
    } finally {
      setSavingDraft(false);
    }
  }

  if (loading) return <LoadingState label="Loading application record…" />;
  if (error && !application) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => { setLoading(true); setError(null); setReloadCounter((c) => c + 1); }}>Retry</Button>} />;
  if (!application) return <ErrorState message="Application not found" />;

  const isTerminalNegative = application.status === "REJECTED" || application.status === "CANCELLED";
  const currentIndex = getStepIndex(application.status);

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/applications">Applications</Link>
        <span>/</span>
        <span>{application.applicationNumber}</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Verification Application</div>
          <h1 className="page-heading">{application.applicationNumber}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <StatusBadge value={application.status} tone={statusTone(application.status)} />
            <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
              Type: <strong>{application.applicationType.replaceAll("_", " ")}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {application.status === "DRAFT" ? (
            <>
              <Button
                variant="secondary"
                icon={<PencilSimple size={15} />}
                onClick={() => setIsEditingDraft(!isEditingDraft)}
              >
                {isEditingDraft ? "Cancel Edit" : "Edit Remarks"}
              </Button>
              <Button
                variant="primary"
                disabled={submittingDraft}
                onClick={() => void handleSubmitDraft()}
                icon={<PaperPlaneTilt size={16} />}
              >
                {submittingDraft ? "Submitting…" : "Submit Application"}
              </Button>
            </>
          ) : null}

          {matchingCertificate ? (
            <Link href={`/certificates/${encodeURIComponent(matchingCertificate.certificateNumber)}`}>
              <Button variant="primary" icon={<ShieldCheck size={16} />}>
                View Digital Certificate
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {actionSuccess ? (
        <div className="alert-banner alert-banner-success">
          <div className="alert-banner-body">
            <strong><CheckCircle size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} /> Action Completed</strong>
            <p>{actionSuccess}</p>
          </div>
        </div>
      ) : null}

      {/* Visual Lifecycle Stepper */}
      <div style={{ marginBottom: 24 }}>
        <Panel>
          <PanelBody>
            <div style={{ padding: "8px 0" }}>
              <span className="spec-label" style={{ marginBottom: 12, display: "block" }}>
                Lifecycle Status Pipeline
              </span>

              {isTerminalNegative ? (
                <div className="alert-banner alert-banner-danger" style={{ margin: "10px 0 0" }}>
                  <div className="alert-banner-body">
                    <strong>Application {application.status}</strong>
                    <p>
                      This application cannot proceed further in its current state. Please review officer remarks or file a new application if required.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="stepper">
                  {PIPELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex || application.status === "CERTIFICATE_ISSUED";
                    const isActive = idx === currentIndex && application.status !== "CERTIFICATE_ISSUED";
                    return (
                      <div
                        key={step.key}
                        className={`step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                      >
                        <div className="step-circle">
                          {isCompleted ? <CheckCircle size={18} weight="fill" /> : idx + 1}
                        </div>
                        <div className="step-label">{step.label}</div>
                        <div className="step-sub">{step.sub}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </PanelBody>
        </Panel>
      </div>

      {/* Edit Draft Form */}
      {isEditingDraft && application.status === "DRAFT" ? (
        <div style={{ marginBottom: 24 }}>
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Edit Draft Remarks</h2>
                <p className="field-hint">Modify your notes prior to official submission.</p>
              </div>
              <Button variant="quiet" onClick={() => setIsEditingDraft(false)} icon={<X size={15} />}>Close</Button>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleSaveDraftRemarks}>
                <Field label="Remarks & Access Guidance">
                  <TextArea
                    rows={4}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                  />
                </Field>
                <div className="form-actions">
                  <Button type="button" variant="quiet" onClick={() => setIsEditingDraft(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={savingDraft}>
                    {savingDraft ? "Saving…" : "Save Remarks"}
                  </Button>
                </div>
              </form>
            </PanelBody>
          </Panel>
        </div>
      ) : null}

      <div className="shell-grid">
        {/* Left Column: Application Details */}
        <div style={{ display: "grid", gap: 24 }}>
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Application Metadata</h2>
                <p className="field-hint">Official submission particulars and review status.</p>
              </div>
            </PanelHeader>
            <PanelBody>
              <div className="specs-grid">
                <div className="spec-box">
                  <span className="spec-label">Application Number</span>
                  <span className="spec-value" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-strong)" }}>
                    {application.applicationNumber}
                  </span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Application Type</span>
                  <span className="spec-value">{application.applicationType.replaceAll("_", " ")}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Submission Date</span>
                  <span className="spec-value">{formatDate(application.submittedAt)}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Administrative Review Date</span>
                  <span className="spec-value">{formatDate(application.reviewedAt)}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Target Inspection Due Date</span>
                  <span className="spec-value">{formatDate(application.dueDate)}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Submitted By</span>
                  <span className="spec-value">{application.submittedByName}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Reviewing Authority</span>
                  <span className="spec-value">{application.reviewedByName || "Pending Assignment"}</span>
                </div>
              </div>

              {application.remarks ? (
                <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)" }}>
                  <span className="spec-label" style={{ marginBottom: 6, display: "block" }}>
                    Applicant Remarks & Instructions
                  </span>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>
                    {application.remarks}
                  </p>
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        </div>

        {/* Right Column: Associated Instrument Card */}
        <div style={{ display: "grid", gap: 24 }}>
          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">Target Regulated Instrument</h2>
              <div style={{ marginTop: 14 }}>
                <div style={{ padding: "12px 14px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent-strong)", fontWeight: 700 }}>
                    {application.instrument.digitalInstrumentId}
                  </span>
                  <strong style={{ display: "block", fontSize: 15, marginTop: 4 }}>
                    {application.instrument.instrumentType}
                  </strong>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                    Category: {application.instrument.category}
                  </span>
                </div>

                <div className="shell-list">
                  <div className="shell-list-row">
                    <span>Serial Number</span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>{application.instrument.serialNumber}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Link href={`/instruments/${encodeURIComponent(application.instrument.digitalInstrumentId)}`}>
                    <Button variant="secondary" style={{ width: "100%" }} icon={<Gauge size={16} />}>
                      View Instrument Passport
                    </Button>
                  </Link>
                </div>
              </div>
            </PanelBody>
          </section>

          {/* Stamping Info Box */}
          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">Inspection Expectations</h2>
              <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8, lineHeight: 1.5 }}>
                During field verification, an authorized Legal Metrology Officer will arrive at your premises to inspect working standards, conduct calibration error tests, and apply official tamper-evident stamping.
              </p>
            </PanelBody>
          </section>
        </div>
      </div>
    </>
  );
}
