import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import SelectCourierModal from "../components/SelectCourierModal";
import AddOrderModal from "../components/AddOrderModal";
// import HesapKes from "../components/HesapKes";
import AccessDenied from "../components/AccessDenied";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import DontActiveAcount from "../components/DontActiveAcount";
import HesapKesSip from "../components/HesapKesSip";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function Siparisler() {
  const [orders, setOrders] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [showSelectCourier, setShowSelectCourier] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  console.log("selectedCourier",selectedCourier);
  
  const [odersIdMassa, setodersIdMassa] = useState({});
  const [couriers] = useState([]);
  const [DataItemOrder, setDataItemOrder] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  const kalan = odersIdMassa.total_price - odersIdMassa.total_prepayment;
  const [orderPrices, setOrderPrices] = useState({});

  console.log("orders", orders);
console.log("orderPrices",orderPrices);

const fetchCustomerInfo = async (idCustom) => {
  try {
    const response = await axios.get(
      `${base_url}/quick-orders/${idCustom}`,
      getHeaders()
    );
    return { 
      total_price: response.data.order.total_price,
      total_prepayment: response.data.order.total_prepayment
    };
  } catch (error) {
    console.error(`Error fetching customer info for ID: ${idCustom}`, error);
    return { total_price: 0, total_prepayment: 0 };
  }
}

useEffect(() => {
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${base_url}/quick-orders`, getHeaders());
      const ordersData = response.data;
      setOrders(ordersData);

      const prices = {};
      for (const order of ordersData) {
        const details = await fetchCustomerInfo(order.id);
        prices[order.id] = details;
      }
      setOrderPrices(prices);
    } catch (error) {
      // Hata yönetimi aynı kalacak
    }
  };

  fetchOrders();
}, []);



const createObjHesabKes = (id) => {
  const orderDetail = orderPrices[id] || { 
    total_price: 0, 
    total_prepayment: 0 
  };
  
  setodersIdMassa({
    id: id,
    total_price: orderDetail.total_price,
    total_prepayment: orderDetail.total_prepayment,
  });
  setShowDetail(true);
};



  const updateCustomerInfo = async (order, customerId) => {
    try {
      await axios.put(
        `${base_url}/quick-orders/${order.id}`,
        {
          name: order.name,
          phone: order.phone,
          address: order.address,
          courier_id: customerId,
        },
        getHeaders()
      );
      window.location.reload();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error updating customer info:", error);
      }
    }
  };

  const handleSelectCourier = (courier) => {
    setSelectedCourier(courier);
    setShowSelectCourier(false);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`${base_url}/quick-orders/${orderId}`, getHeaders());
      setOrders(orders.filter((order) => order.id !== orderId));
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error deleting order:", error);
      }
    }
  };
  if (ActiveUser) return <DontActiveAcount onClose={setActiveUser} />;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;
  return (
    <>
      <Helmet>
        <title>Sifarişlər | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <section className="p-4">
        <div className="rounded border">
          <div className="p-3 border-b bg-[#fafbfc] flex flex-col md:flex-row items-start md:items-center justify-between">
            <h3 className="font-semibold text-lg mb-2 md:mb-0">Siparişler</h3>
            <button
              onClick={() => setShowAddOrder(true)}
              className="btn-ad flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              <i className="fa-solid fa-plus"></i> Yeni sipariş əlavə edin
            </button>
          </div>
          <div className="w-full p-3 bg-white">
            <p className="mb-3 text-sm">
              Siyahida toplam {orders.length} qeyd vardir.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left border rounded bg-[#fafbfc]">
                <thead className="border-b border-gray-400 bg-gray-100">
                  <tr className="border-b border-gray-300">
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Ad Soyad
                    </th>
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Saat
                    </th>
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base text-right">
                      Toplam
                    </th>
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Telefon
                    </th>
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Adres
                    </th>
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Kurye
                    </th>
                    {!odersIdMassa.total_price && (
                      <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                        Hesap Kes
                      </th>
                    )}
                    <th className="p-2 sm:p-3 font-semibold text-xs sm:text-base">
                      Sil
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-100">
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <Link to={`/muster-siparis-ekle/${order.id}`}>
                          {order.name}
                        </Link>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <Link to={`/muster-siparis-ekle/${order.id}`}>
                          {new Date(order.created_at).toLocaleString()}
                        </Link>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-right">
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-right">
  <Link to={`/muster-siparis-ekle/${order.id}`}>
    ₼ {orderPrices[order.id]?.total_price ?? 0}
  </Link>
</td>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <Link to={`/muster-siparis-ekle/${order.id}`}>
                          {order.phone}
                        </Link>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <Link to={`/muster-siparis-ekle/${order.id}`}>
                          {order.address}
                        </Link>
                      </td>
                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-center">
                        {order.courier ? (
                          <span
                            className="border rounded py-1 px-2 bg-white cursor-pointer"
                            onClick={() => (
                              setShowSelectCourier(true),
                              setDataItemOrder(order)
                            )}
                          >
                            {order.courier.name}
                          </span>
                        ) : (
                          <button
                            onClick={() => (
                              setShowSelectCourier(true),
                              setDataItemOrder(order)
                            )}
                            className="border rounded py-1 px-2 bg-white"
                          >
                            <i className="fa-solid fa-motorcycle"></i>
                          </button>
                        )}
                      </td>
                      {order.order.total_price ? (
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                <button
  onClick={() => createObjHesabKes(order.id)}
  className="rounded px-3 py-1 bg-cyan-500 text-white"
>
  Hesap Kes
</button>
                        </td>
                      ) : (
                        <td className="p-2 sm:p-3 text-xs sm:text-sm">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="rounded px-3 bg-slate-900 py-1 text-white"
                          >
                            <i className="fa-regular fa-circle-xmark"></i>
                          </button>
                        </td>
                      )}
                      <td className="p-2 sm:p-3 text-xs sm:text-sm">
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="rounded px-3 py-1 bg-red-500 text-white"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {showSelectCourier && (
        <SelectCourierModal
          updateCustomerInfo={updateCustomerInfo}
          DataItemOrder={DataItemOrder}
          couriers={couriers}
          onSelect={handleSelectCourier}
          onClose={() => setShowSelectCourier(false)}
        />
      )}

      {showAddOrder && (
        <AddOrderModal
          onClose={() => setShowAddOrder(false)}
          onSuccess={() => {
            setShowAddOrder(false);
          }}
        />
      )}
      {showDetail && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
            <div className="bg-gray-200 p-4 flex justify-between items-center border-b">
              <h3 className="text-xl font-semibold text-gray-800"></h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
            <HesapKesSip 
  orderId={odersIdMassa.id}
  totalAmount={kalan}
/>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Siparisler;
