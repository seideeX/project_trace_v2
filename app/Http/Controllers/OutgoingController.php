<?php

namespace App\Http\Controllers;

use App\Models\ProcurementRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OutgoingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = ProcurementRoute::query()
            ->with([
                'procurement:id,pr_no,project_title,purpose,end_user,end_user_department_id,current_department_id,abc,mode_of_procurement,status,date_of_implementation',
                'procurement.endUserDepartment:id,name,code',
                'procurement.currentDepartment:id,name,code',
                'fromDepartment:id,name,code',
                'toDepartment:id,name,code',
                'forwardedBy:id,name,position',
                'receivedBy:id,name,position',
            ])
            /*
            |--------------------------------------------------------------------------
            | Route originated from my department
            |--------------------------------------------------------------------------
            */
            ->where(
                'from_department_id',
                $user->department_id
            )
            /*
            |--------------------------------------------------------------------------
            | Only forwarded routes
            |--------------------------------------------------------------------------
            */
            ->where(
                'action',
                'Forwarded'
            );
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */
        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->whereHas('procurement', function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where(
                        'pr_no',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'project_title',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'end_user',
                        'like',
                        "%{$search}%"
                    );
                });
            });
        }
        /*
        |--------------------------------------------------------------------------
        | Stage
        |--------------------------------------------------------------------------
        */
        if (
            $request->filled('status') &&
            $request->status !== 'all'
        ) {
            $query->where(
                'stage',
                $request->status
            );
        }
        /*
        |--------------------------------------------------------------------------
        | Destination Department
        |--------------------------------------------------------------------------
        */
        if ($request->filled('department')) {
            $query->where(
                'to_department_id',
                $request->department
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
        $outgoingPRs = $query
            ->orderByDesc('forwarded_at')
            ->paginate(10)
            ->withQueryString();

        /*
        |--------------------------------------------------------------------------
        | Departments for Filter
        |--------------------------------------------------------------------------
        */
        $departments = \App\Models\Department::query()
            ->orderBy('name')
            ->pluck('name', 'id');
        return Inertia::render('Outgoing/Index', [
            'outgoingPRs' => $outgoingPRs,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'department' => $request->department ?? '',
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
            ],
            'departments' => $departments,
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
