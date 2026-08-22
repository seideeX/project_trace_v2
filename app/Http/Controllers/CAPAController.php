<?php
namespace App\Http\Controllers;
use App\Models\CAPA;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
class CAPAController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $canManage = $request->user()?->hasRole('admin') ?? false;
        $calendarMonth = $request->string('month')->toString();

        if (! preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $calendarMonth)) {
            $calendarMonth = now()->format('Y-m');
        }

        $monthStart = CarbonImmutable::createFromFormat('Y-m-d', $calendarMonth.'-01')->startOfMonth();

        return Inertia::render('CAPA/Calendar', [
            'activities' => $canManage
                ? CAPA::query()->orderByRaw('COALESCE(date_from, date_to)')->paginate(5)->withQueryString()
                : null,
            'calendarActivities' => CAPA::query()
                ->select(['id', 'date_from', 'date_to', 'activity'])
                ->where(function ($query) use ($monthStart) {
                    $monthEnd = $monthStart->endOfMonth();

                    $query->where(function ($query) use ($monthStart, $monthEnd) {
                        $query->whereNotNull('date_from')
                            ->where('date_from', '<=', $monthEnd)
                            ->where(function ($query) use ($monthStart) {
                                $query->whereNull('date_to')
                                    ->orWhere('date_to', '>=', $monthStart);
                            });
                    })
                        ->orWhere(function ($query) use ($monthStart, $monthEnd) {
                            $query->whereNull('date_from')
                                ->whereBetween('date_to', [$monthStart, $monthEnd]);
                        });
                })
                ->orderByRaw('COALESCE(date_from, date_to)')
                ->get(),
            'calendarMonth' => $calendarMonth,
            'canManage' => $canManage,
        ]);
    }

    public function management()
    {
        abort_unless(auth()->user()?->hasRole('admin'), 403);

        return redirect()->route('capa.index');
    }

    public function downloadTemplate(Request $request)
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $path = public_path('templates/capa_template.xlsx');

        abort_unless(is_file($path), 404);

        return response()->download($path, 'capa_template.xlsx');
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'activity' => ['required', 'string', 'max:2000'],
            'participants' => ['nullable', 'string', 'max:2000'],
            'lead_division' => ['nullable', 'string', 'max:255'],
            'venue' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        CAPA::create($this->prepareDateRange($data));

        return back()->with('success', 'CAPA activity added successfully.');
    }

    public function import(Request $request)
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $data = $request->validate([
            'rows' => ['required', 'array', 'min:1', 'max:1000'],
            'rows.*.date_from' => ['nullable', 'date'],
            'rows.*.date_to' => ['nullable', 'date'],
            'rows.*.activity' => ['required', 'string', 'max:2000'],
            'rows.*.participants' => ['nullable', 'string', 'max:2000'],
            'rows.*.lead_division' => ['nullable', 'string', 'max:255'],
            'rows.*.venue' => ['nullable', 'string', 'max:255'],
            'rows.*.remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $rows = collect($data['rows'])->map(function (array $row, int $index) {
            if (blank($row['date_from'] ?? null) && blank($row['date_to'] ?? null)) {
                throw ValidationException::withMessages([
                    "rows.$index.date_from" => 'Enter a CAPA Date From or CAPA Date To.',
                ]);
            }

            if (filled($row['date_from'] ?? null) && filled($row['date_to'] ?? null) && $row['date_to'] < $row['date_from']) {
                throw ValidationException::withMessages([
                    "rows.$index.date_to" => 'The CAPA Date To must be on or after CAPA Date From.',
                ]);
            }

            return $this->prepareDateRange($row);
        });

        DB::transaction(fn () => $rows->each(
            fn (array $row) => CAPA::create($row)
        ));

        return back()->with('success', count($data['rows']).' CAPA activities imported.');
    }
    /**
     * Display the specified resource.
     */
    public function show(CAPA $cAPA)
    {
        //
    }
    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CAPA $cAPA)
    {
        //
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, CAPA $cAPA)
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'activity' => ['required', 'string', 'max:2000'],
            'participants' => ['nullable', 'string', 'max:2000'],
            'lead_division' => ['nullable', 'string', 'max:255'],
            'venue' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $cAPA->update($this->prepareDateRange($data));

        return back()->with('success', 'CAPA activity updated successfully.');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, CAPA $cAPA)
    {
        abort_unless($request->user()?->hasRole('admin'), 403);

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $cAPA->delete();

        return back()->with('success', 'CAPA activity deleted.');
    }

    private function prepareDateRange(array $data): array
    {
        $dateFrom = $data['date_from'] ?? null;
        $dateTo = $data['date_to'] ?? null;

        validator(
            ['date_from' => $dateFrom, 'date_to' => $dateTo],
            ['date_from' => ['required_without:date_to'], 'date_to' => ['required_without:date_from']]
        )->validate();

        return $data;
    }
}
