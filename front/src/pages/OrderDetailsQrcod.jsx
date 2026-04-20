// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useParams } from 'react-router-dom';
// import MenuItemPopup from '../components/MenuItemPopup'; // Ensure this path is correct
// import QrcodeDontActive from '../components/QrcodeDontActive';
// import QrcodeDontOrder from '../components/QrcodeDontOrder';
// import { base_url,img_url } from '../api/index';
// import { Helmet } from 'react-helmet';
// const getAuthHeaders = () => {
//   const token = localStorage.getItem("token");
//   return {
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     }
//   };
// };

// const RestaurantMenu = () => {
//   const [restaurant, setRestaurant] = useState({ name: '', logo: '' ,masaName:""});
//   const [masaName, setMasaName] = useState('');
//   const [menu, setMenu] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [approvedOrders, setApprovedOrders] = useState([]);
//   const [pendingOrders, setPendingOrders] = useState([]);
//   const { token } = useParams(); // Extract token from URL parameters
//   const [Qrcodedont, setQrcodedont] = useState(false);
//   const [QrcodedontOrde, setQrcodedontOrder] = useState(false);

//   useEffect(() => {
//     const fetchMenuData = async () => {
//       try {
//         const response = await axios.get(`${base_url}/qr/${token}/menu`, getAuthHeaders());
//         setMenu(response.data.stockGroups || []); // Ensure it's an array
//         setRestaurant({
//           name: response.data.restaurant.name,
//           logo: `${img_url}/${response.data.restaurant.logo}`,
//           masaName:response.data.table.name
//         });
//         console.log(response.data,'masaad');
//       } catch (error) {
//         if (error.response && error.response.status === 400) {
//           setQrcodedont(true); // Set access denied if response status is 400
//           setRestaurant({
//             name: error.response.data.restaurant.name,
//             logo: `${img_url}/${error.response.data.restaurant.logo}`
//           });
//         } else {
//           console.error("Error fetching menu data:", error);
//         }
//       }
//     };

//     const fetchTableData = async () => {
//       try {
//         const response = await axios.get(`${base_url}/qr/${token}/table`, getAuthHeaders());
//         const tableData = response.data.table;

//         setApprovedOrders(tableData.orders.approved.orders || []);
//         setPendingOrders(tableData.orders.pending_approval.orders || []);
//         setMasaName(tableData.name);
//       } catch (error) {
//         console.error('Error fetching table data:', error);
//       }
//     };

//     if (!Qrcodedont) {
//       fetchTableData();
//     }
//     fetchMenuData();
//   }, [token, Qrcodedont]);

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(selectedCategory === category ? null : category);
//   };

//   const handleItemClick = (item) => {
//     setSelectedItem(item);
//   };

//   const handleConfirmOrder = async (item, quantity) => {
//     try {
//       const orderData = {
//         stocks: [
//           {
//             stock_id: item.id,
//             quantity: quantity
//           }
//         ],
//         total_price: item.price * quantity
//       };

//       const response = await axios.post(
//         `${base_url}/qr/${token}/order`,
//         orderData,
//         getAuthHeaders()
//       );

//       console.log('Order submitted successfully:', response.data);
//       setPendingOrders(prevOrders => [
//         ...prevOrders,
//         orderData
//       ]);
//       window.location.reload();
//     } catch (error) {
//       if (error.response && error.response.status === 400) {
//         setQrcodedontOrder(true); // Set access denied if response status is 400

//       } else {

//         console.error('Error submitting order:', error);
//       }
//     } finally {
//       setSelectedItem(null);
//     }
//   };
// if (QrcodedontOrde) return <QrcodeDontOrder onClose={()=>setQrcodedontOrder(false)}></QrcodeDontOrder>
//   if (Qrcodedont) return <QrcodeDontActive onClose={() => setQrcodedont(false)} />;

//   return (
//     <>
//         <Helmet>
//         <title>Qr kodu menyusu| Smartcafe</title>
//         <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
//       </Helmet>
//     <div className=" p-6 bg-gray-100 min-h-screen">
//       <div className="flex flex-col items-center mb-6">
//       <div className=" p-4">
//         <img
//           src={restaurant.logo}
//           alt="Restaurant"
//           className="h-20 w-20 object-cover rounded-full border border-gray-300 shadow-md"
//         />
//       </div>
//       <div>
//       <h1 className="text-3xl font-bold mb-10 mt-5">{restaurant.name}</h1>
//         <p>Masanin Adi : <strong>{restaurant.masaName}</strong></p>
//       </div>
//       </div>

//       <div className="border-t-2 border-b-2 border-gray-300 mb-6">
//         {menu.map(category => (
//           <div key={category.id} className="mb-4">
//             <div
//               className="cursor-pointer py-3 px-4 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300"
//               onClick={() => handleCategoryClick(category.id)}
//             >
//               <span className="font-bold text-xl">{category.name}</span>
//               <span className="ml-4">{selectedCategory === category.id ? '↓' : '→'}</span>
//             </div>
//             {selectedCategory === category.id && (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
//                 {category.stocks.map((item, index) => (
//                   <div
//                     key={index}
//                     className="bg-white border rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
//                     onClick={() => handleItemClick(item)}
//                   >
//                     <img
//                       src={item.image ? `${img_url}/${item.image}` : '/placeholder-image.jpg'}
//                       alt={item.name}
//                       className="w-full h-32 object-contain"
//                     />
//                     <div className="p-4 center">
//                       <h4 className="text-lg font-semibold mb-2">{item.name}</h4>
//                       <p className="text-gray-600">Qiymət: {item.price} ₼</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {selectedItem && (
//         <MenuItemPopup
//           item={selectedItem}
//           onClose={() => setSelectedItem(null)}
//           onConfirm={handleConfirmOrder}
//         />
//       )}

//       {/* Only render tables if Qrcodedont is false */}
//       {!Qrcodedont && (
//         <div className="mt-6">
//           {/* Approved Orders Table */}
//           {Array.isArray(approvedOrders) && approvedOrders.length > 0 && (
//             <div className="bg-white p-4 rounded-lg shadow-md mb-6">
//               <h2 className="text-xl font-semibold mb-4">Onaylanan Sifarislerim</h2>
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {approvedOrders.flatMap(order => order.stocks.map((stock, index) => (
//                     <tr key={`${order.order_id}-${index}`}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.name}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.quantity}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.price} ₼</td>
//                     </tr>
//                   )))}
//                 </tbody>
//               </table>
//               <p className="mt-4 text-xl font-bold">Total: {approvedOrders.reduce((acc, order) => acc + order.total_price, 0)} ₼</p>
//             </div>
//           )}

//           {/* Pending Orders Table */}
//           {Array.isArray(pendingOrders) && pendingOrders.length > 0 && (
//             <div className="bg-white p-4 rounded-lg shadow-md">
//               <h2 className="text-xl font-semibold mb-4">Onaylanmayan Sifarislerim</h2>
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {pendingOrders.flatMap(order => order.stocks.map((stock, index) => (
//                     <tr key={`${order.order_id}-${index}`}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stock.name}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.quantity}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stock.price} ₼</td>
//                     </tr>
//                   )))}
//                 </tbody>
//               </table>
//               <p className="mt-4 text-xl font-bold">Toplam Məbləğ: {pendingOrders.reduce((acc, order) => acc + order.total_price, 0)} ₼</p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//     </>
//   );
// };

// export default RestaurantMenu;

// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { useParams } from "react-router-dom";
// import MenuItemPopup from "../components/MenuItemPopup"; // Ensure this path is correct
// import QrcodeDontActive from "../components/QrcodeDontActive";
// import QrcodeDontOrder from "../components/QrcodeDontOrder";
// import { base_url, img_url } from "../api/index";
// import { Helmet } from "react-helmet";
// import { addItem } from "../redux/basketSlice";
// import { useDispatch, useSelector } from "react-redux";
// import { Img } from 'react-image';
// import BasketIcon from '../img/shopping-cart.png'
// import BasketOrders from "../pages/basketOrders"
// import ApprovedOrdersModal from "../components/testiqlenmisSiparisler"

// const getAuthHeaders = () => {
//   const token = localStorage.getItem("token");
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     },
//   };
// };

// const RestaurantMenu = () => {
//   const dispatch = useDispatch();

//   const [restaurant, setRestaurant] = useState({
//     name: "",
//     logo: "",
//     masaName: "",
//   });
//   const [menu, setMenu] = useState([]);
//   console.log("menu",menu);
  
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedItem, setSelectedItem] = useState(null);
//   console.log("selectedItem123",selectedItem);
  
//   const [approvedOrders, setApprovedOrders] = useState([]);
//   const [pendingOrders, setPendingOrders] = useState([]);

//   console.log("pendingOrdersHistory",pendingOrders);
  
//   const [basketItem, setBasketItem] = useState([]);
//   const [modalOpen, setModalOpen] = useState(true)
//   const [openClick, setOpenClick] = useState(false);
//   const [openClickModal, setOpenClickModal] = useState(false);
//   console.log("openClick",openClick);
//   console.log("openClickModal",openClickModal);
//   const [openClickOrders, setOpenClickOrders] = useState(false)
//   const { token } = useParams(); // Extract token from URL parameters
//   const [Qrcodedont, setQrcodedont] = useState(false);
//   const [tableName, setTableName] = useState("");
//   const [QrcodedontOrde, setQrcodedontOrder] = useState(false);




//   // const [clickedd, setClickedd] = useState(false);
//   const [clicked, setClicked] = useState(false);

//   const handleCartClick = (item) => {
//     dispatch(addItem(item));
//     // setClicked(true);
//     // setClicked(item)

//     // setTimeout(() => setClicked(false), 1500);
//   };



//   useEffect(() => {
//     if (menu.length > 0) {
//       setSelectedCategory(menu[0]?.id); // İlk kategoriyi seçili yap
//     }
//   }, [menu]);

//   useEffect(() => {
//     const fetchMenuData = async () => {
//       try {
//         const response = await axios.get(
//           `${base_url}/qr/${token}/menu`, getAuthHeaders()
//         );
//         console.log("response",response);

//         setMenu(response.data.stockGroups || []);
//         setRestaurant({
//           name: response.data.restaurant.name,
//           logo: `${img_url}/${response.data.restaurant.logo}`,
//           masaName: response.data.table.name,
//         });
//       } catch (error) {
//         if (error.response && error.response.status === 400) {
//           setQrcodedont(true); // Set access denied if response status is 400
//           setRestaurant({
//             name: error.response.data.restaurant.name,
//             logo: `${img_url}/${error.response.data.restaurant.logo}`,
//           });
//         } else {
//           console.error("Error fetching menu data:", error);
//         }
//       }
//     };

//     console.log(tableName, "tableName");

//     const fetchTableData = async () => {
//       try {
//         const response = await axios.get(
//           `${base_url}/qr/${token}/table`,
//           getAuthHeaders()
//         );
//         const tableData = response.data.table;
//         setTableName(tableData?.name);

//         console.log("tableData",tableData);
        

//         setApprovedOrders(tableData.orders.approved.orders || []);
//         setPendingOrders(tableData.orders.pending_approval.orders || []);
//       } catch (error) {
//         console.error("Error fetching table data:", error);
//       }
//     };

//     if (!Qrcodedont) {
//       fetchTableData();
//     }
//     fetchMenuData();
//   }, [token, Qrcodedont]);

//   const handleCategoryClick = (category) => {
//     setSelectedCategory(selectedCategory === category ? null : category);
//   };

//   // const handleItemClick = (item) => {
//   //   dispatch(addItem(item));
//   //   // setSelectedItem(item);
//   // };

  

//   const handleBasketClick = () => {
//     setOpenClickOrders(true)
//     setModalOpen(true)
//   }
//   const handleClickOpenModal = () => {
//     setOpenClickModal(true)

//   };
//   const handleItemClick = (item) => {
//     setSelectedItem(item);
//   };
//   const handleClickOpen = () => {
//     setOpenClick(true)
//     // dispatch(addItem(item));
//     // setSelectedItem(item);
//   };

//   const basketItems = useSelector(state => state.basket.items || []);
//   console.log("basketItemsRedux",basketItems);

  
//   const handleConfirmOrder = async (item, quantity) => {
//     try {
//       const orderData = {
//         stocks: [
//           {
//             stock_id: item.id,
//             quantity: quantity,
//           },
//         ],
//         total_price: item.price * quantity,
//       };

//       const response = await axios.post(
//         `${base_url}/qr/${token}/order`,
//         orderData,
//         getAuthHeaders()
//       );


//       console.log("itemconfrimbuttonu",item);
      
//       console.log("Order submitted successfully:", response.data);
//       setPendingOrders((prevOrders) => [...prevOrders, orderData]);
//       window.location.reload();
//     } catch (error) {
//       if (error.response && error.response.status === 400) {
//         setQrcodedontOrder(true); // Set access denied if response status is 400
//       } else {
//         console.error("Error submitting order:", error);
//       }
//     } finally {
//       setSelectedItem(null);
//     }
//   };


//   if (QrcodedontOrde)
//     return <QrcodeDontOrder onClose={() => setQrcodedontOrder(false)} />;
//   if (Qrcodedont)
//     return <QrcodeDontActive onClose={() => setQrcodedont(false)} />;

//   return (
//     <>
//       <Helmet>
//         <title>Qr kodu menyusu | Smartcafe</title>
//         <meta
//           name="description"
//           content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
//         />
//       </Helmet>
//       <div className="p-6 mb-30 bg-gray-100 h-auto">
//         <div className="flex flex-col md:flex-row items-center mb-6">
//           <div className=" flex justify-center items-center md:mb-0 w-32 h-32 rounded-full border border-gray-300 shadow-md">
//             <img
//               src={restaurant.logo}
//               alt="Restaurant"
//               className="w-32 h-32 object-cover rounded-full border border-gray-300 shadow-md"
//             />
//           </div>
//           <div className="md:w-3/4 text-center md:text-left">
//             <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
//             <p className="flex justify-center  gap-4">
//               <h1  className="text-gray-500 font-bold " >  Masanın Adı :</h1>

//              <strong>{restaurant.masaName}</strong>
//             </p>
//           </div>
//         </div>

// <div className="border-t-2 border-b-2 border-gray-300 mb-6">
//   <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-3">
//     {menu.map((category) => (
//       <div
//         key={category.id}
//         className={`cursor-pointer w-auto h-9 flex-shrink-0 py-0.5 px-6 bg-gray-200 rounded-3xl   shadow-md hover:bg-gray-300 ${
//           selectedCategory === category.id ? "border-2 border-blue-500 bg-red-500 text-white " : ""
//         }`}
//         onClick={() => handleCategoryClick(category.id)}
//       >
//         <span className="font-bold text-lg">{category.name}</span>
//       </div>
//     ))}
//   </div>

//   {selectedCategory && (
//     <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
// {menu
//   .find((category) => category.id === selectedCategory)
//   ?.stocks.map((item, index) => (
//     <div
//       key={item.id || index}
//       className="bg-white border w-auto rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.4)]"
//       onClick={() => handleItemClick(item)}
//     >
//       <div>
//         <Img
//           src={
//             item.image
//               ? `${img_url}/${item.image}`
//               : "/placeholder-image.jpg"
//           }
//           alt={item.name}
//           className="w-48 h-32 mt-4 object-cover mr-2 rounded-lg border border-gray-300"
//         />
//       </div>

//       <div className="p-4 flex-1 text-left">
//         <h4 className="text-lg font-semibold mb-2">{item.name}</h4>
//         <h4 className="text-sm text-gray-600">{item.description}</h4>
//         <div className="flex items-baseline space-x-1 mt-2">
//           <p className="text-gray-600 font-semibold">{item.price}</p>
//           <p>₼</p>
//         </div>
//       </div>

//     </div>
//   ))}
//     </div>
//   )}
// </div>



// {openClickOrders && modalOpen && (
//   <ApprovedOrdersModal
//     approvedOrders={approvedOrders}
//     pendingOrders={pendingOrders}
//     onClose={() => setModalOpen(false)}
//   />
// )}

 
// {openClick && openClickModal && (
//   basketItems.map((item, index) => (
//     <BasketOrders
//       key={index} // map kullanırken her zaman key eklemelisin
//       onCloseModal={() => setOpenClickModal(false)} // Modalı kapatma fonksiyonu
//       items={basketItems} // Tüm sepet öğelerini aktarıyoruz
//       onClose={() => setOpenClick(false)} // Ana popup'u kapatma fonksiyonu
//       onConfirm={handleConfirmOrder} // Siparişi onaylama fonksiyonu
//     />
//   ))
// )}

// {selectedItem && (
//           <MenuItemPopup
//             item={selectedItem}
//             onClose={() => setSelectedItem(null)}
//             onCloseModal={() => setOpenClickModal(false)} 
//             onCloseClick={() => setOpenClick(false)}
//             onConfirm={handleConfirmOrder}
//           />
//         )}

//         </div>

//       <div className="fixed bottom-0 mt-20 left-0 w-full bg-white shadow-slate-500 rounded-t-xl z-50">
//         <div className="flex items-center justify-between px-4 py-2">
//           {/* Sol tərf - Qarson Çağır */}
//           <button
//             // onClick={handleCallWaiter}
//             className="flex flex-col items-center text-gray-600"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               strokeWidth="2"
//               stroke="currentColor"
//               className="w-6 h-6"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M8 9l3-3m0 0l3 3m-3-3v12"
//               />
//             </svg>
//             <span className="text-xs mt-1">Qarson Çağır</span>
//           </button>

//           {/* Ortada - Səbət */}
//           <button    onClick={() => {
//     if (basketItems && basketItems.length > 0) {
//       handleClickOpen(); // Mevcut handleClickOpen çağrısı
//       handleClickOpenModal(); // handleClickOpenModal çağrısı
//     }
//   }} className="flex flex-col items-center text-gray-600">
      

//             <Img
//             className="-ml-1 fle "
//             src={BasketIcon}
//             width={28}
//             height={28}
//             />
//             {basketItems.length >0 &&
//   <div className=" bg-red-500 w-6 text rounded-full text-white absolute ml-9 -mt-3">{basketItems.length}</div>
//             }
          
//             <span className="text-xs mt-1">Səbət</span>
//           </button>

//           {/* Sağ Tərəf - Sifarişlərim */}
//           <button onClick={handleBasketClick} className="flex flex-col items-center text-gray-600">
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               strokeWidth="2"
//               stroke="currentColor"
//               className="w-6 h-6"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M16 13l-4 4m0 0l-4-4m4 4V7"
//               />
//             </svg>
//             <span className="text-xs mt-1">Sifarişlərim</span>
//           </button>
//         </div>
//       </div>

// <div className=" mt-8">

// </div>

//     </>
//   );
// };

// export default RestaurantMenu;

















import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import MenuItemPopup from "../components/MenuItemPopup"; 
import QrcodeDontActive from "../components/QrcodeDontActive";
import QrcodeDontOrder from "../components/QrcodeDontOrder";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import { addItem } from "../redux/basketSlice";
import { useDispatch, useSelector } from "react-redux";
import { Img } from 'react-image';
import BasketIcon from '../img/shopping-cart.png'
import BasketOrders from "../pages/basketOrders"
import ApprovedOrdersModal from "../components/testiqlenmisSiparisler"

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};



const RestaurantMenu = () => {
  const dispatch = useDispatch();

  const [restaurant, setRestaurant] = useState({
    name: "",
    logo: "",
    masaName: "",
  });
  const [menu, setMenu] = useState([]);
  console.log("menu",menu);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  console.log("selectedItem123",selectedItem);
  
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  console.log("pendingOrdersHistory",pendingOrders);
  
  const [basketItem, setBasketItem] = useState([]);
  const [modalOpen, setModalOpen] = useState(true)
  const [openClick, setOpenClick] = useState(false);
  const [openClickModal, setOpenClickModal] = useState(false);
  console.log("openClick",openClick);
  console.log("openClickModal",openClickModal);
  const [openClickOrders, setOpenClickOrders] = useState(false)
  const { token } = useParams(); // Extract token from URL parameters
  const [Qrcodedont, setQrcodedont] = useState(false);
  const [tableName, setTableName] = useState("");
  const [QrcodedontOrde, setQrcodedontOrder] = useState(false);
const [stockSets, setStockSets] = useState([]);

const fetchStockSets = async () => {
  try {
    const response = await axios.get(`${base_url}/stock-sets`, getAuthHeaders());
    setStockSets(response.data);
  } catch (error) {
    console.error("Error loading stock sets:", error);
  }
};



  // const [clickedd, setClickedd] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleCartClick = (item) => {
    dispatch(addItem(item));
    // setClicked(true);
    // setClicked(item)

    // setTimeout(() => setClicked(false), 1500);
  };



  useEffect(() => {
    if (menu.length > 0) {
      setSelectedCategory(menu[0]?.id); 
    }
  }, [menu]);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await axios.get(
          `${base_url}/qr/${token}/menu`, getAuthHeaders()
        );
        console.log("response",response);

        setMenu(response.data.stockGroups || []);
        setRestaurant({
          name: response.data.restaurant.name,
          logo: `${img_url}/${response.data.restaurant.logo}`,
          masaName: response.data.table.name,
        });
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setQrcodedont(true);
          setRestaurant({
            name: error.response.data.restaurant.name,
            logo: `${img_url}/${error.response.data.restaurant.logo}`,
          });
        } else {
          console.error("Error fetching menu data:", error);
        }
      }
    };

    console.log(tableName, "tableName");

    const fetchTableData = async () => {
      try {
        const response = await axios.get(
          `${base_url}/qr/${token}/table`,
          getAuthHeaders()
        );
        const tableData = response.data.table;
        setTableName(tableData?.name);

        console.log("tableData",tableData);
        

        setApprovedOrders(tableData.orders.approved.orders || []);
        setPendingOrders(tableData.orders.pending_approval.orders || []);
      } catch (error) {
        console.error("Error fetching table data:", error);
      }
    };

    if (!Qrcodedont) {
      fetchTableData();
    }
    fetchMenuData();
  }, [token, Qrcodedont]);


  const categoryRefs = useRef({});

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    if (categoryRefs.current[categoryId]) {
      categoryRefs.current[categoryId].scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  };

  // const handleItemClick = (item) => {
  //   dispatch(addItem(item));
  //   // setSelectedItem(item);
  // };

  

  const handleBasketClick = () => {
    setOpenClickOrders(true)
    setModalOpen(true)
  }
  const handleClickOpenModal = () => {
    setOpenClickModal(true)

  };
  const handleItemClick = (item) => {
    console.log("item",item);
    
    setSelectedItem(item);
  };
  const handleClickOpen = () => {
    setOpenClick(true)
    // dispatch(addItem(item));
    // setSelectedItem(item);
  };

  const basketItems = useSelector(state => state.basket.items || []);
  console.log("basketItemsRedux",basketItems);

  
const handleConfirmOrder = async (item, quantity) => {
  try {
    // Seçilen öğenin bir set mi yoksa normal stok mu olduğunu kontrol et
    const isSet = stockSets.some(set => set.id === item.id);
    
    const orderData = isSet
      ? {
          stock_sets: [
            {
              stock_set_id: item.id,
              quantity: quantity,
              detail_id: item.details || null 
            }
          ]
        }
      : {
          stocks: [
            {
              stock_id: item.id,
              quantity: quantity,
              detail_id: item.detail_id || null 
            }
          ]
        };

    console.log("orderData", orderData);
    
    const response = await axios.post(
      `${base_url}/qr/${token}/order`,
      orderData,
      getAuthHeaders()
    );
    
    console.log("Order submitted successfully:", response.data);
    setPendingOrders(prevOrders => [...prevOrders, orderData]);
    window.location.reload();
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      setQrcodedontOrder(true);
    } else {
      console.error("Error submitting order:", error);
    }
  } finally {
    setSelectedItem(null);
  }
};


  if (QrcodedontOrde)
    return <QrcodeDontOrder onClose={() => setQrcodedontOrder(false)} />;
  if (Qrcodedont)
    return <QrcodeDontActive onClose={() => setQrcodedont(false)} />;

  return (
    <>
      <Helmet>
        <title>Qr kodu menyusu | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <div className="p-6 mb-30 bg-gray-100 h-auto">
        <div className="flex flex-col md:flex-row items-center mb-6">
          <div className=" flex justify-center items-center md:mb-0 w-32 h-32 rounded-full border border-gray-300 shadow-md">
            <img
              src={restaurant.logo}
              alt="Restaurant"
              className="w-32 h-32 object-cover rounded-full border border-gray-300 shadow-md"
            />
          </div>
          <div className="md:w-3/4 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
            <p className="flex justify-center  gap-4">
              <h1  className="text-[#A350E5] font-bold text-lg " >  Masanın Adı :</h1>

             <strong className=" mt-1">{restaurant.masaName}</strong>
            </p>
          </div>
        </div>

        <div
  className=" border-gray-300 mb-6"
  style={{
    backgroundImage: "url('/backgorundClient2.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>

<div className="border-t-2 border-b-2 border-gray-300 mb-6 mt-5 ">
<div className="w-full  overflow-x-auto relative scrollbar-hide">
  <div className="flex gap-1  mt-4 w-max">
  <div className="w-full overflow-x-scroll scrollbar-hide scroll-smooth relative">
  <div className="flex gap-1 mt-1 w-max">



 {menu.map((category) => (
        <button
          key={category.id}
          ref={(el) => (categoryRefs.current[category.id] = el)}
          className={`w-28 h-9 text-sm font-semibold rounded-xl transition-all shadow-md hover:bg-gray-300 ${
            selectedCategory === category.id
              ? "border-2 bg-[#A350E5] text-white"
              : "bg-[#A350E5] text-white opacity-40"
          }`}
          onClick={() => handleCategoryClick(category.id)}
        >
          {category.name}
        </button>
      ))}

      


      
  </div>

  <div className=" mt-4">
        <button
  className={`w-28 h-9 text-sm font-semibold rounded-xl transition-all shadow-md hover:bg-gray-300 ${
    selectedCategory === "sets"
      ? "border-2 bg-[#A350E5] text-white"
      : "bg-[#A350E5] text-white opacity-40"
  }`}
  onClick={() => {
    setSelectedCategory("sets");
    fetchStockSets();
  }}
>
  Setler
</button>
  </div>
</div>

  </div>
</div>

   {selectedCategory && (
  <div className="grid mt-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
    {selectedCategory === "sets"
      ? stockSets.map((item, index) => (
          <div
            key={item.id || index}
            className="w-full h-52 bg-white shadow-xl text-[#56525A] font-medium rounded-xl flex flex-col relative overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.4)]"
            onClick={() => handleItemClick(item)}
          >
            <Img
              src={
                item.image
                  ? `${img_url}/${item.image}`
                  : "/placeholder-image.jpg"
              }
              alt={item.name}
              className="w-full h-[60%] object-cover rounded-t-xl"
              width={200}
              height={150}
            />
            <div className="absolute  flex justify-center justify-items-center mt-24 right-0 mr-2 bg-[#801423] w-14 h-5 rounded-md text-center ml-3">
              <h1 className="text-sm   text-white font-bold ">
                {item.price}₼
              </h1>
            </div>

          
            <div className="mt-1 flex flex-col gap-1">
              <h1 className="text-xs font-semibold text-[#919191] ml-3">
                {item.description}
              </h1>
            </div>

              <h1 className="h-[15%] mt-1 text-lg font-semibold ml-3">
              {item.name}
            </h1>
          </div>
        ))
      : menu
          .find((category) => category.id === selectedCategory)
          ?.stocks.map((item, index) => (
            <div
              key={item.id || index}
              className="w-full h-52 bg-white shadow-xl text-[#56525A] font-medium rounded-xl flex flex-col relative overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.4)]"
              onClick={() => handleItemClick(item)}
            >
              <Img
                src={
                  item.image
                    ? `${img_url}/${item.image}`
                    : "/placeholder-image.jpg"
                }
                alt={item.name}
                className="w-full h-[60%] object-cover rounded-t-xl"
                width={200}
                height={150}
              />
              <div className="absolute  flex justify-center justify-items-center mt-24 right-0 mr-2 bg-[#801423] w-14 h-5 rounded-md text-center ml-3">
                <h1 className="text-sm   text-white font-bold ">
                  {item.price}₼
                </h1>
              </div>

              <h1 className="h-[15%] mt-1 text-lg font-semibold ml-3">
                {item.name}
              </h1>
              <div className="mt-1 flex flex-col gap-1">
                <h1 className="text-xs font-semibold text-[#919191] ml-3">
                  {item.description}
                </h1>
              </div>
            </div>
          ))}
  </div>
)}
    </div>


</div>


{openClickOrders && modalOpen && (
  <ApprovedOrdersModal
    approvedOrders={approvedOrders}
    pendingOrders={pendingOrders}
    onClose={() => setModalOpen(false)}
  />
)}

 
{openClick && openClickModal && (
  basketItems.map((item, index) => (
    <BasketOrders
      key={index} // map kullanırken her zaman key eklemelisin
      onCloseModal={() => setOpenClickModal(false)} // Modalı kapatma fonksiyonu
      items={basketItems} // Tüm sepet öğelerini aktarıyoruz
      onClose={() => setOpenClick(false)} // Ana popup'u kapatma fonksiyonu
      onConfirm={handleConfirmOrder} // Siparişi onaylama fonksiyonu
    />
  ))
)}

{selectedItem && (
          <MenuItemPopup
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onCloseModal={() => setOpenClickModal(false)} 
            onCloseClick={() => setOpenClick(false)}
            onConfirm={handleConfirmOrder}
          />
        )}

        </div>

      <div className="fixed bottom-0 mt-20 left-0 w-full bg-white shadow-slate-500 rounded-t-xl z-50">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Sol tərf - Qarson Çağır */}
          <button
            // onClick={handleCallWaiter}
            className="flex flex-col items-center text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9l3-3m0 0l3 3m-3-3v12"
              />
            </svg>
            <span className="text-xs mt-1">Qarson Çağır</span>
          </button>

          {/* Ortada - Səbət */}
          <button    onClick={() => {
    if (basketItems && basketItems.length > 0) {
      handleClickOpen(); // Mevcut handleClickOpen çağrısı
      handleClickOpenModal(); // handleClickOpenModal çağrısı
    }
  }} className="flex flex-col items-center text-gray-600">
      

            <Img
            className="-ml-1 fle "
            src={BasketIcon}
            width={28}
            height={28}
            />
            {basketItems.length >0 &&
  <div className=" bg-red-500 w-6 text rounded-full text-white absolute ml-9 -mt-3">{basketItems.length}</div>
            }
          
            <span className="text-xs mt-1">Səbət</span>
          </button>

          {/* Sağ Tərəf - Sifarişlərim */}
          <button onClick={handleBasketClick} className="flex flex-col items-center text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 13l-4 4m0 0l-4-4m4 4V7"
              />
            </svg>
            <span className="text-xs mt-1">Sifarişlərim</span>
          </button>
        </div>
      </div>

<div className=" mt-8">

</div>

    </>
  );
};

export default RestaurantMenu;
