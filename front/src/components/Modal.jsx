

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MasaModalMain from './MasaModalMain';
import HesapKes from './HesapKes';
import MasaDegistir from './MasaDegistir';
import MasaBirlesdir from './MasaBirlesdir';
import QrMenuKod from './QrMenuKod';
import OncedenOde from './OncedenOde';
import { base_url } from '../api/index';
import { fetchTableOrderStocks } from '../redux/stocksSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';


const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function Modal({ tableItemData, groups, type, setShowDetail, _modalMain }) {
    console.log("tableItemData",tableItemData.id);
    
    const [modalMain, setModalMain] = useState(_modalMain);
    const [ordersId, setOrdersId] = useState({});
    const [refreshFetch, setRefreshFetch] = useState(false);
    const { id } = useParams();
    const dispatch = useDispatch();

    console.log("id",id);
    

    const { allItems, orders, loading, error } = useSelector((state) => state.stocks);

    useEffect(() => {
        dispatch(fetchTableOrderStocks(tableItemData.id));
      }, [id, dispatch]);
    
    console.log("ordersModal2",orders);
    
    
    

    const qalig = ordersId.total_price - ordersId.total_prepayment;
    const fetchTableOrders = async () => {
        try {
            const response = await axios.get(`${base_url}/tables/${tableItemData.id}/order`, getHeaders());
            setOrdersId({
                id: response.data.table.orders[0].order_id,
                total_price: response.data.table.orders[0].total_price,
                total_prepayment: response.data.table.orders[0].total_prepayment
            });
            setRefreshFetch(false);
        } catch (error) {
            console.error('Error fetching table orders:', error);
        }
    };

    useEffect(() => {
        fetchTableOrders();
    }, [tableItemData.id, refreshFetch]);
   

 
    


if (orders && orders.length > 0) {
    console.log("orders2", orders[0].order_id);
  } else {
    console.log("orders2: Order verisi henüz gelmedi veya boş.");
  }

    return (
        <div className="max-w-mobile fixed inset-0 bg-[#444444e6] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 py-3 px-4 border-b">
                    <h4 className="text-lg font-semibold">{tableItemData.name}</h4>
                    <button
                        className="py-2 px-3 bg-black text-white rounded-lg focus:outline-none"
                        onClick={() => setShowDetail(null)}
                    >
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-150px)] p-4">
                    {modalMain === "main" && <MasaModalMain type={type} tableItemData={tableItemData} setModalMain={setModalMain} groups={groups} />}
                    {modalMain === "hesapKes" && <HesapKes orderId={ordersId} totalAmount={qalig} />}
                    {modalMain === "masaDegistir" && <MasaDegistir tableItemData={tableItemData} />}
                    {modalMain === "masaBirlesdir" && <MasaBirlesdir tableItemData={tableItemData} />}
                    {modalMain === "OncedenOde" && <OncedenOde odersId={ordersId} setRefreshFetch={setRefreshFetch} />}
                    {modalMain === "qrMenuKod" && <QrMenuKod tableId={tableItemData.id} />}
                </div>
            </div>
        </div>
    );
}

export default Modal;
