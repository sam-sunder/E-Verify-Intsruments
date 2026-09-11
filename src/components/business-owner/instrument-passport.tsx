"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  PencilSimple,
  QrCode,
  ShieldCheck,
  Tag,
  Warning,
  X,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type Instrument,
  type InstrumentHistory,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "ACTIVE":
    case "PASS":
    case "COMPLIANT":
      return "success";
    case "WARNING":
    case "DUE_SOON":
    case "UPCOMING":
      return "warning";
    case "CRITICAL":
    case "EXPIRED":
    case "FAIL":
    case "SUSPENDED":
    case "REVOKED":
    case "NON_COMPLIANT":
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

export function InstrumentPassport({ publicInstrumentId }: { publicInstrumentId: string }) {
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [history, setHistory] = useState<InstrumentHistory | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "certificates" | "inspections" | "locations" | "audit">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editLocation, setEditLocation] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [inst, hist, me] = await Promise.all([
          api.getInstrument(publicInstrumentId),
          api.getInstrumentHistory(publicInstrumentId).catch(() => null),
          api.getMe().catch(() => null),
        ]);
        if (!active) return;
        setInstrument(inst);
        setHistory(hist);
        setUserRole(me?.role ?? null);
        setEditLocation(inst.currentLocation || "");
        setEditRemarks(inst.remarks || "");
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load instrument passport");
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [publicInstrumentId, reloadCounter]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateInstrument(publicInstrumentId, {
        currentLocation: editLocation.trim() || null,
        remarks: editRemarks.trim() || null,
      });
      setInstrument(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      setReloadCounter((c) => c + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update instrument");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading Digital Instrument Passport…" />;
  if (error && !instrument) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => { setLoading(true); setError(null); setReloadCounter((c) => c + 1); }}>Retry</Button>} />;
  if (!instrument) return <ErrorState message="Instrument not found" />;

  const latestCertificate = history?.certificates?.[0];
  const isExpired = instrument.status === "EXPIRED" || (latestCertificate && latestCertificate.status === "EXPIRED");

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/instruments">Instruments</Link>
        <span>/</span>
        <span>{instrument.publicInstrumentId}</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Digital Instrument Passport</div>
          <h1 className="page-heading">{instrument.instrumentType}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>
              {instrument.publicInstrumentId}
            </span>
            <StatusBadge value={instrument.status} tone={statusTone(instrument.status)} />
            <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>
              SN: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{instrument.serialNumber}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(userRole === "BUSINESS_OWNER" || userRole === "ADMINISTRATOR") && (
            <Button
              variant="secondary"
              icon={<PencilSimple size={15} />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel Edit" : "Update Location / Remarks"}
            </Button>
          )}

          <Link
            href={`/applications/new?instrumentId=${encodeURIComponent(
              instrument.publicInstrumentId
            )}${latestCertificate ? `&previousApplicationId=${encodeURIComponent(latestCertificate.certificateNumber)}` : ""}`}
          >
            <Button variant="primary" icon={<ArrowsClockwise size={16} />}>
              {isExpired ? "Apply for Re-Verification" : "Apply for Verification"}
            </Button>
          </Link>
        </div>
      </div>

      {saveSuccess ? (
        <div className="alert-banner alert-banner-success">
          <div className="alert-banner-body">
            <strong><CheckCircle size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6 }} /> Instrument Passport Updated</strong>
            <p>Your changes to physical installation location and operational remarks have been recorded in the registry.</p>
          </div>
        </div>
      ) : null}

      {/* Inline Edit Form */}
      {isEditing ? (
        <div style={{ marginBottom: 24 }}>
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Edit Instrument Information</h2>
                <p className="field-hint">Update installation premises or operational notes for officer records.</p>
              </div>
              <Button variant="quiet" onClick={() => setIsEditing(false)} icon={<X size={15} />}>Close</Button>
            </PanelHeader>
            <PanelBody>
              <form onSubmit={handleUpdate}>
                <div className="form-grid">
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Current Installation Location" hint="Physical location where officer will inspect the instrument.">
                      <TextInput
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="e.g. Unit 4, Floor 2, Building A"
                      />
                    </Field>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Operational Remarks">
                      <TextArea
                        rows={3}
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                        placeholder="Add notes regarding instrument maintenance or relocation…"
                      />
                    </Field>
                  </div>
                </div>
                <div className="form-actions">
                  <Button type="button" variant="quiet" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving Changes…" : "Save Passport Details"}
                  </Button>
                </div>
              </form>
            </PanelBody>
          </Panel>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Specifications
        </button>
        <button
          className={`tab-btn ${activeTab === "certificates" ? "active" : ""}`}
          onClick={() => setActiveTab("certificates")}
        >
          Certificates ({history?.certificates?.length ?? 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "inspections" ? "active" : ""}`}
          onClick={() => setActiveTab("inspections")}
        >
          Field Inspections ({history?.verifications?.length ?? 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "locations" ? "active" : ""}`}
          onClick={() => setActiveTab("locations")}
        >
          Location History ({history?.locations?.length ?? 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Trail ({history?.audit?.length ?? 0})
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: 24 }}>
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Technical Specifications & Identity</h2>
                <p className="field-hint">Statutory identification stamped on the physical instrument.</p>
              </div>
              <span className="status-badge status-neutral">Permanent Record</span>
            </PanelHeader>
            <PanelBody>
              <div className="specs-grid">
                <div className="spec-box">
                  <span className="spec-label">Digital Instrument ID</span>
                  <span className="spec-value" style={{ fontFamily: "var(--font-mono)", color: "var(--accent-strong)" }}>
                    {instrument.publicInstrumentId}
                  </span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Serial Number</span>
                  <span className="spec-value" style={{ fontFamily: "var(--font-mono)" }}>
                    {instrument.serialNumber}
                  </span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Instrument Type</span>
                  <span className="spec-value">{instrument.instrumentType}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Category</span>
                  <span className="spec-value">{instrument.category}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Manufacturer</span>
                  <span className="spec-value">{instrument.manufacturer || "—"}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Model</span>
                  <span className="spec-value">{instrument.model || "—"}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Rated Capacity</span>
                  <span className="spec-value">
                    {instrument.capacity ? `${instrument.capacity} ${instrument.unitOfMeasure ?? ""}` : "—"}
                  </span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Registration No.</span>
                  <span className="spec-value">{instrument.registrationNumber || "—"}</span>
                </div>
                <div className="spec-box" style={{ gridColumn: "1 / -1" }}>
                  <span className="spec-label">Current Location</span>
                  <span className="spec-value">{instrument.currentLocation || "No location recorded"}</span>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Legal Metrology Compliance Schedule</h2>
                <p className="field-hint">Verification validity dates under statutory rules.</p>
              </div>
            </PanelHeader>
            <PanelBody>
              <div className="specs-grid">
                <div className="spec-box">
                  <span className="spec-label">Registration Date</span>
                  <span className="spec-value">{formatDate(instrument.registeredAt)}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Last Verified Date</span>
                  <span className="spec-value">{formatDate(instrument.lastVerifiedAt)}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Next Verification Due</span>
                  <span className="spec-value" style={{ color: isExpired ? "var(--danger)" : "var(--ink)" }}>
                    {formatDate(instrument.nextDueDate)}
                  </span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">Owner of Record</span>
                  <span className="spec-value">{instrument.currentOwnerName}</span>
                </div>
              </div>

              {instrument.remarks ? (
                <div style={{ marginTop: 18, padding: "14px 16px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)" }}>
                  <strong style={{ fontSize: 12, display: "block", color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: 4 }}>
                    Operational Notes
                  </strong>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{instrument.remarks}</p>
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        </div>
      )}

      {/* Tab Content: Certificates */}
      {activeTab === "certificates" && (
        <Panel>
          <PanelHeader>
            <div>
              <h2 className="section-heading">Issued Digital Certificates</h2>
              <p className="field-hint">Historical and active legal metrology verification certificates.</p>
            </div>
          </PanelHeader>
          <PanelBody>
            {(!history?.certificates || history.certificates.length === 0) ? (
              <EmptyState
                title="No certificates issued"
                description="Digital certificates are issued by Legal Metrology Officers upon successful completion of field verification."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Certificate Number</th>
                      <th>Issued Date</th>
                      <th>Valid From</th>
                      <th>Valid To</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.certificates.map((cert) => (
                      <tr key={cert.certificateNumber}>
                        <td>
                          <Link
                            href={`/certificates/${encodeURIComponent(cert.certificateNumber)}`}
                            style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-strong)" }}
                          >
                            {cert.certificateNumber}
                          </Link>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(cert.issuedAt)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(cert.validFrom)}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(cert.validTo)}</td>
                        <td>
                          <StatusBadge value={cert.status} tone={statusTone(cert.status)} />
                        </td>
                        <td>
                          <Link href={`/certificates/${encodeURIComponent(cert.certificateNumber)}`}>
                            <span className="link-action" style={{ fontSize: 12 }}>View Certificate</span>
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
      )}

      {/* Tab Content: Field Inspections */}
      {activeTab === "inspections" && (
        <Panel>
          <PanelHeader>
            <div>
              <h2 className="section-heading">Field Verification History</h2>
              <p className="field-hint">Inspection results recorded by Legal Metrology Officers.</p>
            </div>
          </PanelHeader>
          <PanelBody>
            {(!history?.verifications || history.verifications.length === 0) ? (
              <EmptyState
                title="No inspections recorded"
                description="Officer field inspection and test measurement logs will appear here once an inspection is conducted."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Inspection Date</th>
                      <th>Outcome Status</th>
                      <th>Compliant</th>
                      <th>Certificate Eligible</th>
                      <th>Officer Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.verifications.map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(v.verificationDate)}</td>
                        <td>
                          <StatusBadge value={v.resultStatus} tone={statusTone(v.resultStatus)} />
                        </td>
                        <td>
                          {v.isCompliant ? (
                            <span style={{ color: "var(--success)", fontWeight: 700 }}>Compliant</span>
                          ) : (
                            <span style={{ color: "var(--danger)" }}>Non-Compliant</span>
                          )}
                        </td>
                        <td>
                          {v.certificateEligible ? (
                            <span className="status-badge status-success">Eligible</span>
                          ) : (
                            <span className="status-badge status-neutral">Not Eligible</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 320, whiteSpace: "normal", fontSize: 13 }}>
                          {v.findingsSummary || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PanelBody>
        </Panel>
      )}

      {/* Tab Content: Locations */}
      {activeTab === "locations" && (
        <Panel>
          <PanelHeader>
            <div>
              <h2 className="section-heading">Installation Location History</h2>
              <p className="field-hint">Physical movements and address records for regulatory jurisdiction.</p>
            </div>
          </PanelHeader>
          <PanelBody>
            {(!history?.locations || history.locations.length === 0) ? (
              <EmptyState
                title="No location changes"
                description="Initial installation location remains active without recorded relocation."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Effective From</th>
                      <th>Previous Location</th>
                      <th>New Location</th>
                      <th>Reason</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.locations.map((loc, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(loc.effectiveFrom)}</td>
                        <td style={{ color: "var(--ink-muted)" }}>{loc.previousLocation || "—"}</td>
                        <td><strong>{loc.newLocation || "—"}</strong></td>
                        <td>{loc.reason || "Operational update"}</td>
                        <td>{loc.approvedBy?.fullName || "System record"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PanelBody>
        </Panel>
      )}

      {/* Tab Content: Audit */}
      {activeTab === "audit" && (
        <Panel>
          <PanelHeader>
            <div>
              <h2 className="section-heading">Lifecycle Audit Trail</h2>
              <p className="field-hint">Immutable log of system modifications and regulatory transactions.</p>
            </div>
          </PanelHeader>
          <PanelBody>
            {(!history?.audit || history.audit.length === 0) ? (
              <EmptyState
                title="No audit entries"
                description="System transactions affecting this instrument will appear in the audit trail."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Notes & Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.audit.map((entry, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{formatDate(entry.changedAt)}</td>
                        <td>
                          <span className="status-badge status-neutral">{entry.actionType}</span>
                        </td>
                        <td style={{ fontSize: 13, whiteSpace: "normal" }}>{entry.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PanelBody>
        </Panel>
      )}
    </>
  );
}
