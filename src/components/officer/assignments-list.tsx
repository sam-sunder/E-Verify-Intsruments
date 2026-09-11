"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  ClipboardText,
  MagnifyingGlass,
  Play,
  ArrowRight,
  ListChecks,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type AssignmentStatus,
  type OfficerAssignment,
  type Pagination,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
    case "ACCEPTED":
    case "ASSIGNED":
      return "warning";
    case "REJECTED":
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

export function AssignmentsList() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<OfficerAssignment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [activeQuery, setActiveQuery] = useState("");
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchAssignments() {
      try {
        const res = await api.listAssignments({
          query: activeQuery.trim() || undefined,
          status: (statusFilter as AssignmentStatus) || undefined,
          page,
          pageSize: 10,
        });
        if (!active) return;
        setAssignments(res.data);
        setPagination(res.pagination);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load assignments");
        setLoading(false);
      }
    }

    void fetchAssignments();
    return () => {
      active = false;
    };
  }, [activeQuery, statusFilter, page, reloadCounter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setActiveQuery(query);
  }

  async function handleAccept(assignmentId: string) {
    try {
      setActionLoadingId(assignmentId);
      await api.acceptAssignment(assignmentId);
      setReloadCounter((c) => c + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept assignment");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStartVerification(assignment: OfficerAssignment) {
    try {
      setActionLoadingId(assignment.id);
      if (assignment.status === "ASSIGNED") {
        await api.acceptAssignment(assignment.id);
      }
      if (assignment.status !== "IN_PROGRESS") {
        await api.startAssignment(assignment.id);
      }
      // If verification exists, navigate to it; otherwise create it
      if (assignment.fieldVerification?.id) {
        router.push(`/officer/verifications/${assignment.fieldVerification.id}`);
        return;
      }
      const verification = await api.createAssignmentVerification(assignment.id, {});
      router.push(`/officer/verifications/${verification.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start field verification");
      setActionLoadingId(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Header */}
      <div>
        <span className="eyebrow">Legal Metrology Assignments</span>
        <h1 className="page-heading">My Field Assignments</h1>
        <p className="page-lede">
          Review assigned verification applications, accept pending inspection requests, and record field verification data.
        </p>
      </div>

      {/* Filter Bar */}
      <Panel>
        <PanelBody>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 min(100%, 300px)", display: "flex", gap: "8px" }}>
              <input
                type="search"
                placeholder="Search by serial #, application #, instrument type…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "14px",
                }}
              />
              <Button type="submit" variant="secondary" icon={<MagnifyingGlass size={16} />}>
                Search
              </Button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                  setLoading(true);
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line-strong)",
                  fontSize: "14px",
                  background: "var(--surface)",
                }}
              >
                <option value="">All Statuses</option>
                <option value="ASSIGNED">Pending Acceptance (ASSIGNED)</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {(statusFilter || activeQuery) ? (
                <Button
                  variant="quiet"
                  onClick={() => {
                    setStatusFilter("");
                    setQuery("");
                    setActiveQuery("");
                    setPage(1);
                    setLoading(true);
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          </form>
        </PanelBody>
      </Panel>

      {/* Content State */}
      {loading ? (
        <LoadingState label="Loading assignments…" />
      ) : error ? (
        <ErrorState
          message={error}
          action={
            <Button variant="secondary" onClick={() => setReloadCounter((c) => c + 1)}>
              Retry
            </Button>
          }
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description={statusFilter || activeQuery ? "No inspection assignments match your active filters." : "You currently have no assigned verification tasks."}
        />
      ) : (
        <Panel>
          <PanelBody>
            <div style={{ display: "grid", gap: 0 }}>
              {assignments.map((assignment) => {
                const inst = assignment.instrument;
                const app = assignment.application;
                const isLoadingThis = actionLoadingId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    style={{
                      padding: "20px",
                      borderBottom: "1px solid var(--line)",
                      display: "grid",
                      gap: "12px",
                      background: assignment.status === "ASSIGNED" ? "rgba(255, 240, 211, 0.25)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <Link href={`/officer/assignments/${assignment.id}`} style={{ textDecoration: "underline", color: "var(--ink)", fontWeight: "700", fontSize: "16px" }}>
                            {inst.instrumentType} ({inst.category})
                          </Link>
                          <StatusBadge value={assignment.status} tone={statusTone(assignment.status)} />
                        </div>

                        <div style={{ fontSize: "13px", color: "var(--ink-muted)", marginTop: "4px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          <span>Serial: <code style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{inst.serialNumber}</code></span>
                          <span>Application: <strong>{app.applicationNumber}</strong></span>
                          <span>Type: {app.applicationType.replace(/_/g, " ")}</span>
                        </div>

                        {assignment.notes ? (
                          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "6px", fontStyle: "italic" }}>
                            Note: {assignment.notes}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--ink-muted)", textAlign: "right" }}>
                        <div>Assigned: {formatDate(assignment.assignedAt)}</div>
                        {assignment.dueDate ? <div>Due: <strong>{formatDate(assignment.dueDate)}</strong></div> : null}
                      </div>
                    </div>

                    {/* Action buttons bar (large touch targets for mobile) */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed var(--line)" }}>
                      <Link href={`/officer/assignments/${assignment.id}`}>
                        <Button variant="secondary" style={{ minHeight: "44px" }}>
                          View Details
                        </Button>
                      </Link>

                      {assignment.status === "ASSIGNED" ? (
                        <>
                          <Button
                            variant="secondary"
                            disabled={isLoadingThis}
                            onClick={() => handleAccept(assignment.id)}
                            style={{ minHeight: "44px" }}
                          >
                            {isLoadingThis ? "Accepting…" : "Accept Assignment"}
                          </Button>

                          <Button
                            variant="primary"
                            disabled={isLoadingThis}
                            onClick={() => handleStartVerification(assignment)}
                            icon={<Play size={16} weight="bold" />}
                            style={{ minHeight: "44px" }}
                          >
                            Accept & Start Inspection
                          </Button>
                        </>
                      ) : assignment.status === "ACCEPTED" ? (
                        <Button
                          variant="primary"
                          disabled={isLoadingThis}
                          onClick={() => handleStartVerification(assignment)}
                          icon={<Play size={16} weight="bold" />}
                          style={{ minHeight: "44px" }}
                        >
                          Start Field Verification
                        </Button>
                      ) : assignment.status === "IN_PROGRESS" ? (
                        <Button
                          variant="primary"
                          disabled={isLoadingThis}
                          onClick={() => handleStartVerification(assignment)}
                          icon={<ClipboardText size={18} weight="bold" />}
                          style={{ minHeight: "44px" }}
                        >
                          Continue Field Inspection
                        </Button>
                      ) : assignment.status === "COMPLETED" ? (
                        assignment.fieldVerification?.id ? (
                          <Link href={`/officer/verifications/${assignment.fieldVerification.id}`}>
                            <Button variant="secondary" icon={<CheckCircle size={16} />} style={{ minHeight: "44px" }}>
                              View Completed Record
                            </Button>
                          </Link>
                        ) : (
                          <span style={{ fontSize: "13px", color: "var(--success)", fontWeight: "600" }}>✓ Verification Finalized</span>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    icon={<CaretLeft size={16} />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    icon={<CaretRight size={16} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}
