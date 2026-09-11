"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/card";
import { Field, TextInput, TextArea } from "@/components/ui/field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import {
  api,
  type ApplicationType,
  type Instrument,
  type VerificationApplication,
} from "@/lib/api-client";

export function CreateApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialInstrumentId = searchParams.get("instrumentId") || "";
  const initialType = (searchParams.get("type") as ApplicationType) || "INITIAL_VERIFICATION";
  const initialPrevAppId = searchParams.get("previousApplicationId") || "";

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loadingInstruments, setLoadingInstruments] = useState(true);

  const [selectedInstrumentId, setSelectedInstrumentId] = useState(initialInstrumentId);
  const [applicationType, setApplicationType] = useState<ApplicationType>(initialType);
  const [previousApplicationId, setPreviousApplicationId] = useState(initialPrevAppId);
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [pastApplications, setPastApplications] = useState<VerificationApplication[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadInstruments() {
      try {
        const res = await api.listInstruments({ pageSize: 100 });
        if (!active) return;
        setInstruments(res.data);
        setSelectedInstrumentId((curr) => curr || (res.data.length > 0 ? res.data[0].publicInstrumentId : ""));
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Failed to load instruments list");
      } finally {
        if (active) setLoadingInstruments(false);
      }
    }
    void loadInstruments();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedInstrumentId || applicationType !== "RE_VERIFICATION") return;
    let active = true;

    async function loadPastApplications() {
      try {
        const res = await api.listApplications({ instrumentId: selectedInstrumentId, pageSize: 20 });
        if (!active) return;
        setPastApplications(res.data);
        setPreviousApplicationId((curr) => curr || (res.data.length > 0 ? res.data[0].applicationNumber : ""));
      } catch {
        // past applications lookup is non-fatal
      }
    }
    void loadPastApplications();
    return () => {
      active = false;
    };
  }, [selectedInstrumentId, applicationType]);

  const currentSelected = instruments.find((i) => i.publicInstrumentId === selectedInstrumentId);

  async function handleSubmit(shouldSubmitImmediately: boolean) {
    setError(null);

    if (!selectedInstrumentId) {
      setError("Please select an instrument.");
      return;
    }

    if (applicationType === "RE_VERIFICATION" && !previousApplicationId.trim()) {
      setError("Re-verification requires a previous application number. Please specify or select the prior application.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createApplication({
        instrumentId: selectedInstrumentId,
        applicationType,
        remarks: remarks.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        previousApplicationId: applicationType === "RE_VERIFICATION" ? previousApplicationId.trim() : undefined,
      });

      if (shouldSubmitImmediately) {
        await api.submitApplication(created.applicationNumber);
      }

      router.push(`/applications/${encodeURIComponent(created.applicationNumber)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create verification application");
      setSubmitting(false);
    }
  }

  if (loadingInstruments) {
    return <LoadingState label="Preparing application workspace…" />;
  }

  return (
    <>
      <div className="breadcrumb-nav">
        <Link href="/">Workspace</Link>
        <span>/</span>
        <Link href="/applications">Applications</Link>
        <span>/</span>
        <span>New</span>
      </div>

      <div className="heading-row">
        <div>
          <div className="eyebrow">Verification Request</div>
          <h1 className="page-heading">New Verification Application</h1>
          <p className="page-lede">
            Submit a regulated instrument for Legal Metrology examination, technical verification, and official stamping.
          </p>
        </div>
        <div>
          <Link href="/applications">
            <Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to Applications</Button>
          </Link>
        </div>
      </div>

      {error ? <div style={{ marginBottom: 18 }}><ErrorState message={error} /></div> : null}

      <div className="shell-grid">
        <div style={{ display: "grid", gap: 24 }}>
          <Panel>
            <PanelHeader>
              <div>
                <h2 className="section-heading">Application Information</h2>
                <p className="field-hint">Select the instrument to be inspected and verification category.</p>
              </div>
              <span className="status-badge status-info">Step 1 of 2</span>
            </PanelHeader>

            <PanelBody>
              <div style={{ display: "grid", gap: 18 }}>
                <Field label="Target Regulated Instrument" hint="Select from your registered instruments.">
                  <select
                    value={selectedInstrumentId}
                    onChange={(e) => {
                      setSelectedInstrumentId(e.target.value);
                      setPreviousApplicationId("");
                    }}
                    required
                  >
                    {instruments.length === 0 ? (
                      <option value="">No registered instruments available</option>
                    ) : (
                      instruments.map((i) => (
                        <option key={i.publicInstrumentId} value={i.publicInstrumentId}>
                          {i.instrumentType} — SN: {i.serialNumber} ({i.publicInstrumentId})
                        </option>
                      ))
                    )}
                  </select>
                </Field>

                <Field label="Application Type" hint="Legal classification of this verification event.">
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as ApplicationType)}
                    required
                  >
                    <option value="INITIAL_VERIFICATION">Initial Verification (First-time stamping)</option>
                    <option value="RE_VERIFICATION">Periodic Re-Verification (Renewal stamping)</option>
                    <option value="REPLACEMENT_REQUEST">Replacement Verification (Post-repair / modification)</option>
                    <option value="COMPLIANCE_REVIEW">Compliance Review Verification</option>
                  </select>
                </Field>

                {applicationType === "RE_VERIFICATION" ? (
                  <Field
                    label="Previous Application Number"
                    hint="Reference to the prior verification application under which the expiring certificate was issued."
                  >
                    {pastApplications.length > 0 ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <select
                          value={previousApplicationId}
                          onChange={(e) => setPreviousApplicationId(e.target.value)}
                        >
                          <option value="">Select past application…</option>
                          {pastApplications.map((app) => (
                            <option key={app.applicationNumber} value={app.applicationNumber}>
                              {app.applicationNumber} — {app.applicationType} ({app.status})
                            </option>
                          ))}
                        </select>
                        <TextInput
                          type="text"
                          placeholder="Or enter application number (e.g. EVM-APP-...)"
                          value={previousApplicationId}
                          onChange={(e) => setPreviousApplicationId(e.target.value)}
                        />
                      </div>
                    ) : (
                      <TextInput
                        type="text"
                        required
                        placeholder="e.g. EVM-APP-9f2e4c-..."
                        value={previousApplicationId}
                        onChange={(e) => setPreviousApplicationId(e.target.value)}
                      />
                    )}
                  </Field>
                ) : null}

                <Field label="Requested Inspection Date (Optional)" hint="Target date by which field inspection is requested.">
                  <TextInput
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>

                <Field label="Operational Notes / Access Guidance" hint="Specify site hours, security clearance instructions, or special test equipment access.">
                  <TextArea
                    rows={4}
                    placeholder="e.g. Please schedule morning inspection between 9 AM - 1 PM. Site supervisor available at Counter 2."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </Field>

                <div className="form-actions" style={{ marginTop: 12 }}>
                  <Link href="/applications">
                    <Button type="button" variant="quiet">Cancel</Button>
                  </Link>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={submitting || instruments.length === 0}
                    onClick={() => void handleSubmit(false)}
                    icon={<FileText size={16} />}
                  >
                    Save as Draft
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    disabled={submitting || instruments.length === 0}
                    onClick={() => void handleSubmit(true)}
                    icon={<PaperPlaneTilt size={16} />}
                  >
                    {submitting ? "Submitting Application…" : "Submit to Legal Metrology"}
                  </Button>
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        {/* Selected Instrument Preview Card */}
        <div style={{ display: "grid", gap: 24 }}>
          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">Selected Instrument</h2>
              {currentSelected ? (
                <div style={{ marginTop: 14 }}>
                  <div style={{ padding: "12px 14px", background: "var(--surface-soft)", borderRadius: "var(--radius-sm)", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent-strong)", fontWeight: 700 }}>
                      {currentSelected.publicInstrumentId}
                    </span>
                    <strong style={{ display: "block", fontSize: 15, marginTop: 4 }}>
                      {currentSelected.instrumentType}
                    </strong>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                      Category: {currentSelected.category}
                    </span>
                  </div>

                  <div className="shell-list">
                    <div className="shell-list-row">
                      <span>Serial Number</span>
                      <strong style={{ fontFamily: "var(--font-mono)" }}>{currentSelected.serialNumber}</strong>
                    </div>
                    <div className="shell-list-row">
                      <span>Manufacturer</span>
                      <strong>{currentSelected.manufacturer || "—"}</strong>
                    </div>
                    <div className="shell-list-row">
                      <span>Model</span>
                      <strong>{currentSelected.model || "—"}</strong>
                    </div>
                    <div className="shell-list-row">
                      <span>Capacity</span>
                      <strong>{currentSelected.capacity ? `${currentSelected.capacity} ${currentSelected.unitOfMeasure ?? ""}` : "—"}</strong>
                    </div>
                    <div className="shell-list-row">
                      <span>Premises Location</span>
                      <strong style={{ textAlign: "right", maxWidth: 180, wordBreak: "break-word" }}>
                        {currentSelected.currentLocation || "—"}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--ink-muted)", fontSize: 13, marginTop: 12 }}>
                  Select an instrument to view its technical profile.
                </p>
              )}
            </PanelBody>
          </section>

          <section className="panel-flat">
            <PanelBody>
              <h2 className="section-heading">Verification Process</h2>
              <div className="shell-list" style={{ marginTop: 14 }}>
                <div className="shell-list-row">
                  <div>
                    <strong>1. Lodgment</strong>
                    <span>Application is logged in the Legal Metrology registry.</span>
                  </div>
                </div>
                <div className="shell-list-row">
                  <div>
                    <strong>2. Administrative Review</strong>
                    <span>Officer reviews documentation and schedules verification.</span>
                  </div>
                </div>
                <div className="shell-list-row">
                  <div>
                    <strong>3. Field Inspection</strong>
                    <span>Authorized inspector performs accuracy measurement and error check.</span>
                  </div>
                </div>
                <div className="shell-list-row">
                  <div>
                    <strong>4. Certificate & Stamp</strong>
                    <span>Digital certificate with QR code issued upon passing verification.</span>
                  </div>
                </div>
              </div>
            </PanelBody>
          </section>
        </div>
      </div>
    </>
  );
}
