// import React, { useState } from "react";
// import { useDispatch } from "react-redux";
// import { addItem } from "../redux/basketSlice";

// const MenuItemPopup = ({ item, onClose, onConfirm, onCloseModal,onCloseClick}) => {
//   const [quantity, setQuantity] = useState(1);
//   const dispatch = useDispatch();
//   const [oneProduct, setOneProduct] = useState(null);
//   const [selectedProduct, setSelectedProduct] = useState({
//     id: null,
//     name: "",
//     price: 0,
//     quantity: 1,
//   });
//   console.log("itemsebetredux",item);
//   console.log("selectedProductIdDetails",selectedProduct);
  
  
//   const handleItemClick = () => {
//     // Detay seçildiyse detay bilgileri, seçilmediyse ana ürün bilgileri
//     const productToAdd = selectedProduct.id
//       ? {
//           id: `${item.id}`, //detay ID'si
//           name: item.name, // Ana ürün adı
//           price: selectedProduct.price, // Seçilen detayın fiyatı
//           quantity, // Kullanıcının seçtiği miktar
//           desc: null // Detayın açıklaması (unit)
//         }
//       : {
//           id: item.id, // Ana ürün ID'si
//           name: item.name, // Ana ürün adı
//           price: item.price, // Ana ürün fiyatı
//           quantity, // Kullanıcının seçtiği miktar
//           desc: null, // Açıklama boş
//         };
  
//     // Redux'a ürünü ekle
//     dispatch(addItem(productToAdd));
  
//     // Popup'u kapat
//     onCloseModal();
//     onCloseClick();
//     onClose();
//   };
  
  
  

//   const increaseQuantity = () => setQuantity(quantity + 1);
//   const decreaseQuantity = () => {
//     if (quantity > 1) setQuantity(quantity - 1);
//   };

//   // const handleConfirm = () => {
//   //   onConfirm(item, quantity);
//   //   onClose(); // Popup'u kapat
//   // };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99999]">
//       <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
//         <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>
//         <div className="space-y-2">
//   <div className="flex justify-between px-4 py-1 bg-[#f9f9f9] h-16 border border-gray-300 rounded-md cursor-pointer hover:bg-[#e6f3ff] hover:border-blue-500 transition duration-300 ease-in-out">
//     <div className="flex flex-col gap-2">
//       <div>{item?.name}</div>
//       <div>{item?.price} ₼</div>
//     </div>
//   </div>

//   {/* Details'i map ile göster */}
//   {item.details.map((detail) => (
//   <div
//     key={detail.id}
//     className={`flex justify-between px-4 py-1 h-16 border rounded-md cursor-pointer transition duration-300 ease-in-out
//       ${selectedProduct.id === detail.id ? "bg-[#e6f3ff] border-blue-500" : "bg-[#f9f9f9] border-gray-300 hover:bg-[#e6f3ff] hover:border-blue-500"}`}
//     onClick={() =>
//       setSelectedProduct({
//         id: detail.id,
//         name: detail.unit || "Bilinmiyor",
//         price: Number(detail.price),
//         quantity: 1,
//       })
//     }
//   >
//     <div className="flex flex-col gap-2">
//       <div>
//         {detail.count} {detail.unit}
//       </div>
//       <div>{detail.price} ₼</div>
//     </div>
//   </div>
// ))}


// </div>

//         <div className="flex justify-center items-center my-4">
//           <button
//             onClick={decreaseQuantity}
//             className="w-[40px] h-[40px] bg-[#007bff] rounded-full text-lg text-white"
//           >
//             -
//           </button>
//           <span className="mx-1 text-lg border px-6 rounded-md">{quantity}</span>
//           <button
//             onClick={increaseQuantity}
//             className="h-[40px] w-[40px] bg-[#007bff] text-white rounded-full"
//           >
//             +
//           </button>
//         </div>
//         <div className="flex w-full text-xs font-normal space-x-3 justify-between">
//           <button
//             onClick={handleItemClick}
//             className="bg-[#28a745] text-white py-2 w-full px-4 rounded-3xl transform transition-transform hover:scale-105"
//           >
//             Səbətə əlavə et
//           </button>
//           <button
//             onClick={onClose}
//             className="text-white w-full rounded-3xl py-2 bg-[#dc3545] transform transition-transform hover:scale-105 "
//           >
//            Bağla
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MenuItemPopup;







import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "../redux/basketSlice";
import { Img } from "react-image";
import { base_url, img_url } from "../api/index";


const MenuItemPopup = ({ item, onClose, onCloseModal, onCloseClick }) => {
  console.log("itemloglama",item);
  
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const totalPrice = selectedProduct ? selectedProduct.price * quantity : item.price * quantity;

  const handleItemClick = () => {
    const productToAdd = {
      id: item.id,
      detail_id: selectedProduct ? selectedProduct.id : null,
      name: item.name,
      price: selectedProduct ? selectedProduct.price : item.price,
      quantity,
      desc: selectedProduct ? selectedProduct.name : null,
      details: item.details,
      originalPrice: item.price,
    };
  
    dispatch(addItem(productToAdd));
    onCloseModal();
    onCloseClick();
    onClose();
  };

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99999]">
      <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
        <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>

        {/* Seçilen ürün ve toplam fiyat */}
        <div className="text-center text-lg font-bold mb-4">
          {selectedProduct ? selectedProduct.name : item.name} - {totalPrice.toFixed(2)} ₼
        </div>

        <div className="space-y-2">


          <div className="flex justify-between px-4 py-1 bg-[#f9f9f9] h-16 border border-gray-300 rounded-md cursor-pointer hover:bg-[#e6f3ff] hover:border-blue-500 transition duration-300 ease-in-out">
            <div className="flex flex-col gap-2">
              <div>{item?.name}</div>
              <div>{item?.price} ₼</div>
            </div>
          </div>

            {Array.isArray(item.stocks) && item.stocks.length > 0 && (
    <div className="mt-4">
  <h4 className="text-md font-semibold mb-2">Set Məlumatları</h4>
  <table className="w-full text-left border-collapse text-sm">
    <thead>
      <tr className="bg-gray-200">
        <th className="px-1 py-2 border">Şəkil</th>
        <th className="px-2 py-2 border">Ad</th>
        <th className="px-4 py-2 border">Say</th>
      </tr>
    </thead>
    <tbody>
      {item.stocks.map((stock) => (
        <tr key={stock.id} className="hover:bg-gray-100">
          <td className="px-1 py-2 border">
            <Img
              src={
                stock.image
                  ? `${img_url}/${stock.image}`
                  : "/placeholder-image.jpg"
              }
              alt={stock.name}
              className="w-24 h-16 object-cover rounded-md mx-auto"
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

          {/* Details'i map ile göster */}
      {Array.isArray(item.details) && item.details.map((detail) => (
  <div
    key={detail.id}
    className={`flex justify-between px-4 py-1 h-16 border rounded-md cursor-pointer transition duration-300 ease-in-out
      ${selectedProduct?.id === detail.id ? "bg-[#e6f3ff] border-blue-500" : "bg-[#f9f9f9] border-gray-300 hover:bg-[#e6f3ff] hover:border-blue-500"}`}
    onClick={() =>
      setSelectedProduct({
        id: detail.id,
        name: detail.unit || "Bilinmiyor",
        price: Number(detail.price),
      })
    }
  >
    <div className="flex flex-col gap-2">
      <div>
        {detail.count} {detail.unit}
      </div>
      <div>{detail.price} ₼</div>
    </div>
  </div>
))}
        </div>

        <div className="flex justify-center items-center my-4">
          <button onClick={decreaseQuantity} className="w-[40px] h-[40px] bg-[#007bff] rounded-full text-lg text-white">-</button>
          <span className="mx-1 text-lg border px-6 rounded-md">{quantity}</span>
          <button onClick={increaseQuantity} className="h-[40px] w-[40px] bg-[#007bff] text-white rounded-full">+</button>
        </div>

        <div className="flex w-full text-xs font-normal space-x-3 justify-between">
          <button
            onClick={handleItemClick}
            className="bg-[#28a745] text-white py-2 w-full px-4 rounded-3xl transform transition-transform hover:scale-105"
          >
            Səbətə əlavə et
          </button>
          <button
            onClick={onClose}
            className="text-white w-full rounded-3xl py-2 bg-[#dc3545] transform transition-transform hover:scale-105 "
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemPopup;





// import React, { useEffect, useState } from "react";

// const MenuItemPopup = ({ items, onClose, onConfirm }) => {
//   const [quantities, setQuantities] = useState(
//     items.reduce((acc, item) => {
//       acc[item.id] = 1; // Her öğe için varsayılan miktar
//       return acc;
//     }, {})
//   );

//   useEffect(() => {
//     // Modal açıldığında body'ye overflow: hidden ekle
//     document.body.style.overflow = "hidden";

//     // Modal kapandığında overflow: hidden'ı kaldır
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, []);

//   const increaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] + 1,
//     }));
//   };

//   const decreaseQuantity = (id) => {
//     setQuantities((prev) => ({
//       ...prev,
//       [id]: prev[id] > 1 ? prev[id] - 1 : 1,
//     }));
//   };

//   const handleConfirm = () => {
//     items.forEach((item) => {
//       onConfirm(item, quantities[item.id]); // Her öğe için onConfirm çağırılıyor
//     });
//     onClose(); // Tüm siparişler onaylandıktan sonra modalı kapat
//   };

//   return (
//     <div className="fixed inset-0 bg-white bg-opacity-50 flex justify-center items-center z-[9999]">
//       <div className="bg-white p-6 rounded-lg w-[460px] mx-2 shadow-lg">
//         <h3 className="text-lg font-bold text-center mb-4">Məhsul seçimi</h3>
//         {/* Scroll yapılabilen alan */}
//         <div className="space-y-4 max-h-[390px] overflow-y-auto">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className="flex justify-between items-center px-4 py-2 bg-[#f9f9f9] border border-gray-300 rounded-md hover:bg-[#e6f3ff] hover:border-blue-500 transition duration-300 ease-in-out"
//             >
//               <div className="flex flex-col gap-2">
//                 <span>{item.name}</span>
//                 <span>Qiymət: {item.price} ₼</span>
//               </div>
//               <div className="flex items-center">
//                 <button
//                   onClick={() => decreaseQuantity(item.id)}
//                   className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//                 >
//                   -
//                 </button>
//                 <span className="mx-2">{quantities[item.id]}</span>
//                 <button
//                   onClick={() => increaseQuantity(item.id)}
//                   className="w-8 h-8 bg-[#007bff] text-white rounded-full text-lg"
//                 >
//                   +
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="flex w-full text-xs font-normal space-x-3 justify-between mt-4">
//           <button
//             onClick={handleConfirm}
//             className="bg-[#28a745] text-white py-2 w-full px-4 rounded-sm"
//           >
//             Masaya Əlavə et
//           </button>
//           <button
//             onClick={onClose}
//             className="text-white w-full py-2 rounded-sm bg-[#dc3545]"
//           >
//             Kapat
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MenuItemPopup;
