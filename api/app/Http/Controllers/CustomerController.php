<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Http\Requests\CustomerRequest;
use App\Http\Requests\StoreCustomerTransactionRequest;
use App\Models\CustomerTransaction;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        //
        $customers = Customer::where('restaurant_id', $request->user()->restaurant_id)->get();

        return response()->json($customers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CustomerRequest $request)
    {
        //

        $data = $request->validated();
        $data['restaurant_id'] = $request->user()->restaurant_id;
        $customer = Customer::create($data);
        return response()->json($customer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        $customer = Customer::where('restaurant_id', request()->user()->restaurant_id)->findOrFail($id);

        $customer->load('customer_transactions');
        return response()->json($customer);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CustomerRequest $request, string $id)
    {
        //
        $customer = Customer::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($id);

        $data = $request->validated();
        $customer->update($data);

        return response()->json($customer);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $customer = Customer::where('restaurant_id', request()->user()->restaurant_id)->findOrFail($id);
        $customer->delete();

        return response()->json(null, 204);
    }

    public function storeTransaction(StoreCustomerTransactionRequest $request, $customer_id)
    {
        // Begin a database transaction
        DB::beginTransaction();

        try {

            // Get the customer
            $customer = Customer::where('restaurant_id', request()->user()->restaurant_id)->find($customer_id);

            if (!$customer) {
                return response()->json(['message' => 'Customer not found.'], 404);
            }

            $data = $request->validated();
            $data['customer_id'] = $customer->id;
            // Create the transaction
            $transaction = CustomerTransaction::create($data);

            // Update customer money based on the transaction type
            if ($transaction->type === 'credit') {
                $customer->money += $transaction->amount;
            } elseif ($transaction->type === 'debit') {
                $customer->money -= $transaction->amount;
            }


            $customer->save();

            // Commit the transaction
            DB::commit();

            return response()->json($transaction, 201);
        } catch (\Exception $e) {
            // Rollback the transaction if something goes wrong
            DB::rollBack();
            return response()->json(['message' => 'Error processing transaction.'], 500);
        }
    }

    public function updateTransaction(StoreCustomerTransactionRequest $request, $id)
    {
        // Start a database transaction
        DB::beginTransaction();

        try {
            $transaction = CustomerTransaction::find($id);

            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found.'], 404);
            }

            $customer = Customer::where('restaurant_id', request()->user()->restaurant_id)->find($transaction->customer_id);

            if (!$customer) {
                return response()->json(['message' => 'Customer not found.'], 404);
            }
            // Remove the old transaction effect
            if ($transaction->type === 'credit') {
                $customer->money -= $transaction->amount;
            } elseif ($transaction->type === 'debit') {
                $customer->money += $transaction->amount;
            }

            // Update the transaction
            $transaction->update($request->validated());

            // Apply the new transaction effect
            if ($transaction->type === 'credit') {
                $customer->money += $transaction->amount;
            } elseif ($transaction->type === 'debit') {
                $customer->money -= $transaction->amount;
            }


            $customer->save();

            // Commit the transaction
            DB::commit();

            return response()->json($transaction);
        } catch (\Exception $e) {
            // Rollback if something goes wrong
            DB::rollBack();
            return response()->json(['message' => 'Error updating transaction.'], 500);
        }
    }

    public function destroyTransaction($id)
    {
        // Start a database transaction
        DB::beginTransaction();

        try {
            $transaction = CustomerTransaction::find($id);

            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found.'], 404);
            }
            
            $customer = Customer::where('restaurant_id', request()->user()->restaurant_id)->find($transaction->customer_id);

            if (!$customer) {
                return response()->json(['message' => 'Customer not found.'], 404);
            }

            // Revert the transaction effect
            if ($transaction->type === 'credit') {
                $customer->money -= $transaction->amount;
            } elseif ($transaction->type === 'debit') {
                $customer->money += $transaction->amount;
            }

            $customer->save();

            // Delete the transaction
            $transaction->delete();

            // Commit the transaction
            DB::commit();

            return response()->json(['message' => 'Transaction deleted successfully']);
        } catch (\Exception $e) {
            // Rollback if something goes wrong
            DB::rollBack();
            return response()->json(['message' => 'Error deleting transaction.'], 500);
        }
    }
}
