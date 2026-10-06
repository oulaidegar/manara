"use client";

import { useState, useRef, useId } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/components/organization-context";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  ChevronRight,
  Info,
  Check,
  Eye,
  X,
} from "lucide-react";
import {
  CANONICAL_FIELDS,
  parseCsv,
  suggestColumnMapping,
  validateAndMapRows,
  generateCanonicalTemplateCsv,
  ValidatedRow,
} from "@/lib/csv";
import { Id } from "@/convex/_generated/dataModel";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "summary";

const PLATFORM_OPTIONS = [
  { value: "general", label: "General / Multi-platform" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "meta", label: "Meta (Instagram / Facebook)" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website / Publication" },
  { value: "substack", label: "Substack / Newsletter" },
  { value: "podcast", label: "Podcast" },
  { value: "twitter", label: "X / Twitter" },
];

export function CsvImporter() {
  const { organizationId, userRole } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUploadInputId = useId();

  // Wizard state
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("general");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRawRows, setParsedRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validatedData, setValidatedData] = useState<{
    validRows: ValidatedRow[];
    invalidRows: ValidatedRow[];
    summary: { total: number; valid: number; invalid: number };
  } | null>(null);

  // Execution state
  const [importResult, setImportResult] = useState<{
    runId: Id<"importRuns">;
    rowCount: number;
    importedCount: number;
    updatedCount: number;
    errorCount: number;
    status: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Inspection modal for historical runs
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<Id<"importRuns"> | null>(null);

  // Convex mutations & queries
  const executeImport = useMutation(api.imports.executeImport);
  const importRuns = useQuery(api.imports.listImportRuns, { organizationId });
  const selectedRunDetails = useQuery(
    api.imports.getImportRun,
    selectedHistoryRunId ? { organizationId, runId: selectedHistoryRunId } : "skip"
  );

  const canImport = userRole === "owner" || userRole === "admin" || userRole === "analyst";

  // Step 1: File selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0 || rows.length === 0) {
          setImportError("The uploaded CSV is empty or has no readable rows.");
          return;
        }

        setCsvHeaders(headers);
        setParsedRawRows(rows);

        // Pre-fill mapping suggestions
        const suggestions = suggestColumnMapping(headers);
        setColumnMapping(suggestions);
        setStep("mapping");
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateCanonicalTemplateCsv();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "radar_canonical_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Step 2: Proceed to preview
  const handleProceedToPreview = () => {
    // Invert mapping check: ensure 'date' and 'title' are mapped
    const mappedCanonicalFields = new Set(Object.values(columnMapping));
    if (!mappedCanonicalFields.has("date")) {
      alert("Please map a CSV column to the required 'Date' field.");
      return;
    }
    if (!mappedCanonicalFields.has("title")) {
      alert("Please map a CSV column to the required 'Title' field.");
      return;
    }

    const result = validateAndMapRows(parsedRawRows, columnMapping, selectedPlatform);
    setValidatedData(result);
    setStep("preview");
  };

  // Step 3: Execute import
  const handleExecuteImport = async () => {
    if (!validatedData || validatedData.validRows.length === 0) return;
    setStep("importing");
    setImportError(null);

    try {
      const payloadRows = validatedData.validRows.map((r) => ({
        date: r.data.date,
        platform: r.data.platform,
        externalId: r.data.externalId,
        url: r.data.url,
        title: r.data.title,
        text: r.data.text,
        contentType: r.data.contentType,
        impressions: r.data.impressions,
        reach: r.data.reach,
        views: r.data.views,
        likes: r.data.likes,
        comments: r.data.comments,
        shares: r.data.shares,
        saves: r.data.saves,
        clicks: r.data.clicks,
      }));

      const res = await executeImport({
        organizationId,
        fileName,
        sourcePlatform: selectedPlatform,
        rows: payloadRows,
      });

      setImportResult(res);
      setStep("summary");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import execution failed");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setCsvHeaders([]);
    setParsedRawRows([]);
    setColumnMapping({});
    setValidatedData(null);
    setImportResult(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Importer Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />
              <span>CSV Ingestion Engine</span>
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Ingest historical communications data with automated column mapping and Section 21 deduplication.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] transition-colors self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
          <span className={`flex items-center gap-1.5 ${step === "upload" ? "text-[var(--accent)] font-semibold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">1</span>
            Upload
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={`flex items-center gap-1.5 ${step === "mapping" ? "text-[var(--accent)] font-semibold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">2</span>
            Map Columns
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={`flex items-center gap-1.5 ${step === "preview" ? "text-[var(--accent)] font-semibold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">3</span>
            Validate & Preview
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={`flex items-center gap-1.5 ${step === "summary" ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">4</span>
            Import Summary
          </span>
        </div>

        {/* Error Notification */}
        {importError && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Import Error</div>
              <div>{importError}</div>
            </div>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Default Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Fallback platform if rows don&apos;t specify a platform column.
                </p>
              </div>

              <div className="md:col-span-2">
                <input
                  ref={fileInputRef}
                  id={fileUploadInputId}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={!canImport}
                />
                <label
                  htmlFor={fileUploadInputId}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center transition-colors bg-[var(--muted)]/20 ${
                    canImport
                      ? "hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <Upload className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {canImport ? "Click or drag CSV file to upload" : "Analyst or Admin role required to import"}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    Standard comma-separated spreadsheets (.csv up to 10MB)
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] p-4 text-xs space-y-2">
              <div className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>Section 21 Ingestion Standards</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)] text-[11px]">
                <li>Imports support repeated runs without producing duplicate items.</li>
                <li>Radar automatically matches records via <strong>External ID</strong>, <strong>URL</strong>, or composite <strong>(Platform + Date + Title)</strong>.</li>
                <li>Matched records update metrics rather than creating duplicate entries.</li>
                <li>Every import run is permanently audited with row-level error accountability.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === "mapping" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[var(--muted)]/30 p-3.5 rounded-lg border border-[var(--border)] text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--foreground)]">{fileName}</span>
                <span className="text-[var(--muted-foreground)]">({parsedRawRows.length} rows, {csvHeaders.length} columns detected)</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Choose another file</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-[var(--foreground)]">
                Match CSV Columns to Radar Canonical Fields
              </div>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Canonical Field</th>
                      <th className="py-2.5 px-3 font-medium">Type</th>
                      <th className="py-2.5 px-3 font-medium">Matched CSV Column</th>
                      <th className="py-2.5 px-3 font-medium">Sample Value (Row 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {CANONICAL_FIELDS.map((field) => {
                      // Find which CSV header maps to this canonical field
                      const currentHeader = Object.entries(columnMapping).find(
                        ([, mappedKey]) => mappedKey === field.key
                      )?.[0] || "";

                      const sampleVal = currentHeader ? parsedRawRows[0]?.[currentHeader] || "—" : "—";

                      return (
                        <tr key={field.key} className="hover:bg-[var(--muted)]/20">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--foreground)]">{field.label}</span>
                              {field.required && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--muted-foreground)]">{field.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[var(--muted-foreground)] capitalize font-mono text-[11px]">
                            {field.type}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={currentHeader}
                              onChange={(e) => {
                                const newHeader = e.target.value;
                                setColumnMapping((prev) => {
                                  const updated = { ...prev };
                                  // Remove existing mapping for this field
                                  for (const [k, v] of Object.entries(updated)) {
                                    if (v === field.key) delete updated[k];
                                  }
                                  if (newHeader) {
                                    updated[newHeader] = field.key;
                                  }
                                  return updated;
                                });
                              }}
                              className={`w-full max-w-xs rounded-lg border px-2.5 py-1.5 text-xs bg-[var(--background)] ${
                                field.required && !currentHeader
                                  ? "border-amber-400 bg-amber-50/20"
                                  : "border-[var(--border)]"
                              }`}
                            >
                              <option value="">— Unmapped —</option>
                              {csvHeaders.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-[var(--muted-foreground)] font-mono text-[11px]">
                            {sampleVal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToPreview}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
              >
                <span>Preview & Validate Rows</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATE */}
        {step === "preview" && validatedData && (
          <div className="space-y-6">
            {/* Validation Tally Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                <div className="text-xs text-[var(--muted-foreground)]">Total Rows</div>
                <div className="text-xl font-bold text-[var(--foreground)] mt-1">{validatedData.summary.total}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Valid Rows Ready to Import</span>
                </div>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                  {validatedData.summary.valid}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Invalid Rows (Skipped)</span>
                </div>
                <div className="text-xl font-bold text-amber-800 dark:text-amber-200 mt-1">
                  {validatedData.summary.invalid}
                </div>
              </div>
            </div>

            {/* Invalid rows warning if any */}
            {validatedData.invalidRows.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 text-xs space-y-2">
                <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{validatedData.invalidRows.length} rows failed validation</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 max-h-32 overflow-y-auto space-y-1">
                  {validatedData.invalidRows.slice(0, 10).map((r) => (
                    <div key={r.rowNumber}>
                      Row #{r.rowNumber}: {r.errors.join(", ")}
                    </div>
                  ))}
                  {validatedData.invalidRows.length > 10 && (
                    <div className="font-medium">...and {validatedData.invalidRows.length - 10} more rows.</div>
                  )}
                </div>
              </div>
            )}

            {/* Normalized Preview Table */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--foreground)] flex items-center justify-between">
                <span>Sample Normalized Records (First 5 Rows)</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Previewing how rows will appear in Radar Content & Analytics
                </span>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Impressions</th>
                      <th className="py-2.5 px-3 text-right">Reach</th>
                      <th className="py-2.5 px-3 text-right">Views</th>
                      <th className="py-2.5 px-3 text-right">Shares</th>
                      <th className="py-2.5 px-3 text-right">Saves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {validatedData.validRows.slice(0, 5).map((r) => (
                      <tr key={r.rowNumber} className="hover:bg-[var(--muted)]/20">
                        <td className="py-2 px-3 font-mono text-[11px] text-[var(--muted-foreground)]">
                          {r.data.date}
                        </td>
                        <td className="py-2 px-3 max-w-[280px] truncate font-medium text-[var(--foreground)]">
                          {r.data.title}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--muted)] capitalize">
                            {r.data.platform}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[var(--muted-foreground)] capitalize">
                          {r.data.contentType}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {r.data.impressions?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {r.data.reach?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {r.data.views?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--foreground)]">
                          {r.data.shares?.toLocaleString() ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {r.data.saves?.toLocaleString() ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep("mapping")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Mapping</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={validatedData.validRows.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Execute Import ({validatedData.validRows.length} Rows)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING */}
        {step === "importing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                Processing Import & Deduplicating Records...
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1 max-w-sm">
                Validating unique keys, updating existing content metrics, and recording granular observations.
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SUMMARY */}
        {step === "summary" && importResult && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>CSV Import Completed Successfully</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Data from <strong>{fileName}</strong> has been incorporated into your organization&apos;s operational database.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Total Processed</div>
                <div className="text-xl font-bold text-[var(--foreground)] mt-1">{importResult.rowCount}</div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20">
                <div className="text-xs text-emerald-700 dark:text-emerald-300">New Items Created</div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {importResult.importedCount}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/20">
                <div className="text-xs text-blue-700 dark:text-blue-300">Deduplicated & Updated</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  {importResult.updatedCount}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Errors / Skipped</div>
                <div className="text-xl font-bold text-[var(--foreground)] mt-1">{importResult.errorCount}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Import Another File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historical Import Runs Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Import History</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Audit trail of all spreadsheet ingestion runs, deduplication counts, and row error reports.
            </p>
          </div>
        </div>

        {importRuns === undefined ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : importRuns.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
            No historical import runs recorded yet. Upload a CSV above to begin.
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)] font-medium">
                <tr>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Rows</th>
                  <th className="py-2.5 px-3 text-right">New</th>
                  <th className="py-2.5 px-3 text-right">Updated</th>
                  <th className="py-2.5 px-3 text-right">Errors</th>
                  <th className="py-2.5 px-3">Imported By</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {importRuns.map((run) => (
                  <tr key={run._id} className="hover:bg-[var(--muted)]/20">
                    <td className="py-2 px-3 font-medium text-[var(--foreground)] flex items-center gap-1.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
                      <span>{run.fileName}</span>
                    </td>
                    <td className="py-2 px-3 capitalize text-[var(--muted-foreground)]">{run.sourcePlatform}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          run.status === "completed"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : run.status === "failed"
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{run.rowCount}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {run.importedCount}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {run.updatedCount}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                      {run.errorCount}
                    </td>
                    <td className="py-2 px-3 text-[var(--muted-foreground)]">{run.createdByName}</td>
                    <td className="py-2 px-3 text-[var(--muted-foreground)] font-mono text-[11px]">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedHistoryRunId(run._id)}
                        className="px-2 py-1 rounded hover:bg-[var(--muted)] text-[11px] font-medium text-[var(--accent)] flex items-center gap-1 mx-auto"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Run Details Inspection Modal */}
      {selectedHistoryRunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />
                <h3 className="text-base font-semibold text-[var(--foreground)]">Import Run Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryRunId(null)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedRunDetails === undefined ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : selectedRunDetails === null ? (
              <div className="text-xs text-[var(--muted-foreground)] py-8 text-center">Run details not found.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="text-[var(--muted-foreground)]">File Name</div>
                    <div className="font-semibold text-[var(--foreground)] truncate mt-0.5">
                      {selectedRunDetails.fileName}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="text-[var(--muted-foreground)]">Platform</div>
                    <div className="font-semibold text-[var(--foreground)] capitalize mt-0.5">
                      {selectedRunDetails.sourcePlatform}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="text-[var(--muted-foreground)]">Imported By</div>
                    <div className="font-semibold text-[var(--foreground)] mt-0.5">
                      {selectedRunDetails.createdByName}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="text-[var(--muted-foreground)]">Status</div>
                    <div className="font-semibold text-[var(--foreground)] capitalize mt-0.5">
                      {selectedRunDetails.status}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg border border-[var(--border)]">
                    <div className="text-[var(--muted-foreground)] text-[11px]">Total Rows</div>
                    <div className="font-bold text-sm text-[var(--foreground)]">{selectedRunDetails.rowCount}</div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20">
                    <div className="text-emerald-700 dark:text-emerald-300 text-[11px]">Created</div>
                    <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                      {selectedRunDetails.importedCount}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/20">
                    <div className="text-blue-700 dark:text-blue-300 text-[11px]">Updated</div>
                    <div className="font-bold text-sm text-blue-700 dark:text-blue-300">
                      {selectedRunDetails.updatedCount}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/20">
                    <div className="text-amber-700 dark:text-amber-300 text-[11px]">Errors</div>
                    <div className="font-bold text-sm text-amber-700 dark:text-amber-300">
                      {selectedRunDetails.errorCount}
                    </div>
                  </div>
                </div>

                {/* Error Log Inspection */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--foreground)]">Logged Row Exceptions</div>
                  {(!selectedRunDetails.errors || selectedRunDetails.errors.length === 0) ? (
                    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 text-xs text-center text-[var(--muted-foreground)]">
                      No errors or malformed rows occurred in this run.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] text-xs">
                      {selectedRunDetails.errors.map((err, idx) => (
                        <div key={idx} className="p-2.5 bg-red-50/30 dark:bg-red-950/20 space-y-1">
                          <div className="font-medium text-red-800 dark:text-red-200 flex items-center justify-between">
                            <span>Row #{err.rowNumber} {err.field ? `(${err.field})` : ""}</span>
                            <span className="text-[10px] font-mono">{err.message}</span>
                          </div>
                          {err.rawData && (
                            <div className="text-[10px] font-mono text-[var(--muted-foreground)] truncate">
                              {err.rawData}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryRunId(null)}
                    className="px-4 py-2 rounded-lg bg-[var(--muted)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/80"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
