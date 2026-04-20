import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import OncedenOde from "../components/OncedenOde";
import AccessDenied from "../components/AccessDenied";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import HesabKesAll from "../components/masasiparis/HesabKesAll";
// Helper function to get headers
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function MusteriSiparisEkle() {
  const { id } = useParams(); // Get the table ID from URL parameters
  const [urunType, setUrunType] = useState(0); // Default to "Hamısı"
  const [stockGroups, setStockGroups] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [tableName, setTableName] = useState(""); // Default table name
  const [totalPrice, setTotalPrice] = useState({}); // Default total price as a number
  const [orderDetails, setOrderDetails] = useState([]); // Details of the table's orders
  const [odersIdMassa, setOrdersIdMassa] = useState({});
  const [refreshFetch, setRefreshFetch] = useState(false);
  const [oncedenodePopop, setOncedenodePopop] = useState(false);
  const [HesabKes, setHesabKes] = useState(false);
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [role, setrole] = useState(localStorage.getItem("role"));
  const fis = localStorage.getItem("fisYazisi");
  const restoranName = localStorage.getItem("restoran_name");
  const [orderModal, setNoOrderModal] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  const [oneProduct, setOneProduct] = useState(0);
  const [modalId, setModalId] = useState(null);
  const [alert, setAlertSuccess]=useState(false)
  const [modalData, setModalData] = useState({
    name: "",
    desc: "",
    price: "",
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  console.log(orderDetails, "orderdetails");
  const [selectedProduct, setSelectedProduct] = useState({
    id: null,
    name: "",
    price: 0,
    quantity: 1,
  });
  // Fetch stock groups from API
  const fetchStockGroups = async () => {
    try {
      const response = await axios.get(
        `${base_url}/stock-groups`,
        getHeaders()
      );
      setStockGroups(response.data);
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
        // setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error loading customers:", error);
      }
    }
  };

  // Fetch stocks from API with optional filter
  const fetchStocks = async (groupId) => {
    try {
      const response = await axios.get(`${base_url}/stocks`, {
        ...getHeaders(),
        params: groupId === 0 ? {} : { stock_group_id: groupId }, // No filter if urunType is 0
      });
      setStocks(response.data);
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
        // setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error loading customers:", error);
      }
    }
  };
  // Fetch table orders
  const fetchTableOrders = async () => {
    try {
      const response = await axios.get(
        `${base_url}/tables/${id}/order`,
        getHeaders()
      );
      const orders = response.data.table.orders;
      setTableName(response.data.table.name);
      setOrdersIdMassa({
        id: response.data.table.orders[0].order_id,
        total_price: response.data.table.orders[0].total_price,
        total_prepayment: response.data.table.orders[0].total_prepayment,
      });
      const formattedOrders = orders.map((order) => ({
        totalPrice: order.total_price,
        total_prepayment: order.total_prepayment,
        items: order.stocks.map((stock) => ({
          id: stock.id,
          name: stock.name,
          quantity: stock.quantity,
          price: stock.price,
          pivot_id: stock.pivot_id,
          unit: stock.detail?.unit,
          count: stock.detail?.count,
          detail_id: stock.detail,
        })),
      }));

      // Flatten items and update state
      const allItems = formattedOrders.flatMap((order) => order.items);
      setOrderDetails(allItems);

      // Calculate total price
      const total = formattedOrders.reduce((acc, order) => order.totalPrice, 0);
      const total_prepare = formattedOrders.reduce(
        (acc, order) => order.total_prepayment,
        0
      );
      const kalanMebleg = total - total_prepare;
      setTotalPrice({
        total: total,
        total_prepare: total_prepare,
        kalan: kalanMebleg,
      });
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
        // setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error loading customers:", error);
      }
    }
  };

  // Delete orders
  const handleDeleteMasa = async () => {
    try {
      await axios.delete(`${base_url}/tables/${id}/cancel-order`, getHeaders());
      setRefreshFetch(!refreshFetch);
      window.location.reload();
      navigate("/masalar");
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
        console.error("Error deleting masa:", error);
      }
    }
  };
  const handleCustomModal = (stockId) => {
    const selectedStock = stocks.find((stock) => stock.id === stockId.id);

    if (selectedStock) {
      if (selectedStock.details && selectedStock.details.length > 0) {
        setSelectedProduct({
          id: null,
          name: "",
          price: 0,
          quantity: 1,
        });
        console.log(selectedStock, "select edes");

        setModalId(selectedStock?.id);
        setModalData({
          name: selectedStock?.name,
          desc: selectedStock?.description,
          price: selectedStock?.price,
        });
        setNoOrderModal(true);
      } else {
        handleAddStock(selectedStock.id);
      }
    } else {
      console.warn("Stock not found for the given ID:", stockId);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({
      ...customerInfo,
      [name]: value,
    });
  };
  const updateCustomerInfo = async () => {
    try {
      await axios.put(
        `${base_url}/quick-orders/${id}`,
        customerInfo,
        getHeaders()
      );
      setAlertSuccess(true);
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

  const closeModal = () => {
    setNoOrderModal(false);
  };
  const replaceImage = (url) => {
    return url ? `${img_url}/${url}` : ""; // Ensure URL is valid
  };

  useEffect(() => {
    const storedUrunType = localStorage.getItem("urunType");
    if (storedUrunType) {
      setUrunType(Number(storedUrunType));
    }
    fetchStockGroups();
    fetchTableOrders();
  }, [id, refreshFetch]);

  useEffect(() => {
    fetchStocks(urunType);
    localStorage.setItem("urunType", urunType);
  }, [urunType]);
  const handleAddStock = async (stockId, selectedProduct = null) => {
    try {
      await axios.post(
        `${base_url}/tables/${id}/add-stock`,
        {
          stock_id: stockId || 1,
          quantity: selectedProduct?.quantity ? selectedProduct.quantity : 1,
          detail_id: selectedProduct?.id || 11,
        },
        getHeaders()
      );
      fetchTableOrders();
      setNoOrderModal(false);
    } catch (error) {
      console.log(error);
      if (error.response.data.error == "Stokda kifayət qədər məhsul yoxdur.") {
        alert(error.response.data.error);
        setNoOrderModal(false);
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any active restaurant."
      ) {
        setActiveUser(true);
      } else if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        console.log(error.response.data.message, "repso");
        setAccessDenied(true);
      } else {
        console.error("Error adding stock to order:", error);
      }
    }
  };

  // Handler to remove stock from the order
  const handleRemoveStock = async (
    stockId,
    pivot_id,
    quantity,
    increase_boolean
  ) => {
    try {
      await axios.post(
        `${base_url}/tables/${id}/subtract-stock`,
        {
          stock_id: stockId,
          quantity: quantity || 1,
          pivotId: pivot_id,
          increase: increase_boolean,
        },
        getHeaders()
      );
      fetchTableOrders();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true);
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error removing stock from order:", error);
      }
    }
  };
  const handlePrint = () => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}`;
    const formattedTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const printContent = `
    <html>
      <head>
        <title>Print Order</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { width: 100%; max-width: 650px; margin: auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .order-list { margin-bottom: 20px; }
          .order-list table { width: 100%; border-collapse: collapse; }
          .order-list table, .order-list th, .order-list td { border: 1px solid black; }
          .order-list th, .order-list td { padding: 8px; text-align: left; }
          .footer { text-align: right; margin-top: 20px; }
          .fis {text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
          <h1>${restoranName}</h1>
            <h1>${tableName}</h1>
            <p>Açılış vaxtı: ${formattedDate} ${formattedTime}</p>
          </div>
          <div class="order-list">
            <table>
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th>Miq</th>
                  <th>Qiy 1(əd)</th>
                  <th>Ümumi Qiymət</th>
                </tr>
              </thead>
              <tbody>
                ${orderDetails
                  ?.map(
                    (item, index) => `
                    <tr key="${item.id}">
                    <td>
                    ${item?.count ? `${item.count} ${item.unit || ""}` : ""} ${
                      item.name
                    }
                  </td>
                  
                      <td>${item.quantity}</td>
                      <td>${(item.price / item.quantity).toFixed(2)} AZN</td>
                      <td>${(
                        item.quantity *
                        (item.price / item.quantity)
                      ).toFixed(2)} AZN</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>Toplam: ${totalPrice?.total} AZN</p>
            ${
              totalPrice?.total_prepare && totalPrice.total_prepare !== 0
                ? `<p>Artıq ödənilib: ${totalPrice.total_prepare} AZN</p>`
                : ""
            }
            <p>Qaliq: ${totalPrice?.kalan} AZN</p>
          </div>
          <div class="fis">
            <strong>${fis}</strong>
          </div>
        </div>
      </body>
    </html>
  `;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <Helmet>
        <title>Masaların sifarişi | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <div className="border rounded bg-[#fafbfc] p-4 mb-5">
          <h2 className="text-lg font-semibold mb-4">Müşteri Bilgileri</h2>
          <div className="flex flex-col mb-4">
            <label className="mb-1 font-medium">Ad Soyad</label>
            <input
              className="border rounded py-2 px-3 outline-none text-sm"
              type="text"
              name="name"
              value={customerInfo.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col mb-4">
            <label className="mb-1 font-medium">Telefon</label>
            <input
              className="border rounded py-2 px-3 outline-none text-sm"
              type="text"
              name="phone"
              value={customerInfo.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col mb-4">
            <label className="mb-1 font-medium">Adres</label>
            <input
              className="border rounded py-2 px-3 outline-none text-sm"
              type="text"
              name="address"
              value={customerInfo.address}
              onChange={handleInputChange}
            />
          </div>
          <button
            onClick={updateCustomerInfo}
            className="bg-sky-600 font-medium py-2 px-4 rounded text-white w-full"
          >
            Güncelle
          </button>
        </div>
      <section className="p-6 flex flex-col md:flex-row gap-6">
     
        <div className="border rounded-lg bg-gray-50 p-4 flex-2">
          <div className="flex items-center justify-between mb-4">
            <Link
              className="bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
              to="/masalar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-chevron-double-left"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                ></path>
                <path
                  fillRule="evenodd"
                  d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                ></path>
              </svg>
              Masalar
            </Link>
            <h2 className="text-xl font-semibold">{tableName}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-md shadow-md table-auto">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="p-3 font-semibold">Sil</th>
                  <th className="p-3 font-semibold">Adı</th>
                  <th className="p-3 font-semibold">Miktar</th>
                  <th className="p-3 font-semibold">Fiyat</th>
                  <th className="p-3 font-semibold">Əsas məhsul</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b ">
                    <td
                      onClick={() =>
                        handleRemoveStock(
                          item.id,
                          item?.pivot_id,
                          item.quantity
                        )
                      }
                      className="p-3 text-red-500 cursor-pointer text-center"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </td>

                    {item?.count ? (
                      <>
                        <td className="p-5">
                          {item.name} <span className="mx-2">{item.unit}</span>{" "}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleRemoveStock(
                                  item.id,
                                  item?.pivot_id,
                                  item.quantity,
                                  true
                                )
                              }
                              className="bg-red-500 text-white py-1 px-2 rounded-l focus:outline-none"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              className="border-t border-b py-1 text-center w-20 text-lg"
                              readOnly
                            />
                            <button
                              onClick={() => {
                                handleAddStock(item.id, item?.detail_id);
                              }}
                              className="bg-green-500 text-white py-1 px-2 rounded-r focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-5">{item.name}</td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleRemoveStock(
                                  item.id,
                                  item?.pivot_id,
                                  item.quantity,
                                  true
                                )
                              }
                              className="bg-red-500 text-white py-1 px-2 rounded-l focus:outline-none"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              className="border-t border-b py-1 text-center w-20 text-lg"
                              readOnly
                            />
                            <button
                              onClick={() => handleAddStock(item.id)}
                              className="bg-green-500 text-white py-1 px-2 rounded-r focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </>
                    )}

                    <td className="p-3 text-right">
                      {Number.isFinite(Number(item.price))
                        ? Number(item.price).toFixed(2)
                        : "0.00"}{" "}
                      ₼
                    </td>

                    <td className="p-3  text-right text-xs font-medium">
                      {item?.count ? "Çoxlu Qiymət" : "Əsas Qiymət"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role !== "waiter" && (
            <div className="flex flex-col gap-4 mt-4">
              {totalPrice.total ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Ön ödeme:</span>
                    <input
                      type="text"
                      value={totalPrice.total_prepare}
                      readOnly
                      className="border rounded-l p-2 text-right w-20"
                    />
                    <button
                      onClick={() => setOncedenodePopop(true)}
                      className="bg-green-500 text-white py-1 px-2 rounded-r focus:outline-none"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Toplam:</span>
                    <div className="flex items-center">
                      <div className="border font-medium py-1 px-2 rounded-l bg-gray-100">
                        ₼
                      </div>
                      <div className="border border-l-0 rounded-r p-2 w-32 text-right bg-gray-100">
                        {totalPrice.total}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">
                      Artıq ödənilib :
                    </span>
                    <div className="flex items-center">
                      <div className="border font-medium py-1 px-2 rounded-l bg-gray-100">
                        ₼
                      </div>
                      <div className="border border-l-0 rounded-r p-2 w-32 text-right bg-gray-100">
                        {totalPrice.total_prepare}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold">Qalıq :</span>
                    <div className="flex items-center">
                      <div className="border font-medium py-1 px-2 rounded-l bg-gray-100">
                        ₼
                      </div>
                      <div className="border border-l-0 rounded-r p-2 w-32 text-right bg-gray-100">
                        {totalPrice.kalan}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                "Sifaris yoxdur"
              )}

              <div className="flex gap-2 mt-4">
                {totalPrice.total && (
                  <>
                    <button
                      onClick={() => setHesabKes(true)}
                      className="bg-green-500 text-white py-2 px-4 rounded flex items-center gap-2"
                    >
                      Hesap kes
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
                    >
                      Qəbz çap edin
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDeleteMasa()}
                  className="bg-gray-800 text-white py-2 px-4 rounded flex items-center gap-2"
                >
                  Ləğv edin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Selection Section */}
        <div className="border rounded-lg bg-gray-50 p-4 flex-1">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setUrunType(0)}
              className={`p-2 btn-filter ${
                urunType === 0
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-200"
              }`}
            >
              Hamısı
            </button>
            {stockGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setUrunType(group.id)}
                className={`p-2 btn-filter ${
                  urunType === group.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-200"
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-white border rounded-lg p-4 shadow-md flex flex-col cursor-pointer"
                onClick={() => handleCustomModal(stock)}
              >
                <div className="w-full h-32 bg-gray-300 mb-2">
                  <img
                    src={replaceImage(stock.image)}
                    alt={stock.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-grow">
                  <span className="block text-lg font-semibold">{` ${stock.price} ₼`}</span>
                  <p className="text-sm text-gray-600 truncate">{stock.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {oncedenodePopop && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
            <div className="bg-gray-200 p-4 flex justify-between items-center border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {tableName}
              </h3>
              <button
                onClick={() => setOncedenodePopop(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <OncedenOde
                odersId={odersIdMassa}
                setrefreshfetch={setRefreshFetch}
              />
            </div>
          </div>
        </div>
      )}
      {orderModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-xl font-semibold mb-4">{modalData?.name}</h3>
            <p className="text-sm font-semibold mb-4">
              Məhsul haqqında:
              <span className="text-xs">{modalData?.desc}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Məhsulun qiymətini və sayını seçin
              </label>
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  const selectedId = e.target.value;

                  const filteredStock = stocks.find(
                    (stock) => stock.id === modalId
                  );

                  if (filteredStock) {
                    const selectedItem = filteredStock.details.find(
                      (item) => item.id === Number(selectedId)
                    );

                    if (selectedItem) {
                      const oneProductCount =
                        selectedItem.price / selectedItem.count;

                      setOneProduct(oneProductCount);
                      setSelectedProduct({
                        id: selectedItem.id,
                        name: selectedItem.name || "",
                        price: selectedItem.price,
                        quantity: 1,
                      });
                    } else {
                      setSelectedProduct({
                        id: null,
                        name: "",
                        price: 0,
                        quantity: 1,
                      });
                    }
                  } else {
                    console.warn(
                      "Stock not found for the given modalId:",
                      modalId
                    );
                  }
                }}
              >
                <option value="">Məhsul əlavə et</option>
                {stocks
                  .filter((stock) => stock.id === modalId)
                  .flatMap((stock) =>
                    stock.details.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.count} {item.unit},{item.price} ₼
                      </option>
                    ))
                  )}
              </select>
            </div>

            <div className="flex items-center  mb-4">
              <button
                onClick={() =>
                  setSelectedProduct((prev) => ({
                    ...prev,
                    quantity: Math.max(1, prev.quantity - 1),
                  }))
                }
                className="border hover:bg-slate-100 rounded-l px-3 py-2 text-lg"
              >
                -
              </button>
              <span className="px-4 text-lg">{selectedProduct?.quantity}</span>
              <button
                onClick={() => {
                  setSelectedProduct((prev) => ({
                    ...prev,
                    quantity: prev.quantity + 1,
                  }));
                  handleAddStock(selectedProduct.id, {
                    ...selectedProduct,
                    quantity: selectedProduct.quantity + 1,
                  });
                }}
                className="border hover:bg-slate-100 rounded-r px-3 py-2 text-lg"
              >
                +
              </button>
            </div>

            <p className="py-2">
              Qiyməti:{" "}
              {selectedProduct?.id == null
                ? (modalData.price * selectedProduct.quantity).toFixed(2)
                : (selectedProduct.price * selectedProduct.quantity).toFixed(
                    2
                  )}{" "}
              ₼
            </p>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  const filteredStock = stocks.find(
                    (stock) => stock.id === modalId
                  );
                  if (filteredStock) {
                    handleAddStock(filteredStock.id, selectedProduct);
                  } else {
                    console.warn("No valid stock with details available.");
                  }
                }}
                className="bg-green-500 hover:bg-green-800 text-white py-2 px-4 rounded"
              >
                Masaya əlavə et
              </button>
              <button
                onClick={closeModal}
                className=" hover:bg-red-800  rounded-lg bg-red-500 text-white hover:text-white py-2 px-4"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {HesabKes && (
        <HesabKesAll
          setHesabKes={setHesabKes}
          tableName={tableName}
          orderId={odersIdMassa}
          totalAmount={totalPrice.kalan}
        />
      )}
    </>
  );
}

export default MusteriSiparisEkle;
