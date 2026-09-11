"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardText,
  CheckCircle,
  Clock,
  FileText,
  Gauge,
  UsersThree,
  ShieldCheck,
  ArrowRight,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type ComplianceSummary,
  type DigitalCertificate,
  type VerificationApplication,
  type OfficerAssignment,
  type ApplicationStatus,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
    case "PASS":
    case "VERIFIED":
    case "CERTIFICATE_ISSUED":
    case "COMPLIANT":
      return "success";
    case "WARNING":
    case "DUE_SOON":
    case "UPCOMING":
    case "UNDER_REVIEW":
    case "ASSIGNED":
      return "warning";
    case "CRITICAL":
    case "EXPIRED":
    case "FAIL":
    case "REJECTED":
    case "NON_COMPLIANT":
    case "SUSPENDED":
    case "REVOKED":
      return "danger";
    case "SUBMITTED":
    case "INITIAL_VERIFICATION":
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
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function AdminDashboard({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [assignments, setAssignments] = useState<OfficerAssignment[]>([]);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [appRes, assignRes, compRes] = await Promise.all([
          api.listApplications({ status: "SUBMITTED", pageSize: 5 }),
          api.listAssignments({ status: "IN_PROGRESS", pageSize: 5 }),
          api.getComplianceSummary().catch(() => null),
        ]);

        if (!active) return;
        setApplications(appRes.data);
        setAssignments(assignRes.data);
        setCompliance(compRes);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load administrator dashboard data");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  if (loading) {
    return <LoadingState label="Loading Administrator Command Center…" />;
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
              setRefreshIndex((i) => i + 1);
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  const pendingAppsCount = applications.length;
  const activeFieldOpsCount = assignments.length;
  const criticalComplianceCount = (compliance?.totals.EXPIRED ?? 0) + (compliance?.totals.CRITICAL ?? 0);

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Control Plane</div>
          <h1 className="page-heading">Command Center</h1>
          <p className="page-lede">
            Welcome, {userName.split(" ")[0]}. Oversee Legal Metrology compliance, manage officer assignments, and review verification applications.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/users">
            <Button variant="secondary" icon={<UsersThree size={16} />}>Manage Users</Button>
          </Link>
          <Link href="/admin/compliance">
            <Button variant="primary" icon={<ShieldCheck size={16} />}>Compliance Overview</Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Pending Review</div>
          <div className="metric-value" style={{ color: "var(--info)" }}>
            {pendingAppsCount}
          </div>
          <div className="metric-sub">
            <FileText size={14} /> Applications awaiting action
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Field Ops</div>
          <div className="metric-value" style={{ color: "var(--warning)" }}>
            {activeFieldOpsCount}
          </div>
          <div className="metric-sub">
            <ClipboardText size={14} /> Verifications in progress
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Compliance Risk</div>
          <div
            className="metric-value"
            style={{ color: criticalComplianceCount > 0 ? "var(--danger)" : "var(--ink-muted)" }}
          >
            {criticalComplianceCount}
          </div>
          <div className="metric-sub">
            <Warning size={14} /> Expired or critical certificates
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          {/* Applications Awaiting Review */}
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Applications Awaiting Review</h2>
                <p className="field-hint">New verification requests requiring administrative action.</p>
              </div>
              <Link href="/admin/applications" className="link-action">
                View queue <ArrowRight size={14} />
              </Link>
            </PanelHeader>
            <PanelBody>
              {applications.length === 0 ? (
                <EmptyState
                  title="No applications awaiting review"
                  description="All submitted applications have been processed or assigned to officers."
                />
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {applications.map((app) => (
                    <div
                      key={app.applicationNumber}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "grid", gap: "4px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Link
                            href={`/admin/applications/${encodeURIComponent(app.applicationNumber)}`}
                            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)", fontSize: "15px" }}
                          >
                            {app.applicationNumber}
                          </Link>
                          <StatusBadge value={app.status} tone={statusTone(app.status)} />
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600 }}>
                          {app.instrument.instrumentType}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", gap: "12px" }}>
                          <span>{app.applicationType.replaceAll("_", " ")}</span>
                          <span>Serial: <code style={{ fontFamily: "var(--font-mono)" }}>{app.instrument.serialNumber}</code></span>
                          <span>Submitted: {formatDate(app.submittedAt)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "grid", gap: "8px" }}>
                        <Link href={`/admin/applications/${encodeURIComponent(app.applicationNumber)}`}>
                          <Button variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          {/* Active Field Operations */}
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Active Field Operations</h2>
                <p className="field-hint">Current verification assignments in the field.</p>
              </div>
              <Link href="/admin/assignments" className="link-action">
                Manage assignments <ArrowRight size={14} />
              </Link>
            </PanelHeader>
            <PanelBody>
              {assignments.length === 0 ? (
                <EmptyState
                  title="No active field operations"
                  description="There are currently no assignments in progress."
                />
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {assignments.map((asn) => (
                    <div
                      key={asn.id}
                      style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ display: "grid", gap: "4px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--ink)", fontSize: "15px" }}>{asn.id}</span>
                          <StatusBadge value={asn.status} tone={statusTone(asn.status)} />
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600 }}>
                          {asn.assignedOfficerName}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", gap: "12px" }}>
                          <span>{asn.instrument.instrumentType}</span>
                          <span>Serial: <code style={{ fontFamily: "var(--font-mono)" }}>{asn.instrument.serialNumber}</code></span>
                          <span>Due: {formatDate(asn.dueDate)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "grid", gap: "8px" }}>
                        <Link href={`/admin/assignments/${encodeURIComponent(asn.id)}`}>
                          <Button variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Details</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Compliance Alerts */}
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Compliance Alerts</h2>
                <p className="field-hint">Certificates requiring immediate attention.</p>
              </div>
              <Link href="/admin/compliance" className="link-action">
                View all <ArrowRight size={14} />
              </Link>
            </PanelHeader>
            <PanelBody>
              {(!compliance || (compliance.totals.EXPIRED === 0 && compliance.totals.CRITICAL === 0)) ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--success)", fontSize: 13 }}>
                  <CheckCircle size={16} /> No critical compliance issues.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {compliance?.certificates
                    .filter((c) => c.state === "EXPIRED" || c.state === "CRITICAL")
                    .slice(0, 5)
                    .map((c) => (
                      <div
                        key={c.certificateNumber}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-soft)",
                          borderLeft: "3px solid var(--danger)",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {c.certificateNumber}
                          <StatusBadge value={c.state} tone="danger" />
                        </div>
                        <div style={{ color: "var(--ink-muted)", fontSize: 12, lineHeight: 1.4 }}>
                          Instrument {c.instrumentId} - Valid until {formatDate(c.validTo)}
                        </div>
                        <Link
                          href={`/admin/certificates/${encodeURIComponent(c.certificateNumber)}`}
                          style={{ fontSize: 11, color: "var(--accent-strong)", textDecoration: "underline", marginTop: 4, display: "block" }}
                        >
                          Manage Certificate
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          {/* System Quick Access */}
          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">System Quick Access</h2>
              <div className="shell-list" style={{ marginTop: 14 }}>
                <div className="shell-list-row">
                  <Link href="/admin/users" style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <UsersThree size={18} />
                      <div>
                        <strong style={{ display: "block" }}>User Management</strong>
                        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Create and manage officer/owner profiles.</span>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="shell-list-row">
                  <Link href="/admin/instruments" style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Gauge size={18} />
                      <div>
                        <strong style={{ display: "block" }}>Instrument Registry</strong>
                        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Global directory of regulated equipment.</span>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="shell-list-row">
                  <Link href="/admin/audit" style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Clock size={18} />
                      <div>
                        <strong style={{ display: "block" }}>Audit Trails</strong>
                        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Historical records of all system changes.</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </PanelBody>
          </section>
        </div>
      </div>
    </>
  );
}
