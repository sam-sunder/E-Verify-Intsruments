"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  ClipboardText,
  FileText,
  Gauge,
  ListChecks,
  Warning,
  ArrowRight,
  ShieldCheck,
  Play,
  Check,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type OfficerAssignment,
  type NotificationItem,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "COMPLETED":
    case "PASS":
      return "success";
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "ACCEPTED":
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
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function OfficerDashboard({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<OfficerAssignment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [assignRes, notifRes] = await Promise.all([
          api.listAssignments({ pageSize: 10 }),
          api.listNotifications({ pageSize: 4 }).catch(() => ({ data: [], pagination: { page: 1, pageSize: 4, totalItems: 0, totalPages: 0 } })),
        ]);

        if (!active) return;
        setAssignments(assignRes.data);
        setNotifications(notifRes.data);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load officer dashboard");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [refreshIndex]);

  if (loading) {
    return <LoadingState label="Loading Officer dashboard…" />;
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

  const assignedCount = assignments.filter((a) => a.status === "ASSIGNED").length;
  const inProgressCount = assignments.filter((a) => a.status === "ACCEPTED" || a.status === "IN_PROGRESS").length;
  const completedCount = assignments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="shell-grid-container" style={{ display: "grid", gap: "24px" }}>
      {/* Officer Welcome Banner */}
      <section className="shell-intro">
        <div>
          <span className="eyebrow">Field Inspection Portal</span>
          <h1 className="page-heading">Legal Metrology Officer Workspace</h1>
          <p className="page-lede">
            Welcome back, <strong>{userName}</strong>. Conduct on-site inspections, record precision measurements, capture photos, and finalize legal metrology verifications.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Link href="/officer/assignments">
            <Button variant="primary" icon={<ListChecks size={18} />}>
              My Assignments ({assignments.length})
            </Button>
          </Link>
        </div>
      </section>

      {/* Overview Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <Panel>
          <PanelBody>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Pending Acceptance</span>
                <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px", color: assignedCount > 0 ? "var(--warning)" : "var(--ink)" }}>{assignedCount}</div>
              </div>
              <div style={{ padding: "10px", background: "var(--warning-soft)", borderRadius: "var(--radius-sm)", color: "var(--warning)" }}>
                <Clock size={24} weight="bold" />
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "8px" }}>Assignments awaiting officer review</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelBody>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>In Progress</span>
                <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px", color: "var(--accent-strong)" }}>{inProgressCount}</div>
              </div>
              <div style={{ padding: "10px", background: "var(--accent-soft)", borderRadius: "var(--radius-sm)", color: "var(--accent-strong)" }}>
                <ClipboardText size={24} weight="bold" />
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "8px" }}>Ready for field inspection</p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelBody>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Completed</span>
                <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "4px", color: "var(--success)" }}>{completedCount}</div>
              </div>
              <div style={{ padding: "10px", background: "var(--success-soft)", borderRadius: "var(--radius-sm)", color: "var(--success)" }}>
                <CheckCircle size={24} weight="bold" />
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "8px" }}>Verified and submitted</p>
          </PanelBody>
        </Panel>
      </div>

      {/* Main Grid: Active Assignments & Quick Links */}
      <div className="shell-grid">
        <Panel>
          <PanelHeader>
            <div>
              <h2 className="section-heading">Assigned Inspection Tasks</h2>
              <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>Recent verification applications requiring officer action</span>
            </div>
            <Link href="/officer/assignments">
              <Button variant="quiet" icon={<ArrowRight size={16} />}>View all</Button>
            </Link>
          </PanelHeader>
          <PanelBody>
            {assignments.length === 0 ? (
              <EmptyState
                title="No active assignments"
                description="You currently have no pending field verification assignments."
              />
            ) : (
              <div className="shell-list">
                {assignments.slice(0, 6).map((assignment) => {
                  const inst = assignment.instrument;
                  const app = assignment.application;
                  return (
                    <div key={assignment.id} className="shell-list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <strong>{inst.instrumentType}</strong>
                            <StatusBadge value={assignment.status} tone={statusTone(assignment.status)} />
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--ink-muted)", marginTop: "2px" }}>
                            Serial: <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{inst.serialNumber}</code> • App #{app.applicationNumber}
                          </div>
                          {assignment.dueDate ? (
                            <div style={{ fontSize: "12px", color: "var(--ink-faint)", marginTop: "2px" }}>
                              Due Date: {formatDate(assignment.dueDate)}
                            </div>
                          ) : null}
                        </div>

                        <Link href={`/officer/assignments/${assignment.id}`}>
                          <Button variant="secondary" style={{ padding: "8px 14px", minHeight: "36px", fontSize: "13px" }}>
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </PanelBody>
        </Panel>

        {/* Sidebar: Guidelines & Quick Info */}
        <div style={{ display: "grid", gap: "18px", alignContent: "start" }}>
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Field Protocols</h2>
            </PanelHeader>
            <PanelBody>
              <ul style={{ paddingLeft: "18px", margin: 0, display: "grid", gap: "10px", fontSize: "13px", color: "var(--ink-muted)" }}>
                <li>Confirm serial number & location before entering measurements.</li>
                <li>Standard mass/reference values must match certified standards.</li>
                <li>At least 1 primary evidence photo (seal, stamp, plate) is required.</li>
                <li>Finalized records are legally binding and immutable.</li>
              </ul>
            </PanelBody>
          </Panel>

          {notifications.length > 0 ? (
            <Panel>
              <PanelHeader>
                <h2 className="section-heading">Notifications</h2>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: "grid", gap: "10px" }}>
                  {notifications.slice(0, 3).map((item) => (
                    <div key={item.id} style={{ padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: item.isRead ? "transparent" : "var(--surface-soft)" }}>
                      <strong style={{ fontSize: "13px", display: "block" }}>{item.title}</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{item.message}</span>
                    </div>
                  ))}
                </div>
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
