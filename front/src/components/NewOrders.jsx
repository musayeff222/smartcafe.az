import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { base_url, img_url } from '../api/index';
import soundFile from '../assets/sound.mp3';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewOrders = () => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [hasNewOrders, setHasNewOrders] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const audioRef = useRef(null);
    const audioIntervalRef = useRef(null);


    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await axios.get(`${base_url}/qr/orders/all`, getAuthHeaders());
                setTables(response.data.tables || []);
                  console.log("responsetables",response);
                // Check if there are any orders across all tables
                const hasOrders = response.data.tables.some(table => 
                    table.table_orders && table.table_orders.length > 0
                );
                
                setHasNewOrders(hasOrders);
            } catch (error) {
                console.error('Error fetching tables', error);
            }
        };

        fetchTables();
        const interval = setInterval(fetchTables, 15000);
        return () => clearInterval(interval);
    }, []);

    // Sound notification for new orders
    useEffect(() => {
        if (hasNewOrders) {
            toast.info('Yeni sifarişiniz var', {
                position: toast.POSITION?.TOP_RIGHT || 'top-right',
                autoClose: 5000,
            });

            if (audioRef.current) {
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(error => {
                        console.error('Error playing audio:', error);
                    });
                }
                audioIntervalRef.current = setInterval(() => {
                    audioRef.current.play().catch(error => {
                        console.error('Error playing audio:', error);
                    });
                }, 2000);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            if (audioIntervalRef.current) {
                clearInterval(audioIntervalRef.current);
                audioIntervalRef.current = null;
            }
        }

        return () => {
            if (audioIntervalRef.current) {
                clearInterval(audioIntervalRef.current);
            }
        };
    }, [hasNewOrders]);


    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTable(null);
    };

    const handleTableClick = (tableId) => {
        setSelectedTable(tableId);
    };

    const handleOrderAction = async (tableOrderId, action, detailId,tableOrder) => {
        try {
            if (action === 'accept') {
                await axios.post(`${base_url}/qr/orders/${tableOrderId}/approve`, {
                    detailId,
                    price: tableOrder.order.stocks[0]?.price, // fiyat bilgisini de gönder
                }, getAuthHeaders());
                
            } else if (action === 'reject') {
                await axios.delete(`${base_url}/qr/orders/${tableOrderId}`, getAuthHeaders());
            }
            
            // Update tables data after successful action
            const updatedTables = [...tables];
            
            // Find the table that contains this order
            const tableIndex = updatedTables.findIndex(table => 
                table.table_orders.some(order => order.id === tableOrderId)
            );
            
            if (tableIndex !== -1) {
                // Remove the processed order from the table
                updatedTables[tableIndex].table_orders = updatedTables[tableIndex].table_orders
                    .filter(order => order.id !== tableOrderId);
                
                // If this table has no more orders, consider deselecting it
                if (updatedTables[tableIndex].table_orders.length === 0 && 
                    updatedTables[tableIndex].id === selectedTable) {
                    setSelectedTable(null);
                }
                
                setTables(updatedTables);
                
                // Check if any tables still have orders
                const stillHasOrders = updatedTables.some(table => 
                    table.table_orders && table.table_orders.length > 0
                );
                
                if (!stillHasOrders) {
                    setHasNewOrders(false);
                    setIsModalOpen(false);
                }
            }
        } catch (error) {
            console.error(`Error handling order action ${action}`, error);
        }
    };

      const getOrderItems = (order) => {
        const items = [];
        
      
        if (order.stocks && order.stocks.length > 0) {
            order.stocks.forEach(stock => {
                items.push({
                    ...stock,
                    type: 'stock',
                    pivot: stock.pivot
                });
            });
        }
        
    
        if (order.stock_sets && order.stock_sets.length > 0) {
            order.stock_sets.forEach(set => {
                items.push({
                    ...set,
                    type: 'set',
                    pivot: set.pivot
                });
            });
        }
        
        return items;
    };

    // Get total order count across all tables
    const totalOrderCount = tables.reduce((count, table) => 
        count + (table.table_orders ? table.table_orders.length : 0), 0
    );

    return (
        <>
            {hasNewOrders && (
                <button
                    onClick={handleOpenModal}
                    className="py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-300 bg-red-500 text-white animate-pulse"
                >
                    Yeni sifarisiniz var ({totalOrderCount})
                </button>
            )}

            {isModalOpen && (
                <div className="fixed max-w-mobile inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="relative bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full h-[80vh] overflow-y-auto">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-4">Masalar və Sifarişlər</h2>
                        
                        {/* If no table is selected, show table list */}
                        {!selectedTable && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {tables.filter(table => table.table_orders && table.table_orders.length > 0)
                                    .map(table => (
                                    <div 
                                        key={table.id}
                                        onClick={() => handleTableClick(table.id)}
                                        className="border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center bg-white shadow-sm hover:bg-blue-50 cursor-pointer h-24"
                                    >
                                        <h3 className="text-xl font-semibold">{table.name}</h3>
                                        <p className="mt-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                                            {table.table_orders.length} sifariş
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* If a table is selected, show its orders */}
                     {selectedTable && (
                <div>
                    {/* ... (mevcut kodlar) */}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {tables.find(t => t.id === selectedTable)?.table_orders.map(tableOrder => {
                            const orderItems = getOrderItems(tableOrder.order);
                            
                            return (
                                <div key={tableOrder.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center bg-white shadow-sm">
                                    <div className="w-full">
                                        {orderItems.map((item, index) => (
                                            <div key={`${item.id}-${index}`} className="mb-4 last:mb-0">
                                                {item.image && (
                                                    <img
                                                        src={`${img_url}/${item.image}`}
                                                        alt={item.name}
                                                        className="my-2 max-w-full h-auto rounded-md mx-auto"
                                                    />
                                                )}
                                                <p className="text-lg font-medium mb-1 text-center">
                                                    {item.name} ({item.type === 'set' ? 'Set' : 'Məhsul'})
                                                </p>
                                                <p className="text-gray-600 text-center">
                                                    Miqdar: {item.pivot.quantity}
                                                </p>
                                                <p className="text-gray-600 text-center">
                                                    Qiymət: {item.type === 'set' ? item.unit_price : item.price} ₼
                                                </p>
                                                <p className="text-gray-600 text-center">
                                                    Toplam: {(
                                                        Number(item.pivot.quantity) * 
                                                        Number(item.type === 'set' ? item.unit_price : item.price)
                                                    ).toFixed(2)} ₼
                                                </p>
                                                {item.detail?.unit && (
                                                    <p className="text-gray-600 text-center">
                                                        Detalı: {item.detail.unit}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-4 flex space-x-4">
                                        <button
                                            onClick={() => handleOrderAction(tableOrder.id, 'accept', null, tableOrder)}
                                            className="bg-green-500 text-white py-1 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                                        >
                                            Təsdiq edin
                                        </button>
                                        <button
                                            onClick={() => handleOrderAction(tableOrder.id, 'reject')}
                                            className="bg-red-500 text-white py-1 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                                        >
                                            Ləğv edin
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
                    </div>
                </div>
            )}

            <audio ref={audioRef} src={soundFile} preload="auto" loop />
        </>
    );
};



const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };
};

export default NewOrders;












    // const handleOrderAction = async (orderId, action) => {
    //     try {
    //         if (action === 'accept') {
    //             await axios.post(`${base_url}/qr/orders/${orderId}/approve`, {}, getAuthHeaders());
    //         } else if (action === 'reject') {
    //             await axios.delete(`${base_url}/qr/orders/${orderId}`, getAuthHeaders());
    //         }

    //         // Remove the processed order from the state
    //         setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    //     } catch (error) {
    //         console.error(`Error handling order action ${action}`, error);
    //     }
    // };












// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { base_url, img_url } from '../api/index';
// import soundFile from '../assets/sound.mp3';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const NewOrders = () => {
//     const [orders, setOrders] = useState([]);
//     const [OrdersAllData, setOrdersAllData] = useState([]);
//     const [hasNewOrders, setHasNewOrders] = useState(false);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const audioRef = useRef(null);
//     const audioIntervalRef = useRef(null);

//     console.log("orders",orders);
//     console.log("OrdersAllData",OrdersAllData);

//     useEffect(() => {
//         const fetchOrders = async () => {
//             try {
//                 const response = await axios.get(`${base_url}/qr/orders/all`, getAuthHeaders());
//                 const fetchedOrders = response.data.tables.flatMap(table =>
//                     table.orders.map(order => ({
//                         ...order,
//                         tableName: table.name
//                     }))
//                 );
// const orderalldata = response.data.tables;
// setOrdersAllData(orderalldata)
//                 console.log("fetchedOrders",fetchedOrders);
                
//                 setOrders(fetchedOrders);
//             } catch (error) {
//                 console.error('Error fetching orders', error);
//             }
//         };

//         fetchOrders();
//         const interval = setInterval(fetchOrders, 15000);
//         return () => clearInterval(interval);
//     }, []);

//     // Update `hasNewOrders` whenever `orders` changes
//     useEffect(() => {
//         setHasNewOrders(orders.length > 0);

//         if (orders.length === 0 && isModalOpen) {
//             setIsModalOpen(false); // Automatically close the modal if no orders remain
//         }
//     }, [orders, isModalOpen]);

//     useEffect(() => {
//         if (hasNewOrders) {
//             toast.info('Yeni sifarişiniz var', {
//                 position: toast.POSITION?.TOP_RIGHT || 'top-right',
//                 autoClose: 5000,
//             });

//             if (audioRef.current) {
//                 if (audioRef.current.paused) {
//                     audioRef.current.play().catch(error => {
//                         console.error('Error playing audio:', error);
//                     });
//                 }
//                 audioIntervalRef.current = setInterval(() => {
//                     audioRef.current.play().catch(error => {
//                         console.error('Error playing audio:', error);
//                     });
//                 }, 2000);
//             }
//         } else {
//             if (audioRef.current) {
//                 audioRef.current.pause();
//                 audioRef.current.currentTime = 0;
//             }

//             if (audioIntervalRef.current) {
//                 clearInterval(audioIntervalRef.current);
//                 audioIntervalRef.current = null;
//             }
//         }

//         return () => {
//             if (audioIntervalRef.current) {
//                 clearInterval(audioIntervalRef.current);
//             }
//         };
//     }, [hasNewOrders]);

//     const handleButtonClick = () => {
//         setIsModalOpen(true);
//     };

//     const handleCloseModal = () => {
//         setIsModalOpen(false);
//     };

//     // const handleOrderAction = async (orderId, action) => {
//     //     try {
//     //         if (action === 'accept') {
//     //             await axios.post(`${base_url}/qr/orders/${orderId}/approve`, {}, getAuthHeaders());
//     //         } else if (action === 'reject') {
//     //             await axios.delete(`${base_url}/qr/orders/${orderId}`, getAuthHeaders());
//     //         }

//     //         // Remove the processed order from the state
//     //         setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
//     //     } catch (error) {
//     //         console.error(`Error handling order action ${action}`, error);
//     //     }
//     // };


//     const handleOrderAction = async (orderId, action) => {
//         try {
//             console.log(`Handling order action: ${action} for orderId: ${orderId}`);
    
//             let response;
//             if (action === 'accept') {
//                 response = await axios.post(
//                     `${base_url}/qr/orders/${orderId}/approve`, 
//                     {}, 
//                     { ...getAuthHeaders() } // Spread operator ile auth headers ekle
//                 );
//             } else if (action === 'reject') {
//                 response = await axios.delete(
//                     `${base_url}/qr/orders/${orderId}`, 
//                     { ...getAuthHeaders() } // Spread operator ile auth headers ekle
//                 );
//             }
    
//             console.log("API response:", response);
    
//             // İşlem tamamlandıysa sipariş listesini güncelle
//             setOrders(prevOrders => {
//                 const updatedOrders = prevOrders.filter(order => order.id !== orderId);
    
//                 // Eğer sipariş kalmadıysa modalı kapat ve sayfayı yenile
//                 if (updatedOrders.length === 0) {
//                     setIsModalOpen(false);
//                     window.location.reload(); // Sayfayı yenile
//                 }
    
//                 return updatedOrders;
//             });
    
//             toast.success(`Sifariş ${action === 'accept' ? 'qəbul edildi' : 'ləğv edildi'}`);
//         } catch (error) {
//             console.error(`Error handling order action ${action}:`, error);
//             toast.error("Sifariş eməliyyatı baş tutmadı!");
//         }
//     };
    

//     return (
//         <>
//             {hasNewOrders && (
//                 <button
//                     onClick={handleButtonClick}
//                     className="py-2 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-300 bg-red-500 text-white animate-pulse"
//                 >
//                     Yeni sifarisiniz var ({orders.length})
//                 </button>
//             )}

//             {isModalOpen && (
//                 <div className="fixed max-w-mobile inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//                     <div className="relative bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full h-[80vh] overflow-y-auto">
//                         <button
//                             onClick={handleCloseModal}
//                             className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
//                         >
//                             &times;
//                         </button>
//                         <h2 className="text-2xl font-bold mb-4">Yeni sifarislər</h2>
//                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
//                         {orders.map(order => (
//     <div key={order.id} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center bg-white shadow-sm">
//         <h3 className="text-xl font-semibold mb-2">{order.tableName}</h3>
//         {order.stocks[0]?.image && (
//             <img
//                 src={`${img_url}/${order.stocks[0]?.image}`}
//                 alt={order.stocks[0]?.name}
//                 className="my-2 max-w-full h-auto rounded-md"
//             />
//         )}
//         <p className="text-lg font-medium mb-1">{order.stocks[0]?.name}</p>
//         <p className="text-gray-600">Miktar: {order.stocks[0]?.count}</p>
//         <p className="text-gray-600">Toplam: {order.stocks[0]?.count * order.stocks[0]?.price} ₼</p>
//         <div className="mt-4 flex space-x-4">
//             <button
//                 onClick={() => handleOrderAction(order.id, 'accept')}
//                 className="bg-green-500 text-white py-1 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
//             >
//                 Təsdiq edin
//             </button>
//             <button
//                 onClick={() => handleOrderAction(order.id, 'reject')}
//                 className="bg-red-500 text-white py-1 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
//             >
//                 Ləğv edin
//             </button>
//         </div>
//     </div>
// ))}

//                         </div>
//                     </div>
//                 </div>
//             )}

//             <audio ref={audioRef} src={soundFile} preload="auto" loop />
//         </>
//     );
// };




// const getAuthHeaders = () => {
//     const token = localStorage.getItem("token");
//     return {
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//             'Accept': 'application/json',
//         }
//     };
// };

// export default NewOrders;
