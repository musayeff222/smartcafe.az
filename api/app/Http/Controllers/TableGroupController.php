<?php

namespace App\Http\Controllers;

use App\Http\Requests\TableGroupRequest;
use App\Models\TableGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class TableGroupController extends Controller
{
    public function index()
    {
        $tableGroups = TableGroup::where('restaurant_id', Auth::user()->restaurant_id)->get();
        return response()->json($tableGroups);
    }

    public function store(TableGroupRequest $request)
    {
        $data = $request->validated();
        $data['restaurant_id'] = Auth::user()->restaurant_id;

        $tableGroup = TableGroup::create($data);

        return response()->json($tableGroup, 201);
    }

    public function show($id)
    {
        $tableGroup = TableGroup::where('restaurant_id', Auth::user()->restaurant_id)->findOrFail($id);

        return response()->json($tableGroup);
    }

    public function update(TableGroupRequest $request, $id)
    {
        $tableGroup = TableGroup::findOrFail($id);

        if ($tableGroup->restaurant_id != Auth::user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tableGroup->update($request->validated());

        return response()->json($tableGroup);
    }

    public function destroy($id)
    {
        $tableGroup = TableGroup::findOrFail($id);

        if ($tableGroup->restaurant_id != Auth::user()->restaurant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tableGroup->delete();

        return response()->json(['message' => 'Table Group deleted successfully']);
    }
}
