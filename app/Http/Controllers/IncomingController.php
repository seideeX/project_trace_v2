<?php

namespace App\Http\Controllers;

use App\Models\ProcurementRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class IncomingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        $query = ProcurementRoute::query()
            ->with([
                'procurement:id,pr_no,project_title,purpose,end_user_department_id,current_department_id,abc,mode_of_procurement,status,date_of_implementation',

                'procurement.endUserDepartment:id,name,code',

                'procurement.currentDepartment:id,name,code',

                'fromDepartment:id,name,code',

                'toDepartment:id,name,code',

                'forwardedBy:id,name,position',

                'receivedBy:id,name,position',
            ])

            /*
            |--------------------------------------------------------------------------
            | Incoming PR
            |--------------------------------------------------------------------------
            |
            | The PR must currently be assigned to the logged-in user's department.
            |
            */

            ->whereHas('procurement', function ($q) use ($user) {
                $q->where(
                    'current_department_id',
                    $user->department_id
                );
            })

            /*
            |--------------------------------------------------------------------------
            | Route destination
            |--------------------------------------------------------------------------
            */

            ->where(
                'to_department_id',
                $user->department_id
            )

            /*
            |--------------------------------------------------------------------------
            | Only forwarded documents
            |--------------------------------------------------------------------------
            */

            ->where('action', 'Forwarded')

            /*
            |--------------------------------------------------------------------------
            | Not yet received
            |--------------------------------------------------------------------------
            */

            ->whereNull('received_by');


        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->whereHas('procurement', function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('pr_no', 'like', "%{$search}%")
                        ->orWhere(
                            'project_title',
                            'like',
                            "%{$search}%"
                        );
                });
            });
        }
        /*
        |--------------------------------------------------------------------------
        | Stage Filter
        |--------------------------------------------------------------------------
        */
        if (
            $request->filled('stage') &&
            $request->stage !== 'all'
        ) {
            $query->where(
                'stage',
                $request->stage
            );
        }
        /*
        |--------------------------------------------------------------------------
        | Date From
        |--------------------------------------------------------------------------
        */
        if ($request->filled('date_from')) {
            $query->whereDate(
                'forwarded_at',
                '>=',
                $request->date_from
            );
        }
        /*
        |--------------------------------------------------------------------------
        | Date To
        |--------------------------------------------------------------------------
        */
        if ($request->filled('date_to')) {
            $query->whereDate(
                'forwarded_at',
                '<=',
                $request->date_to
            );
        }
        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */
        $incomingPRs = $query
            ->orderByDesc('forwarded_at')
            ->paginate(10)
            ->withQueryString();
        /*
        |--------------------------------------------------------------------------
        | Available Stages
        |--------------------------------------------------------------------------
        */
        $stages = ProcurementRoute::query()
            ->where(
                'to_department_id',
                $user->department_id
            )
            ->where('action', 'Forwarded')
            ->whereNull('received_by')
            ->distinct()
            ->orderBy('stage')
            ->pluck('stage');
        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */
        return Inertia::render('Incoming/Index', [
            'incomingPRs' => $incomingPRs,
            'stages' => $stages,
            'filters' => [
                'search' => $request->search ?? '',
                'stage' => $request->stage ?? 'all',
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
            ],
            'department' => $user->department?->name,
            'departmentId' => $user->department_id,
        ]);
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}