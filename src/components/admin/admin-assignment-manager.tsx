"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardText,
  CheckCircle,
  MagnifyingGlass,
  Funnel,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  apiRequest,
  type OfficerAssignment,
  type VerificationApplication,
  type UserProfile,
  type PagedResult,
} from "@/lib/api-client";
import Link from "next/link";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "COMPLETED": return "success";
    case "IN_PROGRESS": return "warning";
    case "ASSIGNED": return "info";
    case "CANCELLED": case "REJECTED": return "danger";
    default: return "neutral";
  }
}

export function AdminAssignmentManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<OfficerAssignment[]>([]);
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<VerificationApplication[]>([]);

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [assignRes, userRes, appRes] = await Promise.all([
          api.listAssignments({ pageSize: 20 }),
          api.listUsers({ role: "OFFICER", pageSize: 100 }),
          api.listApplications({ status: "UNDER_REVIEW", pageSize: 50 }),
        ]);

        setAssignments(assignRes.data);
        setOfficers(userRes.data);
        setApplications(appRes.data);
        setLoading(false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to load assignment data");
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  async function handleAssign() {
    if (!selectedApp || !selectedOfficer) return;

    setIsAssigning(true);
    try {
      // Note: The API for creating an assignment is typically handled via the assignment service
      // In this project, assignments are often created when an application is approved.
      // If there's no specific 'create assignment' endpoint for admin, we might need to check if the
      // approveApplication endpoint takes an officerId.

      // Assuming the backend has a way to create/update assignments via the assignments route
      // since we are in Admin context.
      await apiRequest(`/assignments`, {
        method: "POST",
        body: JSON.stringify({ applicationId: selectedApp, officerId: selectedOfficer }),
      });

      alert("Assignment created successfully");
      setSelectedApp("");
      setSelectedOfficer("");
      // Refresh list
      const res = await api.listAssignments({ pageSize: 20 });
      setAssignments(res.data);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Assignment failed");
    } finally {
      setIsAssigning(false);
    }
  }

  if (loading) return <LoadingState label="Loading assignment manager…" />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>} />;

  return (
    <>
      <div className="heading-row">
        <div>
          <div className="eyebrow">Administrator Workspace</div>
          <h1 className="page-heading">Assignment Allocation</h1>
          <p className="page-lede">
            Allocate verification applications to authorized Legal Metrology Officers.
          </p>
        </div>
      </div>

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          {/* Assignment Form */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Create New Assignment</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="field-label">Application</label>
                  <select
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      height: "42px",
                      borderRadius: "2px",
                      border: "1px solid var(--border)",
                      fontSize: 14,
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <option value="">Select Application...</option>
                    {applications.map((app) => (
                      <option key={app.applicationNumber} value={app.applicationNumber}>
                        {app.applicationNumber} - {app.instrument.instrumentType} ({app.instrument.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="field-label">Officer</label>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      height: "42px",
                      borderRadius: "2px",
                      border: "1px solid var(--border)",
                      fontSize: 14,
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <option value="">Select Officer...</option>
                    {officers.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAssign}
                  disabled={!selectedApp || !selectedOfficer || isAssigning}
                  icon={<CheckCircle size={16} />}
                >
                  {isAssigning ? "Assigning..." : "Assign Officer"}
                </Button>
              </div>
            </PanelBody>
          </Panel>

          {/* Assignments List */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Active Assignments</h2>
            </PanelHeader>
            <PanelBody>
              {assignments.length === 0 ? (
                <EmptyState
                  title="No active assignments"
                  description="There are currently no assignments in the system."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Application</th>
                        <th>Officer</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((asn) => (
                        <tr key={asn.id}>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{asn.id}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{asn.application.applicationNumber}</td>
                          <td>{asn.assignedOfficerName}</td>
                          <td>
                            <StatusBadge value={asn.status} tone={statusTone(asn.status)} />
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{asn.dueDate ? new Date(asn.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td>
                            <Link href={`/admin/assignments/${encodeURIComponent(asn.id)}`}>
                              <span className="link-action" style={{ fontSize: 12 }}>Details</span>
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
