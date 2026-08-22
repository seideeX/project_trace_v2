import { Head, router } from "@inertiajs/react";
import {
    ArrowUpFromLine,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Eye,
    FileText,
    UserRound,
} from "lucide-react";

import MainLayout from "@/Layouts/MainLayout";
import DynamicTable from "@/Components/DynamicTable";
import FilterToggle from "@/Components/FilterButtons/FillterToggle";

export default function Index({
    outgoingPRs,
    filters = {},
    departments = {},
    department,
}) {
    const queryParams = filters;
    const breadcrumbs = [
        {
            label: "Outgoing Requests",
            showOnMobile: true,
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Table Columns
    |--------------------------------------------------------------------------
    */

    const columns = [
        {
            key: "pr_no",
            label: "PR Number",
            className: "whitespace-nowrap",
        },

        {
            key: "project_title",
            label: "Procurement",
        },

        {
            key: "end_user",
            label: "End User",
        },

        {
            key: "destination",
            label: "Forwarded To",
        },

        {
            key: "stage",
            label: "Stage",
        },

        {
            key: "forwarded_at",
            label: "Forwarded",
        },

        {
            key: "receipt_status",
            label: "Status",
        },

        {
            key: "actions",
            label: "Action",
            className: "text-right",
            cellClassName: "text-right",
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Table Renderers
    |--------------------------------------------------------------------------
    */

    const columnRenderers = {
        /*
        |--------------------------------------------------------------------------
        | PR Number
        |--------------------------------------------------------------------------
        */

        pr_no: (row) => (
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="h-4 w-4" />
                </div>

                <div>
                    <p className="font-bold text-slate-700">
                        {row.procurement?.pr_no ?? "-"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        Route #{row.id}
                    </p>
                </div>
            </div>
        ),

        /*
        |--------------------------------------------------------------------------
        | Project
        |--------------------------------------------------------------------------
        */

        project_title: (row) => (
            <div className="min-w-[220px] max-w-[320px]">
                <p className="truncate font-semibold text-slate-700">
                    {row.procurement?.project_title ?? "-"}
                </p>

                {row.procurement?.purpose && (
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {row.procurement.purpose}
                    </p>
                )}
            </div>
        ),

        /*
        |--------------------------------------------------------------------------
        | End User
        |--------------------------------------------------------------------------
        */

        end_user: (row) => (
            <div className="flex min-w-[180px] items-center gap-2">
                <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                <div>
                    <p className="font-semibold text-slate-700">
                        {row.procurement?.end_user ?? "-"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        {row.procurement?.end_user_department?.name ?? "-"}
                    </p>
                </div>
            </div>
        ),

        /*
        |--------------------------------------------------------------------------
        | Destination
        |--------------------------------------------------------------------------
        */

        destination: (row) => (
            <div className="flex min-w-[170px] items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                <div>
                    <p className="font-semibold text-slate-700">
                        {row.to_department?.name ?? "-"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        {row.to_department?.code ?? ""}
                    </p>
                </div>
            </div>
        ),

        /*
        |--------------------------------------------------------------------------
        | Stage
        |--------------------------------------------------------------------------
        */

        stage: (row) => (
            <span className="inline-flex whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                {(row.stage ?? "")
                    .replace("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
        ),

        /*
        |--------------------------------------------------------------------------
        | Forwarded Date
        |--------------------------------------------------------------------------
        */

        forwarded_at: (row) => (
            <div className="flex items-center gap-2 whitespace-nowrap">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                <div>
                    <p className="font-semibold text-slate-600">
                        {formatDate(row.forwarded_at)}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        {formatTime(row.forwarded_at)}
                    </p>
                </div>
            </div>
        ),

        /*
        |--------------------------------------------------------------------------
        | Receipt Status
        |--------------------------------------------------------------------------
        */

        receipt_status: (row) => {
            const received = Boolean(row.received_by);

            return received ? (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-3 w-3" />
                    Received
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 ring-1 ring-amber-100">
                    <Clock3 className="h-3 w-3" />
                    Awaiting Receipt
                </span>
            );
        },

        /*
        |--------------------------------------------------------------------------
        | Actions
        |--------------------------------------------------------------------------
        */

        actions: (row) => (
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();

                    router.visit(
                        route("procurement.details", row.procurement_id),
                    );
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
                <Eye className="h-3.5 w-3.5" />
                View Details
            </button>
        ),
    };

    /*
    |--------------------------------------------------------------------------
    | Row Click
    |--------------------------------------------------------------------------
    */

    const handleRowClick = (row) => {
        const procurementId = row.procurement_id ?? row.procurement?.id;

        if (!procurementId) return;
    };

    return (
        <MainLayout>
            <Head title="Outgoing Purchase Requests" />
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-7">
                <div className="space-y-5">
                    {/* Header */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                    <ArrowUpFromLine className="h-5 w-5" />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-800">
                                        Outgoing Purchase Requests
                                    </h1>

                                    <p className="text-xs text-slate-500">
                                        Purchase requests forwarded from{" "}
                                        <span className="font-semibold text-slate-700">
                                            {department ?? "your department"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Count */}

                        <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-2.5">
                            <ArrowUpFromLine className="h-4 w-4 text-indigo-600" />

                            <div>
                                <p className="text-lg font-bold leading-none text-indigo-700">
                                    {outgoingPRs?.total ?? 0}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                                    Outgoing PRs
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}

                    <FilterToggle
                        queryParams={queryParams}
                        visibleFilters={["department", "status", "date"]}
                        clearRouteName="outgoing.index"
                        departments={departments}
                    />

                    {/* Table */}

                    <DynamicTable
                        data={outgoingPRs?.data ?? []}
                        allColumns={columns}
                        columnRenderers={columnRenderers}
                        pagination={outgoingPRs}
                        queryParams={queryParams}
                        onRowClick={handleRowClick}
                        emptyMessage="No outgoing purchase requests"
                        emptyDescription={`There are currently no purchase requests forwarded from ${
                            department ?? "your department"
                        }.`}
                    />
                </div>
            </div>
        </MainLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
    });
}
