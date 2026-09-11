"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowsClockwise,
  CheckCircle,
  FileText,
  Gauge,
  Plus,
  Warning,
  Clock,
  ArrowRight,
  Bell,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type ComplianceSummary,
  type DigitalCertificate,
  type Instrument,
  type NotificationItem,
  type VerificationApplication,
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

export function BusinessOwnerDashboard({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [now, setNow] = useState(0);

  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [instRes, appRes, certRes, compRes, notifRes] = await Promise.all([
          api.listInstruments({ pageSize: 5 }),
          api.listApplications({ pageSize: 5 }),
          api.listCertificates({ pageSize: 5 }),
          api.getComplianceSummary().catch(() => null),
          api.listNotifications({ pageSize: 4 }).catch(() => ({ data: [], pagination: { page: 1, pageSize: 4, totalItems: 0, totalPages: 0 } })),
        ]);

        if (!active) return;
        setInstruments(instRes.data);
        setApplications(appRes.data);
        setCertificates(certRes.data);
        setCompliance(compRes);
        setNotifications(notifRes.data);
        setNow(Date.now());
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load dashboard data");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  if (loading) {
    return <LoadingState label="Loading Business Owner dashboard…" />;
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

  const validCount = compliance?.totals.VALID ?? certificates.filter((c) => c.status === "ACTIVE").length;
  const actionRequiredCount =
    (compliance?.totals.EXPIRED ?? 0) +
    (compliance?.totals.CRITICAL ?? 0) +
    (compliance?.totals.DUE_SOON ?? 0) +
    (compliance?.totals.UPCOMING ?? 0);
  const inFlightAppsCount = applications.filter(
    (a) => !["CERTIFICATE_ISSUED", "REJECTED", "CANCELLED"].includes(a.status)
  ).length;

  const urgentCertificates = certificates.filter(
    (c) =>
      c.status === "EXPIRED" ||
      c.status === "SUSPENDED" ||
      (now > 0 && c.validTo && new Date(c.validTo).getTime() - now < 30 * 86400000)
  );

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Business Owner Workspace</div>
          <h1 className="page-heading">Legal Metrology Operations</h1>
          <p className="page-lede">
            Welcome back, {userName.split(" ")[0]}. Monitor regulated weighing and measuring instruments, certificate validity, and statutory verification inspections.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/instruments/register">
            <Button variant="secondary" icon={<Plus size={16} />}>Register Instrument</Button>
          </Link>
          <Link href="/applications/new">
            <Button variant="primary" icon={<FileText size={16} />}>New Application</Button>
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Registered Instruments</div>
          <div className="metric-value">{instruments.length}</div>
          <div className="metric-sub">
            <Gauge size={14} /> Total regulated equipment
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Valid & Compliant</div>
          <div className="metric-value" style={{ color: "var(--success)" }}>
            {validCount}
          </div>
          <div className="metric-sub" style={{ color: "var(--success)" }}>
            <CheckCircle size={14} /> Active legal stamping
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Action Required / Expiring</div>
          <div
            className="metric-value"
            style={{ color: actionRequiredCount > 0 ? "var(--warning)" : "var(--ink-muted)" }}
          >
            {actionRequiredCount}
          </div>
          <div className="metric-sub">
            <Clock size={14} /> Within expiry / overdue window
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Applications In Flight</div>
          <div className="metric-value" style={{ color: "var(--info)" }}>
            {inFlightAppsCount}
          </div>
          <div className="metric-sub">
            <FileText size={14} /> Review & inspection pending
          </div>
        </div>
      </div>

      {/* Urgent Alert Banner */}
      {urgentCertificates.length > 0 ? (
        <div className="alert-banner alert-banner-warning">
          <div className="alert-banner-body">
            <strong>
              <Warning size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} />
              Re-Verification Required: {urgentCertificates.length} instrument(s) need immediate compliance renewal
            </strong>
            <p>
              Legal metrology regulations mandate valid certificates prior to commercial use. Initiate re-verification to prevent compliance disruption or penalties.
            </p>
          </div>
          <Link
            href={`/applications/new?instrumentId=${encodeURIComponent(
              urgentCertificates[0].instrument.publicInstrumentId
            )}&type=RE_VERIFICATION&previousApplicationId=${encodeURIComponent(
              urgentCertificates[0].applicationNumber
            )}`}
          >
            <Button variant="primary" icon={<ArrowsClockwise size={16} />}>Re-Verify Now</Button>
          </Link>
        </div>
      ) : null}

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: "24px",
        width: "100%",
        alignItems: "start"
      }}>
        <div style={{
          minWidth: 0,
          overflow: "hidden"
        }}>
          <div style={{ display: "grid", gap: "24px" }}>
            {/* Instruments / Expiry Attention */}
            <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Instruments & Expiry Status</h2>
                <p className="field-hint">Status of certificates and next scheduled verification dates.</p>
              </div>
              <Link href="/instruments" className="link-action">
                View all instruments <ArrowRight size={14} />
              </Link>
            </PanelHeader>
            <PanelBody>
              {instruments.length === 0 ? (
                <EmptyState
                  title="No instruments registered"
                  description="Register your regulated weighing and measuring instruments to begin tracking compliance and verification."
                />
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {instruments.map((inst) => (
                    <div
                      key={inst.publicInstrumentId}
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
                            href={`/instruments/${encodeURIComponent(inst.publicInstrumentId)}`}
                            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)", fontSize: "15px" }}
                          >
                            {inst.publicInstrumentId}
                          </Link>
                          <StatusBadge value={inst.status} tone={statusTone(inst.status)} />
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 600 }}>
                          {inst.instrumentType}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink-muted)", display: "flex", gap: "12px" }}>
                          <span>{inst.category}</span>
                          <span>Serial: <code style={{ fontFamily: "var(--font-mono)" }}>{inst.serialNumber}</code></span>
                          <span>{inst.currentLocation ?? "No location set"}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "grid", gap: "8px" }}>
                        <div style={{ fontSize: "11px", color: "var(--ink-muted)", textTransform: "uppercase", fontWeight: 600 }}>Next Due</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatDate(inst.nextDueDate)}</div>
                        <Link href={`/instruments/${encodeURIComponent(inst.publicInstrumentId)}`}>
                          <Button variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Passport</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          {/* Recent Applications */}
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Recent Verification Applications</h2>
                <p className="field-hint">Applications submitted for administrative review and officer inspection.</p>
              </div>
              <Link href="/applications" className="link-action">
                View all applications <ArrowRight size={14} />
              </Link>
            </PanelHeader>
            <PanelBody>
              {applications.length === 0 ? (
                <EmptyState
                  title="No applications filed"
                  description="When you file a verification or re-verification application, tracking and status updates will appear here."
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
                            href={`/applications/${encodeURIComponent(app.applicationNumber)}`}
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
                        <Link href={`/applications/${encodeURIComponent(app.applicationNumber)}`}>
                          <Button variant="secondary" style={{ fontSize: 12, padding: "6px 12px" }}>Track</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>

        {/* Sidebar Column */}
        <div style={{
          display: "grid",
          gap: "24px",
          width: "300px"
        }}>
          {/* Notifications */}
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Notifications & Alerts</h2>
                <p className="field-hint">Compliance notices and status changes.</p>
              </div>
              <Link href="/notifications" className="link-action">
                <Bell size={14} /> All
              </Link>
            </PanelHeader>
            <PanelBody>
              {notifications.length === 0 ? (
                <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: "10px 0" }}>No unread notifications.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: n.isRead ? "transparent" : "var(--surface-soft)",
                        borderLeft: n.isRead ? "1px solid var(--line)" : "3px solid var(--accent)",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{n.title}</div>
                      <div style={{ color: "var(--ink-muted)", fontSize: 12, lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                        {formatDate(n.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          {/* Regulatory Guidance */}
          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">Legal Metrology Guidance</h2>
              <div className="shell-list" style={{ marginTop: 14 }}>
                <div className="shell-list-row">
                  <div>
                    <strong>Mandatory Stamping</strong>
                    <span>All commercial instruments require periodic verification and physical/digital stamping.</span>
                  </div>
                </div>
                <div className="shell-list-row">
                  <div>
                    <strong>Re-Verification Window</strong>
                    <span>Apply at least 30 days prior to certificate expiry to allow officer scheduling.</span>
                  </div>
                </div>
                <div className="shell-list-row">
                  <div>
                    <strong>Public QR Verification</strong>
                    <span>Customers and inspectors can scan the certificate QR code without authentication.</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <Link href="/verify">
                  <Button variant="secondary" style={{ width: "100%" }}>
                    Test Public Certificate Lookup
                  </Button>
                </Link>
              </div>
            </PanelBody>
          </section>
        </div>
      </div>
    </>
  );
}
