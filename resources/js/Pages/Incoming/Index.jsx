import { Head, router, usePage } from "@inertiajs/react";
import {
    ArrowBigRightDashIcon,
    ArrowDownToLine,
    Building2,
    CalendarDays,
    ChevronRight,
    Clock3,
    Eye,
    FileText,
    UserRound,
} from "lucide-react";

import MainLayout from "@/Layouts/MainLayout";
import DynamicTable from "@/Components/DynamicTable";
import FilterToggle from "@/Components/FilterButtons/FillterToggle";
import BreadCrumbsHeader from "@/Components/BreadcrumbsHeader";
import ProcurementDrawerModal from "../Procurement/ProcurementDrawerModal";
import { useState } from "react";

export default function Index({ incomingPRs, filters = {}, department }) {
    const queryParams = filters;
    const [selectedProcurement, setSelectedProcurement] = useState(null);
    const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);
    const [isLoadingProcurement, setIsLoadingProcurement] = useState(false);
    const { auth, flash } = usePage().props;

    const user = auth?.user;

    const breadcrumbs = [
        {
            label: "Incoming Requests",
            showOnMobile: true,
        },
    ];
    const handleViewProcurement = async (procurementId) => {
        try {
            setIsLoadingProcurement(true);

            const response = await fetch(
                route("procurement.show", procurementId),
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch procurement (${response.status})`,
                );
            }

            const data = await response.json();

            setSelectedProcurement(data);
            setIsProcurementModalOpen(true);
        } catch (error) {
            console.error("Failed to fetch procurement:", error);
        } finally {
            setIsLoadingProcurement(false);
        }
    };
    const handleClose = () => {
        setSelectedProcurement(null);
    };
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
            key: "origin_department",
            label: "Origin",
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
            key: "status",
            label: "Status",
        },
        {
            key: "actions",
            label: "Action",
            className: "text-right",
            cellClassName: "text-right",
        },
    ];

    const columnRenderers = {
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

        origin_department: (row) => (
            <div className="flex min-w-[160px] items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />

                <div>
                    <p className="font-semibold text-slate-700">
                        {row.from_department?.name ?? "-"}
                    </p>

                    <p className="text-[10px] text-slate-400">
                        {row.from_department?.code ?? ""}
                    </p>
                </div>
            </div>
        ),

        stage: (row) => (
            <span className="inline-flex whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600">
                {(row.stage ?? "")
                    .replace("_", " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
        ),

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

        status: () => (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 ring-1 ring-amber-100">
                <Clock3 className="h-3 w-3" />
                Awaiting Receipt
            </span>
        ),
        actions: (procurement) => (
            <div className="flex items-center justify-end">
                <button
                    type="button"
                    onClick={() =>
                        handleViewProcurement(procurement.procurement.id)
                    }
                    title={`View procurement ${procurement.procurement.pr_no}`}
                    aria-label={`View procurement ${procurement.procurement.pr_no}`}
                    className="group inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-[0_4px_12px_rgba(37,99,235,0.10)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1 active:translate-y-0"
                >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100/80 transition-all duration-200 group-hover:bg-blue-100 group-hover:text-blue-600">
                        <ArrowBigRightDashIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                    </span>

                    <span className="text-[11px] font-bold tracking-wide">
                        Dispatch
                    </span>
                </button>
            </div>
        ),
    };
    const handleRowClick = (row) => {
        const procurementId = row.procurement_id ?? row.procurement?.id;

        if (!procurementId) return;

        handleViewProcurement(procurementId);
    };

    return (
        <MainLayout>
            <Head title="Incoming Purchase Requests" />
            <BreadCrumbsHeader breadcrumbs={breadcrumbs} />
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-7">
                <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                    <ArrowDownToLine className="h-5 w-5" />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-800">
                                        Incoming Purchase Requests
                                    </h1>

                                    <p className="text-xs text-slate-500">
                                        Purchase requests awaiting receipt by{" "}
                                        <span className="font-semibold text-slate-700">
                                            {department ?? "your department"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Count */}
                        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-2.5">
                            <ArrowDownToLine className="h-4 w-4 text-blue-600" />

                            <div>
                                <p className="text-lg font-bold leading-none text-blue-700">
                                    {incomingPRs?.total ?? 0}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-blue-500">
                                    Incoming PRs
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <FilterToggle
                        queryParams={queryParams}
                        visibleFilters={["stage", "date"]}
                        clearRouteName="incoming.index"
                    />

                    {/* Table */}
                    <DynamicTable
                        data={incomingPRs?.data ?? []}
                        allColumns={columns}
                        columnRenderers={columnRenderers}
                        pagination={incomingPRs}
                        queryParams={queryParams}
                        onRowClick={handleRowClick}
                        emptyMessage="No incoming purchase requests"
                        emptyDescription={`There are currently no purchase requests waiting to be received by ${
                            department ?? "your department"
                        }.`}
                    />
                </div>
                <ProcurementDrawerModal
                    isOpen={selectedProcurement}
                    onClose={() => handleClose(false)}
                    currentRole={{
                        deptId: user.department_id,
                        dept: user.department?.name,
                        name: user.name,
                    }}
                    initialData={selectedProcurement}
                />
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
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) return "-";

    return new Date(value).toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
    });
}
