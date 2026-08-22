import { Head, router, useForm, usePage } from "@inertiajs/react";
import { AlertTriangle, CalendarPlus, CircleCheckBig, CircleX, ClipboardList, Download, FileSpreadsheet, LockKeyhole, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import BreadCrumbsHeader from "@/Components/BreadcrumbsHeader";
import MainLayout from "@/Layouts/MainLayout";
import InputField from "@/Components/InputField";
import InputError from "@/Components/InputError";
import Pagination from "@/Components/Pagination";

const emptyForm = { date_from: "", date_to: "", activity: "", participants: "", lead_division: "", venue: "", remarks: "" };
const fields = [
    ["date_from", "Date From", "date", ""],
    ["date_to", "Date To", "date", ""],
    ["activity", "Activity", "text", "e.g. Division planning workshop"],
    ["participants", "Participants", "text", "e.g. School heads and coordinators"],
    ["lead_division", "Lead Division", "text", "e.g. Curriculum Implementation Division"],
    ["venue", "Venue", "text", "e.g. Division Conference Hall"],
    ["remarks", "Remarks", "text", "Add any notes or reminders"],
];

const capaToast = {
    success: (message) => toast.success(message, {
        className: "!rounded-xl !border-emerald-200 !bg-emerald-50 !text-emerald-800 !shadow-xl",
        icon: <CircleCheckBig className="h-[18px] w-[18px] animate-bounce text-emerald-500" />,
    }),
    error: (message) => toast.error(message, {
        className: "!rounded-xl !border-red-200 !bg-red-50 !text-red-800 !shadow-xl",
        icon: <CircleX className="h-[18px] w-[18px] animate-pulse text-red-500" />,
    }),
};

export default function Management({ activities, embedded = false }) {
    const { flash = {} } = usePage().props;
    const form = useForm(emptyForm);
    const importForm = useForm({ rows: [] });
    const deleteForm = useForm({ password: "" });
    const fileRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [activityToDelete, setActivityToDelete] = useState(null);
    const [deleteStep, setDeleteStep] = useState("confirm");
    const activityRows = activities?.data ?? [];
    const canSaveActivity = Boolean(
        (form.data.date_from || form.data.date_to)
        && form.data.activity.trim()
        && form.data.participants.trim()
        && form.data.lead_division.trim()
        && form.data.venue.trim()
    );

    useEffect(() => {
        if (flash.success) capaToast.success(flash.success);
        if (flash.error) capaToast.error(flash.error);
    }, [flash.success, flash.error]);

    const submit = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => { form.reset(); setEditingActivity(null); setShowForm(false); } };
        if (editingActivity) form.put(route("capa.update", editingActivity.id), options);
        else form.post(route("capa.store"), options);
    };

    const closeForm = () => {
        form.clearErrors();
        form.reset();
        setEditingActivity(null);
        setShowForm(false);
    };

    const openAddForm = () => {
        form.reset();
        form.clearErrors();
        setEditingActivity(null);
        setShowForm(true);
    };

    const openEditForm = (activity) => {
        form.clearErrors();
        form.setData({
            date_from: String(activity.date_from ?? "").slice(0, 10),
            date_to: String(activity.date_to ?? "").slice(0, 10),
            activity: activity.activity ?? "",
            participants: activity.participants ?? "",
            lead_division: activity.lead_division ?? "",
            venue: activity.venue ?? "",
            remarks: activity.remarks ?? "",
        });
        setEditingActivity(activity);
        setShowForm(true);
    };

    const openDeleteModal = (activity) => {
        deleteForm.reset();
        deleteForm.clearErrors();
        setDeleteStep("confirm");
        setActivityToDelete(activity);
    };

    const closeDeleteModal = () => {
        if (deleteForm.processing) return;

        deleteForm.reset();
        deleteForm.clearErrors();
        setDeleteStep("confirm");
        setActivityToDelete(null);
    };

    const submitDelete = (event) => {
        event.preventDefault();

        deleteForm.delete(route("capa.destroy", activityToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                deleteForm.reset();
                deleteForm.clearErrors();
                setDeleteStep("confirm");
                setActivityToDelete(null);
            },
        });
    };

    const normalizeKey = (key) => {
        const normalized = String(key).trim().toLowerCase().replace(/\s*\(.*/, "").replace(/\s+/g, "_");

        if (["capa_date_from", "date_from", "from"].includes(normalized)) return "date_from";
        if (["capa_date_to", "date_to", "to"].includes(normalized)) return "date_to";
        return normalized === "date" || normalized === "capa_date" ? "date_from" : normalized;
    };
    const excelDate = (value) => {
        if (typeof value === "number") {
            const parsed = XLSX.SSF.parse_date_code(value);
            return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : "";
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("en-CA");
    };

    const importExcel = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
            const rows = rawRows.map((raw) => Object.fromEntries(Object.entries(raw).map(([key, value]) => [normalizeKey(key), value])))
                .map((row) => ({
                    date_from: excelDate(row.date_from), date_to: excelDate(row.date_to), activity: String(row.activity ?? "").trim(), participants: String(row.participants ?? "").trim(),
                    lead_division: String(row.lead_division ?? "").trim(), venue: String(row.venue ?? "").trim(), remarks: String(row.remarks ?? "").trim(),
                })).filter((row) => (row.date_from || row.date_to) && row.activity);
            if (!rows.length) throw new Error("No valid rows found. Check the CAPA Date From, CAPA Date To, and Activity columns.");
            importForm.setData("rows", rows);
            router.post(route("capa.import"), { rows }, { preserveScroll: true, onSuccess: () => { fileRef.current.value = ""; }, onError: () => capaToast.error("Some spreadsheet rows are invalid.") });
        } catch (error) { capaToast.error(error.message || "Unable to read the spreadsheet."); }
    };

    const content = (
            <div className={embedded ? "" : "min-h-[calc(100vh-65px)] p-5 md:p-8"}>
                <div className={embedded ? "" : "mx-auto max-w-7xl"}>
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div><h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900"><ClipboardList className="size-5 text-blue-700" /> CAPA Management</h1><p className="mt-1 text-xs text-slate-500">Add activities manually or import an Excel file.</p></div>
                        <div className="flex flex-wrap gap-2">
                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" />
                            <a href={route("capa.template")} download className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"><Download className="size-4" /> Download Excel Template</a>
                            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Upload className="size-4" /> Import Excel</button>
                            <button onClick={openAddForm} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-700/20"><Plus className="size-4" /> Add Activity</button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]" onClick={form.processing ? undefined : closeForm} />
                            <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <CalendarPlus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900">{editingActivity ? "Edit CAPA Activity" : "Add CAPA Activity"}</h2>
                                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{editingActivity ? "Update the selected calendar activity" : "Create a new calendar of activities entry"}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={closeForm} disabled={form.processing} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close modal"><X className="h-4 w-4" /></button>
                                </div>

                                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                                    <div className="overflow-y-auto px-6 py-5">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ClipboardList className="h-3.5 w-3.5" /></div>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-800">Activity Information</h3>
                                                <p className="text-[10px] font-medium text-slate-400">Schedule and details of the CAPA activity</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                            {fields.map(([name, label, type, placeholder]) => (
                                                <div key={name} className={name === "remarks" ? "sm:col-span-2" : ""}>
                                                    <InputField label={label} name={name} type={type} placeholder={placeholder} value={form.data[name]} onChange={(e) => form.setData(name, e.target.value)} required={["activity", "participants", "lead_division", "venue"].includes(name)} isTextarea={name === "remarks"} rows={3} />
                                                    <InputError message={form.errors[name]} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                        <p className="hidden text-[10px] font-medium text-slate-400 sm:block">Fields marked with <span className="text-red-500">*</span> are required.</p>
                                        <div className="ml-auto flex items-center gap-2">
                                            <button type="button" onClick={closeForm} disabled={form.processing} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                                            <button type="submit" disabled={form.processing || !canSaveActivity} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                                                {form.processing ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</> : <><Save className="h-3.5 w-3.5" />{editingActivity ? "Update Activity" : "Save Activity"}</>}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activityToDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]"
                                onClick={closeDeleteModal}
                            />

                            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                {deleteStep === "confirm" ? (
                                    <>
                                        <div className="px-6 pb-4 pt-6 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
                                                <AlertTriangle className="h-6 w-6" />
                                            </div>
                                            <h2 className="mt-5 text-base font-bold text-slate-900">Delete CAPA activity?</h2>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                You are about to permanently delete <span className="font-bold text-slate-700">{activityToDelete.activity}</span>. This action cannot be undone.
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                            <button type="button" onClick={closeDeleteModal} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100">Cancel</button>
                                            <button type="button" onClick={() => setDeleteStep("password")} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-red-700">
                                                <Trash2 className="h-3.5 w-3.5" /> Continue
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <form onSubmit={submitDelete}>
                                        <div className="px-6 pb-5 pt-6">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                                    <LockKeyhole className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-bold text-slate-900">Verify your password</h2>
                                                    <p className="mt-1 text-[11px] leading-4 text-slate-500">Enter your current password to confirm permanent deletion.</p>
                                                </div>
                                            </div>

                                            <div className="mt-5">
                                                <label htmlFor="delete-password" className="mb-1.5 block text-[11px] font-bold text-slate-600">Current Password</label>
                                                <input
                                                    id="delete-password"
                                                    type="password"
                                                    value={deleteForm.data.password}
                                                    onChange={(event) => deleteForm.setData("password", event.target.value)}
                                                    autoComplete="current-password"
                                                    autoFocus
                                                    required
                                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/15"
                                                    placeholder="Enter your password"
                                                />
                                                <InputError message={deleteForm.errors.password} />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                                            <button type="button" onClick={() => { deleteForm.clearErrors(); setDeleteStep("confirm"); }} disabled={deleteForm.processing} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Back</button>
                                            <button type="submit" disabled={deleteForm.processing || !deleteForm.data.password} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                {deleteForm.processing ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verifying...</> : <><Trash2 className="h-3.5 w-3.5" />Verify &amp; Delete</>}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl">
                        <div className="flex items-center gap-2 border-b border-slate-100/80 bg-white/40 px-6 py-4"><FileSpreadsheet className="size-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-800">CAPA Activity Records</h2><span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{activities?.total ?? 0}</span></div>
                        <div className="w-full max-w-full overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left">
                            <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">{["CAPA Date From", "CAPA Date To", "Activity", "Participants", "Lead Division", "Venue", "Remarks", "Actions"].map((h) => <th key={h} className="px-6 py-3.5">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-slate-100/60 text-xs">{activityRows.map((item) => <tr key={item.id} className="group transition-colors hover:bg-blue-50/40"><td className="whitespace-nowrap px-6 py-4 font-bold text-slate-700">{item.date_from ? new Date(`${String(item.date_from).slice(0, 10)}T00:00:00`).toLocaleDateString() : "—"}</td><td className="whitespace-nowrap px-6 py-4 font-bold text-slate-700">{item.date_to ? new Date(`${String(item.date_to).slice(0, 10)}T00:00:00`).toLocaleDateString() : "—"}</td><td className="px-6 py-4 font-semibold text-slate-800">{item.activity}</td><td className="px-6 py-4 text-slate-600">{item.participants || "—"}</td><td className="px-6 py-4 text-slate-600">{item.lead_division || "—"}</td><td className="px-6 py-4 text-slate-600">{item.venue || "—"}</td><td className="px-6 py-4 text-slate-600">{item.remarks || "—"}</td><td className="whitespace-nowrap px-6 py-4"><button onClick={() => openEditForm(item)} className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100" aria-label="Edit"><Pencil className="size-4" /></button><button onClick={() => openDeleteModal(item)} className="rounded-lg p-2 text-red-500 transition hover:bg-red-50" aria-label="Delete"><Trash2 className="size-4" /></button></td></tr>)}</tbody>
                        </table>{!activityRows.length && <p className="py-12 text-center text-sm text-slate-500">No CAPA activities yet.</p>}</div>
                        {activities?.links?.length > 3 && <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:px-6">
                            <p className="text-[11px] font-medium text-slate-400">Showing <span className="font-bold text-slate-600">{activities.from ?? 0}</span> to <span className="font-bold text-slate-600">{activities.to ?? 0}</span> of <span className="font-bold text-slate-600">{activities.total ?? 0}</span> records</p>
                            <Pagination links={activities.links} />
                        </div>}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Excel columns: CAPA Date From, CAPA Date To, Activity, Participants, Lead Division, Venue, Remarks. Activity and at least one CAPA date are required.</p>
                </div>
            </div>
    );

    if (embedded) return content;

    return (
        <MainLayout toasterProps={{ position: "top-right", closeButton: true, duration: 3500 }}>
            <Head title="CAPA Management" />
            <BreadCrumbsHeader breadcrumbs={[{ label: "CAPA Management", showOnMobile: true }]} />
            {content}
        </MainLayout>
    );
}
