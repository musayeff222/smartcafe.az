// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { removeItem, increaseQuantity, decreaseQuantity } from "../redux/basketSlice";
// import { Img } from "react-image";
// import BasketIcon from "../img/shopping-cart.png";
// import RemoveBasket from "../img/delete (1).png";

// const BasketOrders = ({ items, onClose, onConfirm, onCloseModal }) => {
//   const [quantities, setQuantities] = useState({});
//   const [fadingItems, setFadingItems] = useState([]); // Geçici silme için durum
//   const dispatch = useDispatch();
//   const basketItems = useSelector((state) => state.basket.items || []);
//   const totalPrice = useSelector((state) => state.basket.totalPrice);

//   useEffect(() => {
//     const newQuantities = items.reduce((acc, item) => {
//       acc[item.id] = item.quantity || 1;
//       return acc;
//     }, {});
//     setQuantities(newQuantities);
//   }, [items]);

//   useEffect(() => {
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, []);

//   const handleIncreaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] + 1,
//     }));
//     dispatch(increaseQuantity({ id }));
//   };

//   const handleDecreaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] > 1 ? prev[id] - 1 : 1,
//     }));
//     if (quantities[id] > 1) {
//       dispatch(decreaseQuantity({ id }));
//     }
//   };

//   const handleRemoveItem = (id) => {
//     // Fading işlemi başlat
//     setFadingItems((prev) => [...prev, id]);

//     // 0.5 saniye sonra Redux'dan ürünü sil
//     setTimeout(() => {
//       dispatch(removeItem({ id }));
//       setFadingItems((prev) => prev.filter((fadingId) => fadingId !== id)); // Fading durumunu kaldır
//     }, 500); // 0.5 saniye
//   };

//   const handleConfirm = () => {
//     items.forEach((item) => {
//       onConfirm(item, quantities[item.id]);
//     });
//     onCloseModal();
//   };


//   return (
//     <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-[9999]">
//       <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
//         <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>
//         <div className="mb-6 flex ml-1 gap-2 justify-between ">
//           <div className="flex ml-1 gap-2">
//             <Img className="-ml-1" src={BasketIcon} width={28} height={28} />
//             <h3 className="text-lg font-semibold">{basketItems.length}</h3>
//             <h3 className="text-lg font-semibold">məhsul</h3>
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold">{totalPrice.toFixed(2)} ₼</h3>
//           </div>
//         </div>

//         {/* Scroll yapılabilen alan */}
//         <div className="space-y-4 max-h-[390px] overflow-y-auto">
//         {items.map((item) => (
//   <div
//     key={item.id}
//     className={`flex justify-between items-center px-4 py-2 border bg-[#f9f9f9] hover:bg-[#e6f3ff] hover:border-blue-500 border-gray-300 rounded-md transition-all duration-500 ease-in-out ${
//       fadingItems.includes(item.id) ? "opacity-0 transform -translate-x-52" : ""
//     }`}
//   >
//     <div className="flex flex-col gap-2">
//       <span>{item.name}</span>
//       <span>{item.price} ₼</span>
//     </div>
//     <div className="flex items-center space-x-2 ">
//       <button
//         onClick={() => handleDecreaseQuantity(item.id)}
//         className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//       >
//         -
//       </button>
//       <span className="mx-2">{quantities[item.id]}</span>
//       <button
//         onClick={() => handleIncreaseQuantity(item.id)}
//         className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//       >
//         +
//       </button>
//       <button
//         onClick={() => handleRemoveItem(item.id)}
//         className="w-8 h-8"
//       >
//         <Img className="" src={RemoveBasket} width={28} height={28} />
//       </button>
//     </div>
//   </div>
// ))}

//         </div>
//         <div className="flex w-full text-xs font-normal  space-x-3 justify-between mt-4">
//           <button
//             onClick={handleConfirm}
//             className="bg-[#28a745] text-white py-2 w-full px-4 rounded-3xl transform transition-transform hover:scale-105"
//           >
//             Masaya Əlavə et
//           </button>
//           <button
//             onClick={onClose}
//             className="text-white rounded-3xl w-full py-2 bg-[#dc3545] transform transition-transform hover:scale-105"
//           >
//             Bağla
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BasketOrders;












import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, increaseQuantity, decreaseQuantity } from "../redux/basketSlice";
import { Img } from "react-image";
import BasketIcon from "../img/shopping-cart.png";
import RemoveBasket from "../img/delete (1).png";

const BasketOrders = ({ items, onClose, onConfirm, onCloseModal }) => {
  const [quantities, setQuantities] = useState({});
  const [fadingItems, setFadingItems] = useState([]); // Geçici silme için durum
  const dispatch = useDispatch();
  const basketItems = useSelector((state) => state.basket.items || []);
  const totalPrice = useSelector((state) => state.basket.totalPrice);
console.log("items",items);

  useEffect(() => {
    const newQuantities = items.reduce((acc, item) => {
      acc[item.id] = item.quantity || 1;
      return acc;
    }, {});
    setQuantities(newQuantities);
  }, [items]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleIncreaseQuantity = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
    dispatch(increaseQuantity({ id }));
  };

  const handleDecreaseQuantity = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] > 1 ? prev[id] - 1 : 1,
    }));
    if (quantities[id] > 1) {
      dispatch(decreaseQuantity({ id }));
    }
  };

  const handleRemoveItem = (id, detail_id) => {
    // Fading işlemi için benzersiz anahtar (örneğin, id-detail_id)
    const uniqueKey = `${id}-${detail_id}`;
    setFadingItems((prev) => [...prev, uniqueKey]);
  
    // 0.5 saniye sonra Redux'dan ürünü sil
    setTimeout(() => {
      dispatch(removeItem({ id, detail_id }));
      setFadingItems((prev) =>
        prev.filter((fadingKey) => fadingKey !== uniqueKey)
      );
    }, 500);
  };
  

  const handleConfirm = () => {
    const orderData = {
      stocks: items.map(item => ({
        stock_id: item.id,
        quantity: quantities[item.id] || 1,
        detail_id: item.detail_id || null
      }))
    };
  
    items.forEach((item) => {
      onConfirm(item, quantities[item.id]);
    });
    onCloseModal();
  };
  
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-[9999]">
      <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
        <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>
        <div className="mb-6 flex ml-1 gap-2 justify-between ">
          <div className="flex ml-1 gap-2">
            <Img className="-ml-1" src={BasketIcon} width={28} height={28} />
            <h3 className="text-lg font-semibold">{basketItems.length}</h3>
            <h3 className="text-lg font-semibold">məhsul</h3>
          </div>

     {/* Ürün adlarını sadece bir kere göstermek için name'leri filtrele */}
{/* <p className="text-xl text-gray-700 mr-16 font-semibold -mt-1">
  {[...new Set(items.map((item) => item.name))].map((name, index, arr) => (
    <span key={index}>
      {name}
      {index < arr.length - 1 && ', '}
    </span>
  ))}
</p> */}

          {/* <div>
            <h3 className="text-lg font-semibold">{totalPrice.toFixed(2)} ₼</h3>
          </div> */}
        </div>

        {/* Scroll yapılabilen alan */}
        <div className="space-y-4 max-h-[390px] overflow-y-auto">
        {items.map((item) => {
  const uniqueKey = `${item.id}-${item.detail_id}`;
  const matchedDetail = item.details?.find(detail => detail.id === item.detail_id);
  const unit = matchedDetail?.unit || ""; // Unit bilgisi varsa al, yoksa boş string

  return (
    <div
      key={uniqueKey}
      className={`flex justify-between items-center px-4 py-2 border bg-[#f9f9f9] hover:bg-[#e6f3ff] hover:border-blue-500 border-gray-300 rounded-md transition-all duration-500 ease-in-out ${
        fadingItems.includes(uniqueKey) ? "opacity-0 transform -translate-x-52" : ""
      }`}
    >
      <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
  <span>{item.price} ₼</span>
  {unit ? (
    <span className="text-sm text-gray-500">{unit}</span>
  ) : (
    <span>{item.name}</span>
  )}
</div>

    
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleDecreaseQuantity(item.id)}
          className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
        >
          -
        </button>
        <span className="mx-2">{quantities[item.id]}</span>
        <button
          onClick={() => handleIncreaseQuantity(item.id)}
          className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
        >
          +
        </button>
        <button
          onClick={() => handleRemoveItem(item.id, item.detail_id)}
          className="w-8 h-8"
        >
          <Img src={RemoveBasket} width={28} height={28} />
        </button>
      </div>
    </div>
  );
})}
            {Array.isArray(items.stocks) && items.stocks.length > 0 && (
    <div className="mt-4">
      <h4 className="text-md font-semibold mb-2">Set Məlumatları</h4>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
       
        </thead>
        <tbody>
          {items.stocks.map((stock) => (
            <tr key={stock.id} className="hover:bg-gray-100">
              <td className="px-1 py-2 border">
                <img
                  src={stock.image}
              alt="img"
                  className="w-12 h-12 object-cover rounded"
                />
              </td>
              <td className="px-2 py-2 border">{stock.name}</td>
              <td className="px-4 py-2 border">{stock.pivot?.quantity ?? "0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}


        </div>
        <div className="flex w-full text-xs font-normal  space-x-3 justify-between mt-4">
          <button
            onClick={handleConfirm}
            className="bg-[#28a745] text-white py-2 w-full px-4 rounded-3xl transform transition-transform hover:scale-105"
          >
            Masaya Əlavə et
          </button>
          <button
            onClick={onClose}
            className="text-white rounded-3xl w-full py-2 bg-[#dc3545] transform transition-transform hover:scale-105"
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasketOrders;


























// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { removeItem, increaseQuantity, decreaseQuantity } from "../redux/basketSlice";
// import { Img } from "react-image";
// import BasketIcon from "../img/shopping-cart.png";
// import RemoveBasket from "../img/delete (1).png";

// const BasketOrders = ({ items, onClose, onConfirm, onCloseModal }) => {
//   const [quantities, setQuantities] = useState({});
//   const [fadingItems, setFadingItems] = useState([]); // Geçici silme için durum
//   const dispatch = useDispatch();
//   const basketItems = useSelector((state) => state.basket.items || []);
//   const totalPrice = useSelector((state) => state.basket.totalPrice);

//   useEffect(() => {
//     const newQuantities = items.reduce((acc, item) => {
//       acc[item.id] = item.quantity || 1;
//       return acc;
//     }, {});
//     setQuantities(newQuantities);
//   }, [items]);

//   useEffect(() => {
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, []);

//   const handleIncreaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] + 1,
//     }));
//     dispatch(increaseQuantity({ id }));
//   };

//   const handleDecreaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] > 1 ? prev[id] - 1 : 1,
//     }));
//     if (quantities[id] > 1) {
//       dispatch(decreaseQuantity({ id }));
//     }
//   };

//   const handleRemoveItem = (id) => {
//     // Fading işlemi başlat
//     setFadingItems((prev) => [...prev, id]);

//     // 0.5 saniye sonra Redux'dan ürünü sil
//     setTimeout(() => {
//       dispatch(removeItem({ id }));
//       setFadingItems((prev) => prev.filter((fadingId) => fadingId !== id)); // Fading durumunu kaldır
//     }, 500); // 0.5 saniye
//   };

//   const handleConfirm = () => {
//     items.forEach((item) => {
//       onConfirm(item, quantities[item.id]);
//     });
//     onCloseModal();
//   };

//   return (
//     <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-[9999]">
//       <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
//         <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>
//         <div className="mb-6 flex ml-1 gap-2 justify-between ">
//           <div className="flex ml-1 gap-2">
//             <Img className="-ml-1" src={BasketIcon} width={28} height={28} />
//             <h3 className="text-lg font-semibold">{basketItems.length}</h3>
//             <h3 className="text-lg font-semibold">məhsul</h3>
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold">{totalPrice.toFixed(2)} ₼</h3>
//           </div>
//         </div>

//         {/* Scroll yapılabilen alan */}
//         <div className="space-y-4 max-h-[390px] overflow-y-auto">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className={`flex justify-between items-center px-4 py-2 border bg-[#f9f9f9] hover:bg-[#e6f3ff] hover:border-blue-500   border-gray-300 rounded-md transition-all duration-500 ease-in-out ${
//                 fadingItems.includes(item.id) ? "opacity-0 transform -translate-y-4" : ""
//               }`}
//             >
//               <div className="flex flex-col gap-2">
//                 <span>{item.name}</span>
//                 <span>{item.price} ₼</span>
//               </div>
//               <div className="flex items-center space-x-2 ">
//                 <button
//                   onClick={() => handleDecreaseQuantity(item.id)}
//                   className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//                 >
//                   -
//                 </button>
//                 <span className="mx-2">{quantities[item.id]}</span>
//                 <button
//                   onClick={() => handleIncreaseQuantity(item.id)}
//                   className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//                 >
//                   +
//                 </button>
//                 <button
//                   onClick={() => handleRemoveItem(item.id)}
//                   className="w-8 h-8"
//                 >
//                   <Img className="" src={RemoveBasket} width={28} height={28} />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="flex w-full text-xs font-normal  space-x-3 justify-between mt-4">
//           <button
//             onClick={handleConfirm}
//             className="bg-[#28a745] text-white py-2 w-full px-4 rounded-3xl transform transition-transform hover:scale-105"
//           >
//             Masaya Əlavə et
//           </button>
//           <button
//             onClick={onClose}
//             className="text-white rounded-3xl w-full py-2 bg-[#dc3545] transform transition-transform hover:scale-105"
//           >
//             Bağla
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BasketOrders;
