<?php

use App\Http\Controllers\StockGroupController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PersonalController;
use App\Http\Controllers\QuickOrderController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TableGroupController;
use App\Http\Middleware\CheckTokenExpiration;
use App\Http\Controllers\RawMaterialController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\StockSetController;

use App\Http\Controllers\TimePresetController;
use App\Http\Controllers\TableTimeSessionController;
use App\Http\Controllers\TimeChargeController;
use App\Http\Controllers\RestaurantSecuritySettingController;

use App\Models\Table;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::post('login', [AuthController::class, 'login']);



Route::middleware('auth:sanctum')->group(function () {
// Route::middleware(['auth:sanctum', CheckTokenExpiration::class])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
        return response()->json($request->user()->load('roles', 'permissions'));
    });

    // Super-admin routes
    Route::middleware('role:super-admin')->group(function () {
        Route::apiResource('users', UserController::class);
        // Route::apiResource('restaurants', RestaurantController::class);
        Route::apiResource('admin-restaurants', SuperAdminController::class);
    });

    Route::middleware('has.restaurant')->group(function () {
        // Admin routes
        Route::middleware('role:admin')->group(function () {
            // Route::post('users/{user}/make-inactive', [UserController::class, 'makeInactive']);
            // Route::post('users/{user}/change-password', [UserController::class, 'changePassword']);
            // Route::apiResource('users', UserController::class)->except(['store', 'update', 'destroy']);
            Route::apiResource('personal', PersonalController::class);
        });

        // // User routes
        // Route::middleware('permission:manage-users')->group(function () {
        //     Route::post('users/{user}/make-inactive', [UserController::class, 'makeInactive']);
        //     Route::post('users/{user}/change-password', [UserController::class, 'changePassword']);
        //     Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
        // });


        // Ps club saat

        Route::apiResource('time-presets', TimePresetController::class)
            ->only(['index','store','update','destroy']);

        Route::prefix('tables-time/{table}')->group(function () {
            Route::get ('status',           [TableTimeSessionController::class,'status'])->name('tables.time.status');
            Route::post('start-per-minute', [TableTimeSessionController::class,'startPerMinute'])->name('tables.time.startPerMinute');
            Route::post('start-preset',     [TableTimeSessionController::class,'startPreset'])->name('tables.time.startPreset');
            Route::post('pause',            [TableTimeSessionController::class,'pause'])->name('tables.time.pause');
            Route::post('extend',           [TableTimeSessionController::class,'extend'])->name('tables.time.extend'); // ✅ YENİ
            Route::post('resume',           [TableTimeSessionController::class,'resume'])->name('tables.time.resume');
            Route::post('finish',           [TableTimeSessionController::class,'finish'])->name('tables.time.finish');
        });

        Route::get('/time-sessions',        [TableTimeSessionController::class,'index'])->name('timeSessions.index');
        Route::get('/time-sessions/{id}',   [TableTimeSessionController::class,'show'])->name('timeSessions.show');

        Route::get('/orders/{order}/time-charges', [TableTimeSessionController::class,'orderCharges'])
            ->name('orders.timeCharges.index');



        // Manage restoran settings
        Route::get('own-restaurants', [RestaurantController::class, 'getOwnRestaurant']);

        Route::get('restaurant/security-settings', [RestaurantSecuritySettingController::class, 'index']);
        Route::post('restaurant/security-settings/verify', [RestaurantSecuritySettingController::class, 'verify'])
            ->middleware('throttle:40,1');

        Route::middleware('permission:manage-restaurants')->group(function () {
            Route::put('own-restaurants', [RestaurantController::class, 'updateOwnRestaurant']);
            Route::get('restaurant/print-mode', [RestaurantController::class, 'getPrintMode']);
            Route::put('restaurant/security-settings', [RestaurantSecuritySettingController::class, 'update']);
        });

        Route::middleware('permission:manage-tanimlar')->group(function () {
            Route::apiResource('stock-groups', StockGroupController::class);
            Route::apiResource('stocks', StockController::class);
            Route::get('stock-refresh',[StockController::class,'stockFresh']);
            Route::apiResource('couriers', CourierController::class);
            Route::apiResource('table-groups', TableGroupController::class);
            Route::apiResource('tables', TableController::class);
        });
        
        Route::get('stock-all', [StockController::class, 'simpleList']);

        Route::middleware('permission:access-payments')->group(function () {
            Route::get('payments', [PaymentController::class, 'index']);
            Route::put('restaurant/times', [RestaurantController::class, 'updateTimes']);
            Route::middleware('permission:manage-payments')->group(function () {
                Route::delete('order/{orderId}/payments', [PaymentController::class, 'destroyByOrderId']);
            });
        });


        Route::apiResource('stock-sets', StockSetController::class);


        // Manage customers
        Route::middleware('permission:manage-customers')->group(function () {
            Route::apiResource('customers', CustomerController::class);
            Route::post('customers/{id}/transaction', [CustomerController::class, 'storeTransaction']);
            Route::put('customers/transaction/{id}', [CustomerController::class, 'updateTransaction']);
            Route::delete('customers/transaction/{id}', [CustomerController::class, 'destroyTransaction']);
        });

        Route::apiResource('stock-groups', StockGroupController::class)->only('index');
        Route::apiResource('stocks', StockController::class)->only('index');
        Route::apiResource('couriers', CourierController::class)->only('index');
        Route::apiResource('table-groups', TableGroupController::class)->only('index');
        Route::apiResource('tables', TableController::class)->only('index');
        Route::apiResource('customers', CustomerController::class)->only('index');


        // Manage stock groups
        // Route::middleware('permission:manage-stock-groups')->group(function () {
        //     Route::apiResource('stock-groups', StockGroupController::class);
        // });

        // Manage stocks
        // Route::middleware('permission:manage-stocks')->group(function () {
        //     Route::apiResource('stocks', StockController::class);
        // });

        // Manage couriers
        // Route::middleware('permission:manage-couriers')->group(function () {
        //     Route::apiResource('couriers', CourierController::class);
        // });

        // Manage table groups
        // Route::middleware('permission:manage-table-groups')->group(function () {
        //     Route::apiResource('table-groups', TableGroupController::class);
        // });




        Route::middleware('permission:manage-tables')->group(function () {
            Route::post('/tables', [TableController::class, 'store']);
            Route::put('/tables/{id}', [TableController::class, 'update']);
            Route::delete('/tables/{id}', [TableController::class, 'destroy']);
            Route::post('tables/{id}/change-table', [TableController::class, 'changeTables']);
            Route::post('tables/{id}/merge-table', [TableController::class, 'mergeTables']);
            Route::post('tables/{id}/add-stock', [TableController::class, 'addStockToOrder']);
            Route::post('tables/{id}/subtract-stock', [TableController::class, 'subtractStockFromOrder']);
            Route::delete('tables/{id}/cancel-order', [TableController::class, 'cancelOrder']);
            // Route::post('order/{id}/prepayments', [OrderController::class, 'storePrepayments']);
            // Route::delete('order/{orderId}/prepayments/{prepaymentId}', [OrderController::class, 'destroyPrepayment']);
            // Route::post('order/{id}/payments', [PaymentController::class, 'store']);
            Route::post('qr/generate/{id}', [TableController::class, 'generateQrCode']);
            Route::delete('qr/orders/{tableOrderId}', [TableController::class, 'cancelPendingOrder']);
            Route::post('qr/orders/{tableOrderId}/approve', [TableController::class, 'approvePendingOrder']);
        });


        Route::get('table-groups', [TableGroupController::class, 'index']);

        Route::get('/tables', [TableController::class, 'index']);
        Route::get('/tables/{id}', [TableController::class, 'show']);
        Route::get('/tables/{id}/order', [TableController::class, 'getTableWithApprovedOrders']);


        //burda mehsul masaya elave olunur ve masadan silinir
        Route::middleware('permission:table-order,manage-tables')->group(function () {
            Route::post('tables/{id}/subtract-stock', [TableController::class, 'subtractStockFromOrder']);
            Route::post('tables/{id}/add-stock', [TableController::class, 'addStockToOrder']);
        });

        // Manage quick orders
        
        Route::middleware('permission:manage-quick-orders')->group(function () {

            Route::apiResource('quick-orders', QuickOrderController::class);
            Route::post('quick-orders/{id}/add-stock', [QuickOrderController::class, 'addStock']);
//            Route::post('quick-orders/{id}/subtract-stock', [QuickOrderController::class, 'subtractStock']);
        });

        Route::middleware('permission:manage-quick-orders,manage-tables')->group(function () {
            Route::post('order/{id}/prepayments', [OrderController::class, 'storePrepayments']);
            Route::delete('order/{orderId}/prepayments/{prepaymentId}', [OrderController::class, 'destroyPrepayment']);
            Route::post('order/{id}/payments', [PaymentController::class, 'store']);
        });

        // Manage orders
        Route::get('order/{id}/prepayments', [OrderController::class, 'getPrepayments']);


        Route::get('qr/{id}', [TableController::class, 'getQrCode']);

        Route::get('qr/orders/all', [TableController::class, 'getPendingApprovalOrders']);
    });

    //Xammal
Route::apiResource('raw-materials', RawMaterialController::class);
Route::post('/stocks/{stock}/attach-raw-material', [RawMaterialController::class, 'attachRawMaterials']);
Route::get('stocks/{stock}/raw-materials', [RawMaterialController::class, 'getRawMaterials']);
Route::put('stocks/{stock}/raw-materials', [RawMaterialController::class, 'updateMultipleRawMaterials']);


Route::post('/raw-materials/{id}/increase', [RawMaterialController::class, 'increaseStock']);
Route::post('/raw-materials/{id}/decrease', [RawMaterialController::class, 'decreaseStock']);
Route::get('/raw-materials/{id}/logs', [RawMaterialController::class, 'getStockLogs']);

// Xercler 

Route::prefix('expense-categories')->group(function () {
    Route::post('/', [ExpenseController::class, 'createCategory']);
    Route::get('/', [ExpenseController::class, 'listCategories']);
    Route::post('/{category}/expenses', [ExpenseController::class, 'addExpense']);
    Route::get('/{category}/expenses', [ExpenseController::class, 'listExpenses']);
    Route::delete('/{category}', [ExpenseController::class, 'deleteCategory']);
});


});

Route::get('qr/{id}/table', [TableController::class, 'getTableByQrCode']);
Route::get('qr/{id}/menu', [TableController::class, 'getQrMenu']);
Route::post('qr/{id}/order', [TableController::class, 'createQrOrder']);

