

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate, useParams } from 'react-router-dom';
// import AccessDenied from './AccessDenied';
// import { base_url } from '../api/index';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchTableOrderStocks } from '../redux/stocksSlice';
// const getHeaders = () => ({
//   headers: {
//     'Authorization': `Bearer ${localStorage.getItem('token')}`,
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });
// function HesapKes({  totalAmount,orderStocks }) {
//   console.log("totalAmount",totalAmount);
//   console.log("orderStocks",orderStocks);
  
//   const { id } = useParams();
//   const dispatch = useDispatch();

//   const [isCariMusteriSelected, setIsCariMusteriSelected] = useState(false);
//   const [isParcaParcaOde, setIsParcaParcaOde] = useState(false);
//   const [numberOfPeople, setNumberOfPeople] = useState(2);
//   const [discount, setDiscount] = useState(""); 
//   const [sum, setSum] = useState(Array(numberOfPeople).fill(0));
//   const [selectedPaymentType, setSelectedPaymentType] = useState('');
//   const [customerOptions, setCustomerOptions] = useState([]);
//   const [selectedCustomerId, setSelectedCustomerId] = useState(null);

//   const discountedTotal = totalAmount * (1 - discount / 100);
  

  
//   useEffect(() => {
//     dispatch(fetchTableOrderStocks(id));
//   }, [id, dispatch]);



//   const { allItems, orders, loading, error } = useSelector((state) => state.stocks);
//   const { shares, orderId, items: orderItems } = useSelector((state) => state.order);


//   console.log("SHARES STATE:", shares);

// // const tableOrders = useSelector((state) => state.stocks.tableOrders);
// // const loading = useSelector((state) => state.stocks.loading);
// // const error = useSelector((state) => state.stocks.error);


// if (orders && orders.length > 0) {
//   console.log("orders2", orders[0].order_id);
// } else {
//   console.log("orders2: Order verisi henüz gelmedi veya boş.");
// }



//   const navigate = useNavigate()
//   const [accessDenied, setAccessDenied] = useState(false); 
//   useEffect(() => {
//     if (isCariMusteriSelected) {
//       axios.get(`${base_url}/customers`, getHeaders())
//         .then(response => {
//           setCustomerOptions(response.data);
//         })
//         .catch(error => {
//           console.error('Error fetching customers:', error);
//         });
//     }
//   }, [isCariMusteriSelected]);


//   useEffect(() => {
//     if (isParcaParcaOde) {
//       updateSumArray(numberOfPeople);
//     }
//   }, [discount, numberOfPeople, isParcaParcaOde]);

//   const handlePaymentTypeChange = (type) => {
//     setSelectedPaymentType(type);
//     setIsCariMusteriSelected(type === 'musteriye-aktar');
//     setIsParcaParcaOde(type === 'parca-ode');
//     if (type === 'parca-ode') {
//       setNumberOfPeople(2); // Set initial value for dynamic selection
//       updateSumArray(2); // Update the sum state to split the total amount
//     } else {
//       setNumberOfPeople(0); 
//     }
//   };

//   const updateSumArray = (peopleCount) => {
//     let amounts = new Array(peopleCount).fill(0);
//     let baseAmount = Math.floor(discountedTotal / peopleCount * 100) / 100;
//     amounts.fill(baseAmount);
//     let totalDistributed = baseAmount * peopleCount;

//     if (totalDistributed < discountedTotal) {
//       amounts[peopleCount - 1] += (discountedTotal - totalDistributed);
//     }

//     setSum(amounts.map(amount => parseFloat(amount.toFixed(2))));
//   };

//   const handleNumberOfPeopleChange = (newNumber) => {
//     setNumberOfPeople(newNumber);
//     updateSumArray(newNumber); // Update sums to evenly divide the total amount
//   };

//   const handleSumChange = (index, value) => {
//     const newSum = [...sum];
//     newSum[index] = parseFloat(value) || 0;
//     setSum(newSum);
//   };

//   const totalSum = sum.reduce((acc, curr) => acc + curr, 0);
//   const sumMessage = totalSum > discountedTotal
//     ? 'Toplam Məbləğ aşıldı!'
//     : totalSum < discountedTotal
//     ? `Toplam Məbləğ eksik! ${Math.abs(discountedTotal - totalSum).toFixed(2)} eksik`
//     : '';

//     const handleSubmit = async (event) => {
//       event.preventDefault();
    
//       if (discountedTotal <= 0) {
//         alert('İndirimli məbləğ sıfır və ya mənfi ola bilməz!');
//         return;
//       }
    
//       if (selectedPaymentType === 'parca-ode' && sum.some(amount => amount <= 0)) {
//         alert('Bütün hissələr üçün etibarlı məbləğlər daxil edin.');
//         return;
//       }
    
//       if (selectedPaymentType === 'musteriye-aktar' && !selectedCustomerId) {
//         alert('Zəhmət olmasa "Cari müştəriyə köçür" üçün müştəri seçin.');
//         return;
//       }
    
//       const mappedItems = (share) =>
//         Array.isArray(share.items)
//           ? share.items.map(item => ({
//               name: item.name,
//               quantity: item.quantity,
//               price: item.price,
//             }))
//           : [];
      
//       const paymentData = {
//         shares: []
//       };
    
//       if (selectedPaymentType === 'parca-ode') {
//         paymentData.shares = sum.map((amount, index) => ({
//           type: 'cash',
//           amount: parseFloat(amount),
//           customer_id: null,
//           items: mappedItems(shares[index])
//         }));
//       } else {
//         paymentData.shares.push({
//           type:
//             selectedPaymentType === 'pesin'
//               ? 'cash'
//               : selectedPaymentType === 'bank-havale'
//               ? 'bank'
//               : 'customer_balance',
//           amount: parseFloat(discountedTotal.toFixed(2)),
//           customer_id: selectedCustomerId || null,
//           items: mappedItems(shares[0]) // ya da sadece ilk share'den al
//         });
//       }
      
    
//       try {
//         await axios.post(`${base_url}/order/${orderId}/payments`, paymentData, getHeaders());
//         alert('Ödəniş uğurla icra olundu.');
//         navigate('/masalar')
//         window.location.reload();
//       } catch (error) {
//         if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
//           setAccessDenied(true);
//         } else {
//           console.error('Error submitting payment:', error);
//           alert('Ödənişi emal edərkən xəta baş verdi.');
//         }
//       }
//     };
    
//   if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
//   return (
//     <form onSubmit={handleSubmit}>
//       <div className='border rounded bg-gray-50 m-4 p-3'>
//         <div className='flex items-center'>
//           <div className='w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5'>
//             Toplam Məbləğ
//           </div>
//           <input
//             className='w-2/3 h-14 px-6 border border-l-0 rounded-r'
//             type='text'
//             value={orderId.total_price}
//             readOnly
//           />
//         </div>
//       </div>
//       <div className='border rounded bg-green-50 m-4 p-3'>
//         <div className='flex items-center'>
//           <div className='w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5'>
//           Artıq ödənilib
//           </div>
//           <input
//             className='w-2/3 h-14 px-6 border border-l-0 rounded-r'
//             type='text'
//             value={orderId.total_prepayment}
//             readOnly
//           />
//         </div>
//       </div>
//       <div className='border rounded bg-gray-50 m-4 p-3'>
//         <div className='flex items-center'>
//         <div className='w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5'>
//             İndirim (%)
//           </div>
//           <input
//             className='w-2/3 h-14 px-6 border border-l-0 rounded-r'
//             type='number'
//             min="0"
//             max="100"
//             step="1"
//             value={discount}
//             onChange={(e) => setDiscount(parseFloat(e.target.value) )}
//           />
//           <div className='w-1/3 flex h-14 border text-red-400 rounded-l items-center px-2 bg-gray-100 gap-5'>
//           Qalıq
//           </div> 
//           <input
//             className='w-2/3 h-14 px-6 border border-l-0 rounded-r'
//             type='text'
//             value={totalAmount}
//             readOnly
//           />
//         </div>
//       </div>
//       <div className='border rounded bg-blue-50 m-4 p-3'>
//         <div className='flex items-center'>
//           <div className='w-1/3 flex h-14 border rounded-l items-center px-2 bg-gray-100 gap-5'>
//             İndirimli Toplam
//           </div>
//           <input
//             className='w-2/3 h-14 px-6 border border-l-0 rounded-r'
//             type='text'
//             value={discountedTotal.toFixed(2)}
//             readOnly
//           />
//         </div>
//       </div>
//       <div className='mx-4 flex flex-col gap-2'>
//         {['pesin', 'bank-havale', 'musteriye-aktar', 'parca-ode'].map((type) => (
//           <label
//             key={type}
//             className={`flex items-center p-2 border rounded bg-white shadow-sm ${selectedPaymentType === type ? 'bg-yellow-100 border-yellow-500' : ''}`}
//           >
//             <input
//               type='radio'
//               name='odemeType'
//               id={type}
//               checked={selectedPaymentType === type}
//               onChange={() => handlePaymentTypeChange(type)}
//               className='mr-2'
//             />
//             {type === 'pesin' && 'Nağd'}
//             {type === 'bank-havale' && 'Bank Kartına '}
//             {type === 'musteriye-aktar' && 'Müştəri hesabına '}
//             {type === 'parca-ode' && 'Hissə hissə ödə'}
//           </label>
//         ))}
//       </div>
//       {isCariMusteriSelected && (
//         <div id="aktar" className="p-4 bg-white shadow-md rounded-lg mt-4">
//           <p className="text-lg font-semibold mb-2">Müştərilər</p>
//           <select
//             className="form-select block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//             onChange={(e) => setSelectedCustomerId(e.target.value)}
//             value={selectedCustomerId || ''}
//           >
//             <option value="">Seçiniz</option>
//             {customerOptions.map(customer => (
//               <option key={customer.id} value={customer.id}>{customer.name}</option>
//             ))}
//           </select>
//         </div>
//       )}

//       {isParcaParcaOde && (
//         <div id="parcaode" className="p-4 bg-white shadow-md rounded-lg mt-4">
//           <div className="flex flex-wrap gap-2 mb-4">
//             {[2, 3, 4, 5].map((num) => (
//               <div
//                 key={num}
//                 onClick={() => handleNumberOfPeopleChange(num)}
//                 className={`flex-1 min-w-[100px] p-4 border border-gray-300 rounded-lg bg-gray-50 text-center cursor-pointer ${numberOfPeople === num ? 'bg-yellow-100' : ''}`}
//               >
//                 {num} kişi
//               </div>
//             ))}
//           </div>
//           <div className="mb-4">
//             <div className="grid grid-cols-3 gap-4 text-center font-semibold border-b border-gray-300 pb-2 mb-2">
//               <div>No</div>
//               <div>Məbləğ</div>
//               <div>Ödeme</div>
//             </div>
//             <div>
//               {sum.map((_, index) => (
//                 <div key={index} className="grid grid-cols-3 gap-4 items-center border-b border-gray-200 py-2">
//                   <div className="flex items-center justify-center border border-gray-300 p-2 rounded">{index + 1}.</div>
//                   <input
//                     type="number"
//                     step="0.1"
//                     value={sum[index]}
//                     onChange={(e) => handleSumChange(index, e.target.value)}
//                     className="border border-gray-300 rounded p-2 w-full"
//                   />
//                   <select
//                     className="border border-gray-300 rounded p-2 w-full"
//                   >
//                     <option>Peşin</option>
//                     <option>Banka havalesi</option>
//                   </select>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {sumMessage && (
//             <div className={`p-2 mt-4 text-white font-semibold ${totalSum > totalAmount ? 'bg-red-600' : 'bg-yellow-600'}`}>
//               {sumMessage}
//             </div>
//           )}
//         </div>
//       )}

//       <button className='block w-[calc(100%-32px)] bg-sky-600 font-medium mx-4 mb-1 py-2 px-4 rounded text-white'>
//         Hesap kes
//       </button>
//     </form>
//   );
// }

// export default HesapKes;
