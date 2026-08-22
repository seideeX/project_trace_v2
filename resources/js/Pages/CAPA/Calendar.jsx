import { Head, router } from "@inertiajs/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import BreadCrumbsHeader from "@/Components/BreadcrumbsHeader";
import MainLayout from "@/Layouts/MainLayout";
import Management from "./Management";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar({ activities, calendarActivities, calendarMonth, canManage = false }) {
    const month = useMemo(() => new Date(`${calendarMonth}-01T00:00:00`), [calendarMonth]);
    const cells = useMemo(() => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const first = new Date(year, monthIndex, 1).getDay();
        const count = new Date(year, monthIndex + 1, 0).getDate();
        return Array.from({ length: 42 }, (_, index) => {
            const day = index - first + 1;
            return day > 0 && day <= count ? day : null;
        });
    }, [month]);

    const activityMap = useMemo(() => calendarActivities.reduce((map, item) => {
        const start = new Date(`${String(item.date_from ?? item.date_to).slice(0, 10)}T00:00:00`);
        const end = new Date(`${String(item.date_to ?? item.date_from).slice(0, 10)}T00:00:00`);
        const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastVisibleDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return map;

        const rangeStart = start < firstVisibleDay ? firstVisibleDay : start;
        const rangeEnd = end > lastVisibleDay ? lastVisibleDay : end;

        for (const date = new Date(rangeStart); date <= rangeEnd; date.setDate(date.getDate() + 1)) {
            const key = date.toLocaleDateString("en-CA");
            map[key] = [...(map[key] ?? []), item];
        }

        return map;
    }, {}), [calendarActivities, month]);

    const loadMonth = (date) => router.get(route("capa.index"), {
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        ...(activities?.current_page > 1 ? { page: activities.current_page } : {}),
    }, {
        only: ["activities", "calendarActivities", "calendarMonth"],
        preserveScroll: true,
        preserveState: true,
        replace: true,
    });
    const changeMonth = (amount) => loadMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
    const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <MainLayout toasterProps={{ position: "top-right", closeButton: true, duration: 3500 }}>
            <Head title="CAPA" />
            <BreadCrumbsHeader breadcrumbs={[{ label: "CAPA", showOnMobile: true }]} />
            <div className="min-h-[calc(100vh-65px)] p-5 md:p-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    {canManage && <Management activities={activities} embedded />}

                    <section>
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900"><CalendarDays className="size-5 text-blue-700" /> Calendar of Activities</h1>
                                <p className="mt-1 text-xs text-slate-500">View all scheduled CAPA activities.</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border bg-white p-1 shadow-sm">
                                <button onClick={() => changeMonth(-1)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Previous month"><ChevronLeft className="size-4" /></button>
                                <button onClick={() => loadMonth(new Date())} className="min-w-40 px-3 text-sm font-bold text-slate-700">{monthLabel}</button>
                                <button onClick={() => changeMonth(1)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Next month"><ChevronRight className="size-4" /></button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="grid grid-cols-7 border-b bg-slate-50">
                                {days.map((day) => <div key={day} className="px-2 py-3 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{day}</div>)}
                            </div>
                            <div className="grid grid-cols-7">
                                {cells.map((day, index) => {
                                    const key = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
                                    const items = key ? activityMap[key] ?? [] : [];
                                    const today = key === new Date().toLocaleDateString("en-CA");
                                    return <div key={index} className={`min-h-28 border-b border-r p-2 ${day ? "bg-white" : "bg-slate-50/70"}`}>
                                        {day && <span className={`inline-flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${today ? "bg-blue-700 text-white" : "text-slate-600"}`}>{day}</span>}
                                        <div className="mt-1 space-y-1.5">
                                            {items.map((item) => <div key={item.id} title={item.activity} className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-2 text-[10px] text-slate-700">
                                                <p className="line-clamp-2 font-bold leading-tight text-blue-900">{item.activity}</p>
                                            </div>)}
                                        </div>
                                    </div>;
                                })}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </MainLayout>
    );
}
