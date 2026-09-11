"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  CheckCircle,
  Clock,
  Camera,
  Plus,
  Trash,
  Warning,
  ShieldCheck,
  Check,
  X,
  FileText,
  UploadSimple,
  PencilSimple,
  ListChecks,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type FieldVerification,
  type MeasurementRecord,
  type EvidencePhoto,
  type VerificationStatus,
} from "@/lib/api-client";

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "PASS":
    case "COMPLETED":
    case "VERIFIED":
      return "success";
    case "IN_PROGRESS":
    case "CONDITIONAL":
    case "REVERIFICATION_REQUIRED":
      return "warning";
    case "FAIL":
    case "REJECTED":
    case "NOT_ELIGIBLE":
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

export function FieldVerificationFlow({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verification, setVerification] = useState<FieldVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "measurements" | "evidence" | "review">("checklist");
  const [reloadCounter, setReloadCounter] = useState(0);

  // Form states: Measurement
  const [measType, setMeasType] = useState("Standard Mass Test");
  const [measParam, setMeasParam] = useState("");
  const [measStd, setMeasStd] = useState("");
  const [measVal, setMeasVal] = useState("");
  const [measUnit, setMeasUnit] = useState("kg");
  const [measTol, setMeasTol] = useState("");
  const [measRef, setMeasRef] = useState("");
  const [addingMeas, setAddingMeas] = useState(false);
  const [measError, setMeasError] = useState<string | null>(null);

  // Form states: Evidence Photo Upload
  const [photoType, setPhotoType] = useState("STAMP");
  const [photoCaption, setPhotoCaption] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    serialMatches: false,
    locationVerified: false,
    visualConditionOk: false,
    sealIntact: false,
    standardWeightsCalibrated: false,
  });

  // Form states: Final Submission
  const [resultStatus, setResultStatus] = useState<VerificationStatus>("PASS");
  const [findingsSummary, setFindingsSummary] = useState("");
  const [isCompliant, setIsCompliant] = useState(true);
  const [recommendedAction, setRecommendedAction] = useState("");
  const [certificateEligible, setCertificateEligible] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadVerification() {
      try {
        const data = await api.getVerification(verificationId);
        if (!active) return;
        setVerification(data);
        if (data.findingsSummary) setFindingsSummary(data.findingsSummary);
        if (data.remarks) setRemarks(data.remarks);
        if (data.recommendedAction) setRecommendedAction(data.recommendedAction);
        if (data.isCompliant !== null && data.isCompliant !== undefined) setIsCompliant(data.isCompliant);
        if (data.certificateEligible !== null && data.certificateEligible !== undefined) setCertificateEligible(data.certificateEligible);
        if (data.resultStatus) setResultStatus(data.resultStatus);
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load field verification");
        setLoading(false);
      }
    }

    void loadVerification();
    return () => {
      active = false;
    };
  }, [verificationId, reloadCounter]);

  if (loading) {
    return <LoadingState label="Loading field verification workspace…" />;
  }

  if (error || !verification) {
    return (
      <ErrorState
        message={error || "Verification record not found"}
        action={
          <Link href="/officer/assignments">
            <Button variant="secondary" icon={<CaretLeft size={16} />}>Back to Assignments</Button>
          </Link>
        }
      />
    );
  }

  const isFinalized = verification.assignment.status === "COMPLETED" || verification.assignment.application.status === "VERIFIED";

  // Handle Add Measurement
  async function handleAddMeasurement(e: React.FormEvent) {
    e.preventDefault();
    if (!measParam.trim() || !measVal.trim()) {
      setMeasError("Parameter Name and Measured Value are required");
      return;
    }

    try {
      setAddingMeas(true);
      setMeasError(null);
      await api.addMeasurement(verificationId, {
        measurementType: measType,
        parameterName: measParam,
        standardValue: measStd.trim() || undefined,
        measuredValue: measVal.trim(),
        unit: measUnit.trim() || undefined,
        tolerance: measTol.trim() || undefined,
        standardReference: measRef.trim() || undefined,
      });

      // Reset form
      setMeasParam("");
      setMeasStd("");
      setMeasVal("");
      setMeasTol("");
      setReloadCounter((c) => c + 1);
    } catch (err) {
      setMeasError(err instanceof Error ? err.message : "Failed to add measurement");
    } finally {
      setAddingMeas(false);
    }
  }

  // Handle Upload Photo
  async function handleUploadPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setPhotoError("Please select or capture a photo");
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("photoType", photoType);
      if (photoCaption.trim()) formData.append("caption", photoCaption.trim());
      formData.append("isPrimaryEvidence", String(isPrimary));

      await api.addEvidence(verificationId, formData);

      // Reset photo form
      setSelectedFile(null);
      setPhotoCaption("");
      setIsPrimary(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setReloadCounter((c) => c + 1);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Handle Final Submission
  async function handleFinalSubmit() {
    try {
      setSubmitting(true);
      setSubmitError(null);

      await api.submitVerification(verificationId, {
        resultStatus,
        findingsSummary: findingsSummary.trim() || undefined,
        isCompliant,
        recommendedAction: recommendedAction.trim() || undefined,
        certificateEligible,
        remarks: remarks.trim() || undefined,
      });

      setSubmitConfirmOpen(false);
      setReloadCounter((c) => c + 1);
      setActiveTab("review");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to finalize verification");
    } finally {
      setSubmitting(false);
    }
  }

  const inst = verification.assignment.instrument;
  const app = verification.assignment.application;
  const measurements = verification.measurements || [];
  const evidencePhotos = verification.evidencePhotos || [];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {/* Top Bar Navigation */}
      <div>
        <Link href={`/officer/assignments/${verification.assignmentId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "var(--ink-muted)", marginBottom: "8px" }}>
          <CaretLeft size={16} /> Back to Assignment
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Field Verification Workspace</span>
            <h1 className="page-heading">{inst.instrumentType} Field Inspection</h1>
            <p className="page-lede">
              Serial: <code style={{ fontFamily: "var(--font-mono)", fontWeight: "bold" }}>{inst.serialNumber}</code> • Application #{app.applicationNumber}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {isFinalized ? (
              <StatusBadge value="FINALIZED (IMMUTABLE)" tone="success" />
            ) : (
              <StatusBadge value="IN PROGRESS" tone="warning" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Workflow Stepper / Tabs */}
      <div style={{ display: "flex", gap: "6px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "6px", overflowX: "auto" }}>
        <button
          className={`button ${activeTab === "checklist" ? "button-primary" : "button-quiet"}`}
          onClick={() => setActiveTab("checklist")}
          style={{ flex: 1, minHeight: "44px", whiteSpace: "nowrap" }}
        >
          1. Checklist ({Object.values(checklist).filter(Boolean).length}/5)
        </button>

        <button
          className={`button ${activeTab === "measurements" ? "button-primary" : "button-quiet"}`}
          onClick={() => setActiveTab("measurements")}
          style={{ flex: 1, minHeight: "44px", whiteSpace: "nowrap" }}
        >
          2. Measurements ({measurements.length})
        </button>

        <button
          className={`button ${activeTab === "evidence" ? "button-primary" : "button-quiet"}`}
          onClick={() => setActiveTab("evidence")}
          style={{ flex: 1, minHeight: "44px", whiteSpace: "nowrap" }}
        >
          3. Evidence Photos ({evidencePhotos.length})
        </button>

        <button
          className={`button ${activeTab === "review" ? "button-primary" : "button-quiet"}`}
          onClick={() => setActiveTab("review")}
          style={{ flex: 1, minHeight: "44px", whiteSpace: "nowrap" }}
        >
          4. Outcome & Submit
        </button>
      </div>

      {/* TAB 1: INSPECTION CHECKLIST & SITE VERIFICATION */}
      {activeTab === "checklist" ? (
        <div style={{ display: "grid", gap: "20px" }}>
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Pre-Measurement Verification Checklist</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gap: "16px" }}>
                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                  Complete visual inspection and verify physical credentials prior to entering test measurements.
                </p>

                <div style={{ display: "grid", gap: "12px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: checklist.serialMatches ? "var(--success-soft)" : "var(--surface)", cursor: "pointer", minHeight: "48px" }}>
                    <input
                      type="checkbox"
                      checked={checklist.serialMatches}
                      onChange={(e) => setChecklist({ ...checklist, serialMatches: e.target.checked })}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>Serial Number Verification</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Physical serial number on rating plate matches record ({inst.serialNumber})</span>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: checklist.locationVerified ? "var(--success-soft)" : "var(--surface)", cursor: "pointer", minHeight: "48px" }}>
                    <input
                      type="checkbox"
                      checked={checklist.locationVerified}
                      onChange={(e) => setChecklist({ ...checklist, locationVerified: e.target.checked })}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>On-Site Location Check</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Physical location & installation site match registered location details</span>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: checklist.visualConditionOk ? "var(--success-soft)" : "var(--surface)", cursor: "pointer", minHeight: "48px" }}>
                    <input
                      type="checkbox"
                      checked={checklist.visualConditionOk}
                      onChange={(e) => setChecklist({ ...checklist, visualConditionOk: e.target.checked })}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>Physical Condition Inspection</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Instrument body, scale platform, pointer/display are clean, undamaged and free of tampering</span>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: checklist.sealIntact ? "var(--success-soft)" : "var(--surface)", cursor: "pointer", minHeight: "48px" }}>
                    <input
                      type="checkbox"
                      checked={checklist.sealIntact}
                      onChange={(e) => setChecklist({ ...checklist, sealIntact: e.target.checked })}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>Verification Stamp / Seal Integrity</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Previous metrology stamp or security seal is intact or ready for re-sealing</span>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: checklist.standardWeightsCalibrated ? "var(--success-soft)" : "var(--surface)", cursor: "pointer", minHeight: "48px" }}>
                    <input
                      type="checkbox"
                      checked={checklist.standardWeightsCalibrated}
                      onChange={(e) => setChecklist({ ...checklist, standardWeightsCalibrated: e.target.checked })}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>Working Standard Calibration Check</strong>
                      <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Working reference standards used for testing hold active calibration certification</span>
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="primary"
                    onClick={() => setActiveTab("measurements")}
                    icon={<CheckCircle size={18} />}
                    style={{ minHeight: "44px" }}
                  >
                    Proceed to Measurement Entry
                  </Button>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>
      ) : null}

      {/* TAB 2: MEASUREMENT ENTRY & RECORDS */}
      {activeTab === "measurements" ? (
        <div style={{ display: "grid", gap: "20px" }}>
          {!isFinalized ? (
            <Panel className="panel-flat">
              <PanelHeader>
                <h2 className="section-heading">Add Measurement Record</h2>
              </PanelHeader>
              <PanelBody>
                <form onSubmit={handleAddMeasurement} style={{ display: "grid", gap: "16px" }}>
                  {measError ? <ErrorState message={measError} /> : null}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                    <Field label="Test / Measurement Type">
                      <select
                        value={measType}
                        onChange={(e) => setMeasType(e.target.value)}
                        style={{ padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)" }}
                      >
                        <option value="Standard Mass Test">Standard Mass Test</option>
                        <option value="Zero Load Check">Zero Load Check</option>
                        <option value="Repeatability Test">Repeatability Test</option>
                        <option value="Eccentricity Test">Eccentricity Test</option>
                        <option value="Maximum Capacity Test">Maximum Capacity Test</option>
                        <option value="Tare Function Check">Tare Function Check</option>
                      </select>
                    </Field>

                    <Field label="Parameter Name *" hint="e.g., Load at 10kg, Zero Offset">
                      <TextInput
                        placeholder="e.g. 10 kg Load Test"
                        value={measParam}
                        onChange={(e) => setMeasParam(e.target.value)}
                        style={{ minHeight: "44px" }}
                      />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px" }}>
                    <Field label="Standard Reference Value" hint="Certified value">
                      <TextInput
                        type="text"
                        placeholder="10.000"
                        value={measStd}
                        onChange={(e) => setMeasStd(e.target.value)}
                        style={{ minHeight: "44px" }}
                      />
                    </Field>

                    <Field label="Measured Value *" hint="Observed reading">
                      <TextInput
                        type="text"
                        placeholder="10.002"
                        value={measVal}
                        onChange={(e) => setMeasVal(e.target.value)}
                        style={{ minHeight: "44px" }}
                      />
                    </Field>

                    <Field label="Unit of Measure">
                      <TextInput
                        placeholder="kg"
                        value={measUnit}
                        onChange={(e) => setMeasUnit(e.target.value)}
                        style={{ minHeight: "44px" }}
                      />
                    </Field>

                    <Field label="Max Tolerance (±)">
                      <TextInput
                        placeholder="0.005"
                        value={measTol}
                        onChange={(e) => setMeasTol(e.target.value)}
                        style={{ minHeight: "44px" }}
                      />
                    </Field>
                  </div>

                  <Field label="Standard Mass / Reference Identifier" hint="e.g. Mass Set STD-2024-B">
                    <TextInput
                      placeholder="e.g. Reference Mass Set #STD-904"
                      value={measRef}
                      onChange={(e) => setMeasRef(e.target.value)}
                      style={{ minHeight: "44px" }}
                    />
                  </Field>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={addingMeas}
                      icon={<Plus size={18} weight="bold" />}
                      style={{ minHeight: "44px", width: "min(100%, 240px)" }}
                    >
                      {addingMeas ? "Recording…" : "Save Measurement"}
                    </Button>
                  </div>
                </form>
              </PanelBody>
            </Panel>
          ) : null}

          {/* Table of Recorded Measurements */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Recorded Measurements ({measurements.length})</h2>
              <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Calculated error & PASS/FAIL evaluated strictly by backend engine</span>
            </PanelHeader>
            <PanelBody>
              {measurements.length === 0 ? (
                <EmptyState
                  title="No measurements recorded"
                  description="Use the form above to add physical measurement observations."
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--line)", color: "var(--ink-muted)", fontSize: "12px", textTransform: "uppercase" }}>
                        <th style={{ padding: "12px 16px" }}>Type / Parameter</th>
                        <th style={{ padding: "12px 16px" }}>Standard</th>
                        <th style={{ padding: "12px 16px" }}>Measured</th>
                        <th style={{ padding: "12px 16px" }}>Calc. Error</th>
                        <th style={{ padding: "12px 16px" }}>Tolerance</th>
                        <th style={{ padding: "12px 16px" }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <strong>{m.parameterName}</strong>
                            <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>{m.measurementType}</div>
                            {m.standardReference ? (
                              <div style={{ fontSize: "11px", color: "var(--ink-faint)", fontStyle: "italic" }}>Ref: {m.standardReference}</div>
                            ) : null}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)" }}>
                            {m.standardValue ? `${m.standardValue} ${m.unit || ""}` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>
                            {m.measuredValue} {m.unit || ""}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)" }}>
                            {m.calculatedError !== null && m.calculatedError !== undefined ? `${m.calculatedError} ${m.unit || ""}` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)" }}>
                            {m.tolerance ? `±${m.tolerance}` : "—"}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {m.passFail ? (
                              <StatusBadge value="PASS" tone="success" />
                            ) : (
                              <StatusBadge value="FAIL" tone="danger" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelBody>
          </Panel>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="secondary" onClick={() => setActiveTab("checklist")} style={{ minHeight: "44px" }}>
              Back to Checklist
            </Button>
            <Button variant="primary" onClick={() => setActiveTab("evidence")} style={{ minHeight: "44px" }}>
              Next: Capture Evidence Photos
            </Button>
          </div>
        </div>
      ) : null}

      {/* TAB 3: EVIDENCE & PHOTO CAPTURE */}
      {activeTab === "evidence" ? (
        <div style={{ display: "grid", gap: "20px" }}>
          {!isFinalized ? (
            <Panel className="panel-flat">
              <PanelHeader>
                <h2 className="section-heading">Capture / Upload Evidence Photo</h2>
              </PanelHeader>
              <PanelBody>
                <form onSubmit={handleUploadPhoto} style={{ display: "grid", gap: "16px" }}>
                  {photoError ? <ErrorState message={photoError} /> : null}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                    <Field label="Evidence Category *">
                      <select
                        value={photoType}
                        onChange={(e) => setPhotoType(e.target.value)}
                        style={{ padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)" }}
                      >
                        <option value="STAMP">Metrology Stamp / Seal</option>
                        <option value="SERIAL_PLATE">Serial Plate / Rating Label</option>
                        <option value="SCALE_READING">Scale Display / Dial Reading</option>
                        <option value="OVERALL_VIEW">Overall Instrument View</option>
                        <option value="DEFECT">Defect / Wear & Tear</option>
                      </select>
                    </Field>

                    <Field label="Photo File (Camera / Gallery) *">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        style={{ padding: "8px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
                      />
                    </Field>
                  </div>

                  <Field label="Caption / Notes" hint="Optional description of the photo">
                    <TextInput
                      placeholder="e.g. Verification stamp applied to adjustment screw"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      style={{ minHeight: "44px" }}
                    />
                  </Field>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      style={{ width: "18px", height: "18px" }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>Mark as Primary Verification Evidence Photo</span>
                  </label>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={uploadingPhoto || !selectedFile}
                      icon={<Camera size={18} weight="bold" />}
                      style={{ minHeight: "44px", width: "min(100%, 240px)" }}
                    >
                      {uploadingPhoto ? "Uploading…" : "Upload Photo"}
                    </Button>
                  </div>
                </form>
              </PanelBody>
            </Panel>
          ) : null}

          {/* Evidence Photos Grid */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Uploaded Evidence Photos ({evidencePhotos.length})</h2>
            </PanelHeader>
            <PanelBody>
              {evidencePhotos.length === 0 ? (
                <EmptyState
                  title="No evidence photos uploaded"
                  description="Use your camera or device photo library to upload proof photos."
                />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
                  {evidencePhotos.map((photo) => (
                    <div key={photo.id} style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--surface)" }}>
                      <div style={{ height: "160px", background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {photo.fileUrl ? (
                          <div style={{ textAlign: "center", padding: "12px" }}>
                            <Camera size={36} color="var(--accent-strong)" />
                            <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>
                              {photo.photoType.replace(/_/g, " ")}
                            </div>
                          </div>
                        ) : null}

                        {photo.isPrimaryEvidence ? (
                          <span style={{ position: "absolute", top: "8px", right: "8px", background: "var(--accent)", color: "white", fontSize: "10px", fontWeight: "bold", padding: "3px 8px", borderRadius: "10px" }}>
                            PRIMARY
                          </span>
                        ) : null}
                      </div>

                      <div style={{ padding: "12px" }}>
                        <strong style={{ fontSize: "13px", display: "block" }}>{photo.photoType.replace(/_/g, " ")}</strong>
                        {photo.caption ? (
                          <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: "4px 0 0" }}>{photo.caption}</p>
                        ) : null}
                        <span style={{ fontSize: "11px", color: "var(--ink-faint)", marginTop: "6px", display: "block" }}>
                          Uploaded: {formatDate(photo.capturedAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelBody>
          </Panel>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="secondary" onClick={() => setActiveTab("measurements")} style={{ minHeight: "44px" }}>
              Back to Measurements
            </Button>
            <Button variant="primary" onClick={() => setActiveTab("review")} style={{ minHeight: "44px" }}>
              Next: Review & Finalize Outcome
            </Button>
          </div>
        </div>
      ) : null}

      {/* TAB 4: VERIFICATION REVIEW & SUBMISSION */}
      {activeTab === "review" ? (
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Inspection Summary Banner */}
          <Panel>
            <PanelHeader>
              <h2 className="section-heading">Verification Findings Summary</h2>
            </PanelHeader>
            <PanelBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Total Measurements</span>
                  <strong style={{ fontSize: "18px" }}>{measurements.length} Recorded</strong>
                  {measurements.length > 0 ? (
                    <div style={{ fontSize: "12px", color: measurements.every((m) => m.passFail) ? "var(--success)" : "var(--danger)" }}>
                      {measurements.filter((m) => m.passFail).length}/{measurements.length} PASSED
                    </div>
                  ) : null}
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "var(--ink-muted)", display: "block" }}>Evidence Photos</span>
                  <strong style={{ fontSize: "18px" }}>{evidencePhotos.length} Attached</strong>
                  <div style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                    Primary photo: {evidencePhotos.some((p) => p.isPrimaryEvidence) ? "✓ Present" : "None"}
                  </div>
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* Final Submission Form */}
          {!isFinalized ? (
            <Panel className="panel-flat">
              <PanelHeader>
                <h2 className="section-heading">Final Inspection Determination</h2>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: "grid", gap: "18px" }}>
                  {submitError ? <ErrorState message={submitError} /> : null}

                  <Field label="Final Verification Result Status *">
                    <select
                      value={resultStatus}
                      onChange={(e) => setResultStatus(e.target.value as VerificationStatus)}
                      style={{ padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)", fontSize: "15px", fontWeight: "700" }}
                    >
                      <option value="PASS">PASS — Compliant with Legal Metrology Standards</option>
                      <option value="FAIL">FAIL — Non-compliant / Error Exceeds Tolerance</option>
                      <option value="CONDITIONAL">CONDITIONAL — Requires Minor Adjustment</option>
                      <option value="REVERIFICATION_REQUIRED">REVERIFICATION REQUIRED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </Field>

                  <Field label="Officer Findings Summary *" hint="Provide an overall technical assessment of the inspection">
                    <TextArea
                      rows={4}
                      placeholder="Describe findings, test conditions, error margins, and physical stamp status…"
                      value={findingsSummary}
                      onChange={(e) => setFindingsSummary(e.target.value)}
                    />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isCompliant}
                        onChange={(e) => setIsCompliant(e.target.checked)}
                        style={{ width: "20px", height: "20px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "14px", display: "block" }}>Statutory Compliance</strong>
                        <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Instrument meets Legal Metrology Rules</span>
                      </div>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={certificateEligible}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCertificateEligible(checked);
                          if (checked && resultStatus === "NOT_ELIGIBLE") {
                            setResultStatus("PASS");
                          }
                        }}
                        style={{ width: "20px", height: "20px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "14px", display: "block" }}>Digital Certificate Eligible</strong>
                        <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>Eligible for digital certificate issuance</span>
                      </div>
                    </label>
                  </div>

                  <Field label="Recommended Action / Follow-up" hint="Optional recommendations">
                    <TextInput
                      placeholder="e.g. Issue Digital Certificate / Schedule Re-verification in 1 year"
                      value={recommendedAction}
                      onChange={(e) => setRecommendedAction(e.target.value)}
                      style={{ minHeight: "44px" }}
                    />
                  </Field>

                  <Field label="Official Remarks">
                    <TextArea
                      rows={2}
                      placeholder="Additional confidential officer remarks…"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </Field>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        if (!findingsSummary.trim()) {
                          setSubmitError("Please enter a Findings Summary before submitting.");
                          return;
                        }
                        setSubmitConfirmOpen(true);
                      }}
                      icon={<ShieldCheck size={20} weight="bold" />}
                      style={{ minHeight: "48px", width: "min(100%, 280px)", fontSize: "16px" }}
                    >
                      Submit Final Inspection
                    </Button>
                  </div>
                </div>
              </PanelBody>
            </Panel>
          ) : (
            <Panel className="panel-flat">
              <PanelHeader>
                <h2 className="section-heading" style={{ color: "var(--success)" }}>✓ Verification Record Finalized</h2>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <StatusBadge value={verification.resultStatus || "PASS"} tone={statusTone(verification.resultStatus || "PASS")} />
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                      Submitted on {formatDate(verification.updatedAt)}
                    </span>
                  </div>

                  {verification.findingsSummary ? (
                    <div style={{ fontSize: "14px", marginTop: "8px" }}>
                      <strong>Officer Findings Summary:</strong>
                      <p style={{ margin: "4px 0 0", fontStyle: "italic", color: "var(--ink)" }}>{verification.findingsSummary}</p>
                    </div>
                  ) : null}

                  <div style={{ fontSize: "13px", color: "var(--ink-muted)", marginTop: "8px" }}>
                    Note: Finalized field verification records cannot be modified or deleted.
                  </div>
                </div>
              </PanelBody>
            </Panel>
          )}
        </div>
      ) : null}

      {/* Confirmation Modal before Finalizing */}
      {submitConfirmOpen ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "var(--radius-md)", maxWidth: "480px", width: "100%", display: "grid", gap: "16px", boxShadow: "var(--shadow)" }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Confirm Final Submission</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink-muted)" }}>
              You are submitting the final verification result as <strong>{resultStatus}</strong> for Application #{app.applicationNumber}.
              Once submitted, this inspection record becomes legally binding and immutable.
            </p>

            {submitError ? <ErrorState message={submitError} /> : null}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="secondary" disabled={submitting} onClick={() => setSubmitConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={submitting} onClick={handleFinalSubmit} icon={<Check size={18} weight="bold" />}>
                {submitting ? "Finalizing…" : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
