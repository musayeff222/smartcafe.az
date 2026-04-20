import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AccessDenied from "../components/AccessDenied";
import AlertSuccess from "../components/Alertsuccess";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import DontActiveAcount from "../components/DontActiveAcount";
import HesabKesAll from "../components/masasiparis/HesabKesAll";
import OncedenPopop from "../components/masasiparis/OncedenPopop";
import FilterButton from "../components/ui/FilterBtn";
import TableRow from "../components/ui/TableRow";
import Error from "../components/Error";
import TotalPriceHesab from "../components/masasiparis/TotalPriceHesab";
import { setFormattedOrder  } from "../redux/orderSlice";
import { useDispatch } from 'react-redux';
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function MusteriSiparisEkle() {
  const { id } = useParams(); // Get the order ID from the URL
  const [urunType, setUrunType] = useState(0);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [stockGroups, setStockGroups] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orderStocks, setOrderStocks] = useState([]);
  const fis = localStorage.getItem("fisYazisi");
  //   const [totalPrice, setTotalPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState({}); // Default total price as a number
  const navigate = useNavigate();
  const [odersIdMassa, setOrdersIdMassa] = useState({});
  const [oncedenOdePopop, setoncedenodePopop] = useState(false);
  const [refreshFetch, setrefreshfetch] = useState(false);
  const [HesabKes, setHesabKes] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  const [handleModalMetbex, setHandleModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [orderModal, setNoOrderModal] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState({
    id: null,
    name: "",
    price: 0,
    quantity: 1,
  });
  const [modalData, setModalData] = useState({
    name: "",
    desc: "",
    price: "",
  });
  const [oneProduct, setOneProduct] = useState(0);

  console.log("orderStocks",orderStocks);
  
  const closeModal = () => {
    setNoOrderModal(false);
  };
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

  const fetchStocks = async (groupId) => {
    try {
      const response = await axios.get(`${base_url}/stocks`, {
        ...getHeaders(),
        params: groupId === 0 ? {} : { stock_group_id: groupId },
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

  const handleDeleteOrder = async () => {
    try {
      await axios.delete(`${base_url}/quick-orders/${id}`, getHeaders());
      navigate("/siparisler");
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
  const dispatch = useDispatch();





  const fetchCustomerInfo = async () => {
  
    try {
      const response = await axios.get(
        `${base_url}/quick-orders/${id}`,
        getHeaders()
      );
      const { name, phone, address, order } = response.data;
      setOrdersIdMassa({
        id: response.data.order.id,
        total_price: response.data.order.total_price,
        total_prepayment: response.data.order.total_prepayment,
      });
      const total = response.data.order.total_price;
      const total_prepare = response.data.order.total_prepayment ?? 0;
      const kalanMebleg = total - total_prepare;
      setTotalPrice({
        total: total,
        total_prepare: total_prepare,
        kalan: kalanMebleg,
      });

      // setCustomerInfo({ name, phone, address });

      // const filteredStocks = order.stocks.map((stock) => ({
      //   id: stock.id,
      //   name: stock.name,
      //   price: stock.total_price,
      //   quantity: stock.pivot.quantity,
      // }));

      const formattedOrder = {
        id: order.id,
        totalPrice: order.total_price,
        total_prepayment: order.total_prepayment,
        status: order.status,
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
      };

      // Bu məlumatı state-ə yükləyirik
      setOrderStocks([formattedOrder]); // Array olaraq təyin edirik

      const shareItems = formattedOrder.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      dispatch(setFormattedOrder({ id: formattedOrder.id, items: shareItems }));
 console.log("formattedOrder.id",formattedOrder.id);
 

      
      //   setTotalPrice(order.total_price);
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







  

  const replaceImage = (url) => {
    return `${img_url}/${url}`;
  };

  useEffect(() => {
    fetchStockGroups();
    if (id) {
      fetchCustomerInfo();
    }
  }, [id, refreshFetch]);

  useEffect(() => {
    fetchStocks(urunType);
    localStorage.setItem("urunType", urunType);
  }, [urunType]);

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
  const handleCheckboxChange = (item, e) => {
    const isChecked = e.target.checked;
    setCheckedItems((prev) => {
      if (isChecked) {
        return [...prev, item];
      } else {
        return prev.filter((i) => i.id !== item.id);
      }
    });
  };
  const handleIngredientChange = (index, value) => {
    setCheckedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, customIngredient: value } : item
      )
    );
  };
  const kicthenDataSend = () => {
    const kitchenContent = `
    <html>
      <head>
        <title>Metbex Sifarişi</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .invoice {
            width: 100mm; /* Fatura kağıdı genişliği */
            margin: 5px auto;
            padding: 3px;
            border: 1px solid #000;
            box-sizing: border-box;
            font-size: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 5px;
        }
        .header h1 {
            margin: 0;
            font-size: 16px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .table th, .table td {
            border: 1px solid #000;
            padding: 3px;
            text-align: left;
        }
        .table th {
            background-color: #f4f4f4;
        }
        .print-button {
            display: none; /* Yazdırmada buton gizlenir */
        }
        </style>
      </head>
      <body>
      <div class="invoice">
        <div class="header">
     
        </div>
        <table class="table">
          <thead>
            <tr>
            <th>No</th>
            <th>Sifarişin adı</th>
          
            <th>Miq.</th>
            <th>Set.</th>
            <th>Tərkib</th>
         
        
         
            </tr>
          </thead>
          <tbody>
            ${checkedItems
              ?.map(
                (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td className=" py-2">
                      ${item?.name}
                      ${
                        item?.detail_id?.unit
                          ? ` (${item?.detail_id?.unit})`
                          : ""
                      }
                    </td>
                    <td>${item.quantity}</td>
                  
                    <td>${
                      item.count ? item.count * item.quantity : item.quantity
                    }</td>
                
                    <td>${item.customIngredient || "Yoxdur"}</td>
                  
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      </body>
    </html>
    `;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(kitchenContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    setHandleModal(false);
  };

  const handleAddSifaris = async (stockId, selectedProduct = null) => {
    try {
      await axios.post(
        `${base_url}/quick-orders/${id}/add-stock`,
        {
          stock_id: stockId,
          quantity: selectedProduct?.quantity ? selectedProduct.quantity : 1,
          detail_id: selectedProduct?.id || null,
        },
        getHeaders()
      );
      fetchCustomerInfo();
      setNoOrderModal(false);
    } catch (error) {
      <Error
        error={error}
        setActiveUser={setActiveUser}
        setAccessDenied={setAccessDenied}
        setNoOrderModal={setNoOrderModal}
      />;
    }
  };

  const handleRemoveSifaris = async (
    stockId,
    pivot_id,
    quantity,
    increase_boolean
  ) => {
    try {
      await axios.post(
        `${base_url}/quick-orders/${id}/subtract-stock`,

        {
          stock_id: stockId,
          quantity: quantity || 1,
          pivotId: pivot_id,
          increase: increase_boolean,
        },
        getHeaders()
      );
      fetchCustomerInfo();
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
        console.error("Error removing stock from order:", error);
      }
    }
  };

  const handlePrint = () => {
    const printContent = `
    <html>
    <head>
      <title>Print Order</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .sub_con{
          border: 1px solid #000;
          padding:0 5px;
      
          width: 100%; max-width:700px; margin: auto;

        }
        .container { width: 100%; max-width: 650px; margin: auto;  }
        .header { text-align: center; margin-bottom: 20px; }
        .order-list { margin-bottom: 20px; }
        .order-list table { width: 100%; border-collapse: collapse; }
        .order-list table, .order-list th, .order-list td { border: 1px solid black;   border: 1px solid #000; }
        .order-list th, .order-list td { padding: 8px; text-align: left; }
        .footer { text-align: right; margin-top: 10px;   font-weight: 700; font-size:24px; }
        .fis {text-align: center; margin-top: 20px; margin-bottom:3px; }
        .order-list table thead tr th {
          font-weight: 700;
          border: 1px solid #000;
          background-color: #f4f4f4;
      }
      .header {
        text-align: center;
        margin-bottom: 5px;
     
    }
    .cem{
      font-size:20px;

    }
     
      </style>
    </head>
    <body>
  <div class="sub_con">
      <div class="container">
       
        <div class="order-list">
        <div class="header">
        <h1>Sifariş məlumatları</h1>
        <p><strong>Müşteri:</strong> ${customerInfo.name}</p>
        <p><strong>Telefon nömrəsi:</strong> ${customerInfo.phone}</p>
        <p><strong>Address:</strong> ${customerInfo.address}</p>
       
      
   
      
          </div>
          <table>
            <thead>
          

      
              <tr>
                <th>No</th>
                <th>Sifarişin adı</th>
                <th>Əd</th>
                <th>Set</th>
                <th>Qiy</th>
                <th>Məb</th>
              </tr>
            </thead>
            <tbody>
              ${orderStocks[0].items
                ?.map(
                  (item, index) => `
                  <tr key="${item.id}">
                  <td>${index + 1}</td>
                  <td>
                  ${item.name} <br/>${item?.count ? `${item.unit || ""}` : ""}
                </td>
                
                    <td>${
                      item.count ? item.count * item.quantity : item.quantity
                    }</td>
                    <td>${item?.count ? item.quantity : 0}</td>
                    <td>${(item.price / item.quantity).toFixed(2)} </td>
                    <td>${(
                      item.quantity *
                      (item.price / item.quantity)
                    ).toFixed(2)} </td>
                    
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="footer">
        <div>
        <p class="cem">Cəm: ${totalPrice.total.toFixed(2)} Azn</p>
        ${
          totalPrice?.total_prepare && totalPrice.total_prepare !== 0
            ? `<p>Artıq ödənilib: ${totalPrice.total_prepare} AZN</p>
               <p>Qalıq: ${totalPrice.kalan.toFixed(2)} Azn</p>`
            : ""
        }
      </div>
       
        </div>
        <div class="fis">
          <strong>${fis}</strong>
        </div>
      </div>
      </div>
    </body>
  </html>
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

        setModalId(selectedStock?.id);
        setModalData({
          name: selectedStock?.name,
          desc: selectedStock?.description,
          price: selectedStock?.price,
        });
        setNoOrderModal(true);
      } else {
        handleAddSifaris(selectedStock.id);
      }
    } else {
      console.warn("Stock not found for the given ID:", stockId);
    }
  };
  if (ActiveUser) return <DontActiveAcount onClose={setActiveUser} />;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;
  return (
    <>
      <Helmet>
        <title> Müştəri sifarişi əlavə edin | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <section className="p-4 flex flex-col gap-5">
        {/* Customer Information */}
        <div className="border rounded bg-[#fafbfc] p-4 mb-5 ">
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

        {/* Orders and Menu */}
        <div className="flex flex-col   lg:flex-row gap-5">
          {/* Orders Section */}
          <div className="border  w-1/2  rounded bg-[#fafbfc] p-4 flex-2">
            {checkedItems.length > 0 && (
              <button
                onClick={() => setHandleModal(true)}
                className="bg-blue-400 text-white py-2 px-4 rounded flex items-center gap-2"
              >
                Mətbəxə yazdır
              </button>
            )}
            <h2 className="text-lg font-semibold mb-4">Siparişler</h2>

            <table className=" text-left border rounded bg-[#fafbfc] mb-4">
              <thead className="border-b border-gray-400 bg-gray-100">
                <TableRow
                  columns={[
                    { label: "Sil", className: "p-3 font-semibold" },
                    { label: "Adı", className: "p-3 font-semibold" },
                    { label: "Miktar", className: "p-3 font-semibold" },
                    { label: "Toplam", className: "p-3 font-semibold" },
                    { label: "Əsas məhsul", className: "p-3 font-semibold" },
                    { label: "Mətbəx", className: "p-3 font-semibold" },
                  ]}
                />
              </thead>

              <tbody>
                {orderStocks[0]?.items?.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="border-b ">
                    <td
                      onClick={() =>
                        handleRemoveSifaris(
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
                          {item.name}{" "}
                          <span className="mx-2">
                            {item.count} {item.unit}
                          </span>{" "}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleRemoveSifaris(
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
                                handleAddSifaris(item.id, item?.detail_id);
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
                                handleRemoveSifaris(
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
                              onClick={() => handleAddSifaris(item.id)}
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
                    <td>
                      <input
                        type="checkbox"
                        className="w-10 h-4"
                        onChange={(e) => handleCheckboxChange(item, e)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                      onClick={() => setoncedenodePopop(true)}
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

              <TotalPriceHesab
                totalPrice={totalPrice?.total}
                setHesabKes={setHesabKes}
                handlePrint={handlePrint}
                handleDeleteMasa={handleDeleteOrder}
              />
            </div>
          </div>

          {/* Menu Section */}
          <div className="border rounded  bg-gray-50 p-4 flex-1">
            <FilterButton
              isActive={urunType === 0}
              label="Hamısı"
              onClick={() => setUrunType(0)}
            />
            {stockGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setUrunType(group.id)}
                className={`p-2 mx-2 btn-filter ${
                  urunType === group.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-200"
                }`}
              >
                {group.name}
              </button>
            ))}
            <div className="h-[800px] overflow-y-scroll">
              <div className="grid grid-cols-2 sm:grid-cols-3 h-[200px] mt-4 md:grid-cols-3 gap-4">
                {stocks.map((stock) => (
                  <div
                    onClick={() => handleCustomModal(stock)}
                    // onClick={() => handleAddSifaris(stock.id)}
                    key={stock.id}
                    className="bg-white border rounded-lg p-4 shadow-md flex flex-col"
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
                      <p className="text-sm text-gray-600 truncate">
                        {stock.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
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
                  const selectedId = Number(e.target.value);

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
                  handleAddSifaris(selectedProduct.id, {
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
                    handleAddSifaris(filteredStock.id, selectedProduct);
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
      {handleModalMetbex && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white relative rounded-lg p-6 w-96">
            <button
              className="absolute right-4 top-2 bg-red-500 text-white rounded px-2 py-1"
              onClick={() => setHandleModal(false)}
            >
              X
            </button>

            <h3 className="text-lg font-semibold mb-4 text-center">
              Xüsusi Sifarişlər
            </h3>

            <table className="w-full border border-gray-200 rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Məhsul Adı</th>
                  <th className="border px-4 py-2 text-left">
                    Xüsusi İnqrediyent
                  </th>
                </tr>
              </thead>
              <tbody>
                {checkedItems?.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">
                      {item?.name}
                      {item?.detail_id?.unit && ` (${item?.detail_id?.unit})`}
                    </td>

                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Xüsusi inqrediyent daxil edin"
                        value={item.customIngredient || ""}
                        onChange={(e) =>
                          handleIngredientChange(index, e.target.value)
                        }
                        className="border rounded w-full px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={kicthenDataSend}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
              Metbexe Göndər
            </button>
          </div>
        </div>
      )}

      {alertSuccess && <AlertSuccess setAlertSuccess={setAlertSuccess} />}
      {oncedenOdePopop && (
        <OncedenPopop
          name={customerInfo?.name}
          odersIdMassa={odersIdMassa}
          setrefreshfetch={setrefreshfetch}
          setoncedenodePopop={setoncedenodePopop}
        />
      )}
      {HesabKes && (
        <HesabKesAll
          orderStocks={orderStocks}
          setHesabKes={setHesabKes}
          tableName={customerInfo?.name}
          orderId={odersIdMassa}
          totalAmount={totalPrice.kalan}
        />
      )}
    </>
  );
}

export default MusteriSiparisEkle;
