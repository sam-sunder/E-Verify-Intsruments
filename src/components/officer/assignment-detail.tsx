"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  CheckCircle,
  Clock,
  ClipboardText,
  Gauge,
  IdentificationCard,
  Play,
  UserCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type OfficerAssignment,
  type Instrument,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "COMPLETED":
    case "PASS":
      return "success";
    case "IN_PROGRESS":
    case "ACCEPTED":
    case "ASSIGNED":
      return "warning";
    case "REJECTED":
    case "FAIL":
    case "CANCELLED":
      return "danger";
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

export function AssignmentDetail({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<OfficerAssignment | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const assignRes = await api.getAssignment(assignmentId);
        if (!active) return;
        setAssignment(assignRes);

        // Fetch instrument details using publicInstrumentId
        if (assignRes.instrument.digitalInstrumentId) {
          const instRes = await api.getInstrument(assignRes.instrument.digitalInstrumentId).catch(() => null);
          if (active && instRes) setInstrument(instRes);
        }

        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load assignment details");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [assignmentId, reloadCounter]);

  async function handleAccept() {
    try {
      setActionLoading(true);
      await api.acceptAssignment(assignmentId);
      setReloadCounter((c) => c + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept assignment");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartVerification() {
    if (!assignment) return;
    try {
      setActionLoading(true);
      if (assignment.status === "ASSIGNED") {
        await api.acceptAssignment(assignmentId);
      }
      if (assignment.status !== "IN_PROGRESS") {
        await api.startAssignment(assignmentId);
      }
      if (assignment.fieldVerification?.id) {
        router.push(`/officer/verifications/${assignment.fieldVerification.id}`);
        return;
      }
      const verification = await api.createAssignmentVerification(assignmentId, {});
      router.push(`/officer/verifications/${verification.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start field verification");
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading assignment details…" />;
  }

  if (error || !assignment) {
    return (
      <ErrorState
        message={error || "Assignment not found"}
        action={
          <Link href="/officer/assignments">
            <Button variant="secondary" icon={<CaretLeft size={16} />}>Back to Assignments</Button>
          </Link>
        }
      />
    );
  }

  const inst = assignment.instrument;
  const app = assignment.application;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Back Link */}
      <div>
        <Link href="/officer/assignments" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--ink-muted)", marginBottom: "8px" }}>
          <CaretLeft size={16} /> Back to Assignments
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Assignment Record #{assignment.id.slice(0, 8)}</span>
            <h1 className="page-heading">{inst.instrumentType} Inspection</h1>
            <p className="page-lede">
              Application #{app.applicationNumber} • Assigned to Officer {assignment.assignedOfficerName}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge value={assignment.status} tone={statusTone(assignment.status)} />
          </div>
        </div>
      </div>

      {/* Action Banner (for Officer) */}
      <Panel className="panel-flat">
        <PanelBody>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <strong style={{ fontSize: "15px", display: "block" }}>
              {assignment.status === "ASSIGNED"
                ? "Inspection Assignment Received"
                : assignment.status === "ACCEPTED"
                ? "Assignment Accepted — Ready for Inspection"
                : assignment.status === "IN_PROGRESS"
                ? "Field Inspection In Progress"
                : "Verification Inspection Completed"}
            </strong>
            <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
              {assignment.status === "ASSIGNED"
                ? "Review the application details and accept the assignment to begin verification."
                : assignment.status === "ACCEPTED"
                ? "Proceed to the physical location to record measurements and evidence photos."
                : assignment.status === "IN_PROGRESS"
                ? "Measurements and evidence capture are currently active for this instrument."
                : "Inspection findings and measurements have been finalized."}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {assignment.status === "ASSIGNED" ? (
              <>
                <Button variant="secondary" disabled={actionLoading} onClick={handleAccept} style={{ minHeight: "44px" }}>
                  {actionLoading ? "Accepting…" : "Accept Assignment"}
                </Button>
                <Button variant="primary" disabled={actionLoading} onClick={handleStartVerification} icon={<Play size={16} weight="bold" />} style={{ minHeight: "44px" }}>
                  Accept & Start Inspection
                </Button>
              </>
            ) : assignment.status === "ACCEPTED" ? (
              <Button variant="primary" disabled={actionLoading} onClick={handleStartVerification} icon={<Play size={16} weight="bold" />} style={{ minHeight: "44px" }}>
                Start Field Verification
              </Button>
            ) : assignment.status === "IN_PROGRESS" ? (
              <Button variant="primary" disabled={actionLoading} onClick={handleStartVerification} icon={<ClipboardText size={18} weight="bold" />} style={{ minHeight: "44px" }}>
                Continue Field Inspection
              </Button>
            ) : assignment.fieldVerification?.id ? (
              <Link href={`/officer/verifications/${assignment.fieldVerification.id}`}>
                <Button variant="secondary" icon={<CheckCircle size={16} />} style={{ minHeight: "44px" }}>
                  View Field Verification Record
                </Button>
              </Link>
            ) : null}
          </div>
          </div>
        </PanelBody>
      </Panel>

      {/* Grid Layout: Instrument Info & Application Details */}
      <div className="shell-grid">
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Instrument Identity Panel */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Instrument Details</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Instrument ID</span>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "700" }}>{inst.digitalInstrumentId}</code>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Serial Number</span>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "700" }}>{inst.serialNumber}</code>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Category</span>
                  <strong style={{ fontSize: "14px" }}>{inst.category}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Type</span>
                  <strong style={{ fontSize: "14px" }}>{inst.instrumentType}</strong>
                </div>
                {instrument ? (
                  <>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Manufacturer</span>
                      <span style={{ fontSize: "14px" }}>{instrument.manufacturer || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Model</span>
                      <span style={{ fontSize: "14px" }}>{instrument.model || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Capacity / Unit</span>
                      <span style={{ fontSize: "14px" }}>{instrument.capacity ? `${instrument.capacity} ${instrument.unitOfMeasure || ""}` : "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Current Location</span>
                      <span style={{ fontSize: "14px" }}>{instrument.currentLocation || "—"}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Registered Owner</span>
                      <strong style={{ fontSize: "14px" }}>{instrument.currentOwnerName}</strong>
                    </div>
                  </>
                ) : null}
              </div>
            </PanelBody>
          </Panel>

          {/* Application Details */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Application Context</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Application Number</span>
                  <strong style={{ fontSize: "14px" }}>{app.applicationNumber}</strong>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Application Type</span>
                  <span style={{ fontSize: "14px" }}>{app.applicationType.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Application Status</span>
                  <StatusBadge value={app.status} tone={statusTone(app.status)} />
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        {/* Timeline & Metadata */}
        <div style={{ display: "grid", gap: "20px", alignContent: "start" }}>
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Assignment Schedule</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--ink-muted)" }}>Assigned On:</span>
                <strong>{formatDate(assignment.assignedAt)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--ink-muted)" }}>Accepted On:</span>
                <strong>{formatDate(assignment.acceptedAt)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--ink-muted)" }}>Target Due Date:</span>
                <strong>{formatDate(assignment.dueDate)}</strong>
              </div>
              {assignment.completedAt ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--ink-muted)" }}>Completed On:</span>
                  <strong style={{ color: "var(--success)" }}>{formatDate(assignment.completedAt)}</strong>
                </div>
              ) : null}

              {assignment.notes ? (
                <div style={{ marginTop: "10px", padding: "12px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }}>
                  <strong style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Administrator Notes:</strong>
                  <span style={{ fontSize: "13px", marginTop: "4px", display: "block" }}>{assignment.notes}</span>
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
