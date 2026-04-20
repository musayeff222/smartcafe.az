// import React, { useState } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import EditMasaPopup from './EditMasaPopup';
// import AccessDenied from './AccessDenied';
// import { base_url } from '../api/index';
// const API_TABLES_URL = `${base_url}/tables`;
// const getHeaders = () => ({
//     headers: {
//         'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//     }
// });
// function MasaModalMain({ type, setModalMain ,tableItemData,groups}) {
//   const [editMasa, setEditMasa] = useState(null);
//   const [masas, setMasas] = useState([]);
//   const [accessDenied, setAccessDenied] = useState(false); 
//   console.log(tableItemData,'print');

//   const handleEdit = (masa) => {
//     setEditMasa(masa);
// };
// console.log(tableItemData);
//     // Delete orders
//     const handleDeleteMasa = async () => {
//       try {
//           await axios.delete(`${base_url}/tables/${tableItemData.id}/cancel-order`, getHeaders());
//           // fetchTableOrders()
//           window.location.reload()
//           // navigate('/masalar')
//       } catch (error) {
//         if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
//           setAccessDenied(true); // Set access denied if response status is 403
//       } else {
         
//           console.error('Error deleting masa:', error);
         
//       }
//       }
//   };
// const handleEditMasa = async (updatedMasa) => {
//   try {
//       await axios.put(`${API_TABLES_URL}/${updatedMasa.id}`, updatedMasa, getHeaders());
//       setMasas(masas.map(masa =>
//           masa.id === updatedMasa.id ? updatedMasa : masa
//       ));
//       setEditMasa(null);
//   } catch (error) {
//     if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
//       setAccessDenied(true); // Set access denied if response status is 403
//   } else {
     
//       console.error('Error updating masa:', error);
//   }
//   }
// };
// const handleSave = (updatedMasa) => {
//   handleEditMasa(updatedMasa);
// };
// // console.log(tableItemData,'h');
// if (accessDenied) return <AccessDenied />;
//   return (
//     <>
//       {!tableItemData.is_available && (
//         <div>
//           <div className="bg-gray-200 font-semibold text-blue-800 py-1 px-4">
//             <h4>Hesap detayı</h4>
//           </div>
//           <div className="p-4 flex flex-wrap gap-3">
//             <Link to="/masa-siparis/1" className="masa-detail-item text-yellow-500 hover:border-yellow-500">
//               <div className="w-full text-center">
//                 <i className="fa-solid fa-right-long"></i>
//                 <h4>Hesap detayı</h4>
//               </div>
//             </Link>
//             {
//               tableItemData.total_price ? (
//             <div onClick={() => setModalMain("hesapKes")} className="masa-detail-item text-green-500 hover:border-green-500">
//               <div className="w-full text-center">
//                 <i className="fa-solid fa-money-bills"></i>
//                 <h4>Hesap kes</h4>
//               </div>
//             </div>

//               ):(
//                 <div onClick={() => handleDeleteMasa()} className="masa-detail-item text-red-500 hover:border-red-500">
//                 <div className="w-full text-center">
//                 <i className="fa-regular fa-circle-xmark"></i>
//                   <h4>Iptal et</h4>
//                 </div>
//               </div>
//               )
//             }
//             <div onClick={() => setModalMain("masaDegistir")} className="masa-detail-item text-blue-500 hover:border-blue-500">
//               <div className="w-full text-center">
//                 <i className="fa-solid fa-arrow-right-arrow-left"></i>
//                 <h4>Masa değiştir</h4>
//               </div>
//             </div>
//             <div onClick={() => setModalMain("masaBirlesdir")} className="masa-detail-item hover:border-black">
//               <div className="w-full text-center">
//                 <i className="fa-solid fa-arrows-to-circle"></i>
//                 <h4>Masa birleştir</h4>
//               </div>
//             </div>

//             <div onClick={() => setModalMain("OncedenOde")} className="masa-detail-item text-green-400 hover:border-green-500">
//               <div className="w-full text-center">
//                 <i className="fa-solid fa-money-bills"></i>
//                 <h4>Önceden öde</h4>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div>
//         <div className="bg-gray-200 font-semibold text-blue-800 py-1 px-4">
//           <h4>Masa</h4>
//         </div>
//         <div className="p-4 flex flex-wrap gap-3">
//           <div  className="masa-detail-item hover:border-black">
//             <div onClick={()=>handleEdit(tableItemData)} className="w-full text-center">
//               <i className="fa-solid fa-pen"></i>
//               <h4>Masani Yeniləyin</h4>
//             </div>
//           </div>
//           <div onClick={() => setModalMain("qrMenuKod")} className="masa-detail-item hover:border-black">
//             <div className="w-full text-center">
//               <i className="fa-solid fa-qrcode"></i>
//               <h4>Qr menü kod</h4>
//             </div>
//           </div>
//           <Link to={`/masa-tanimlari`} className="masa-detail-item hover:border-black">
//             <div className="w-full text-center">
//               <i className="fa-solid fa-plus"></i>
//               <h4>Yeni masa əlavə edin</h4>
//             </div>
//           </Link>
//         </div>
//       </div>



//       {editMasa &&
//                 <EditMasaPopup
//                     masa={editMasa}
//                     onSave={handleSave}
//                     onClose={() => setEditMasa(null)}
//                     groups={groups}
//                 />
//             }
//     </>
//   );
// }

// export default MasaModalMain;

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import EditMasaPopup from './EditMasaPopup';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';

const API_TABLES_URL = `${base_url}/tables`;
const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function MasaModalMain({ type, setModalMain, tableItemData, groups }) {
    const [editMasa, setEditMasa] = useState(null);
    const [masas, setMasas] = useState([]);
    const [accessDenied, setAccessDenied] = useState(false);

    const handleEdit = (masa) => {
        setEditMasa(masa);
    };

    // Delete orders
    const handleDeleteMasa = async () => {
        try {
            await axios.delete(`${base_url}/tables/${tableItemData.id}/cancel-order`, getHeaders());
            window.location.reload();
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true);
            } else {
                console.error('Error deleting masa:', error);
            }
        }
    };

    const handleEditMasa = async (updatedMasa) => {
        try {
            await axios.put(`${API_TABLES_URL}/${updatedMasa.id}`, updatedMasa, getHeaders());
            setMasas(masas.map(masa =>
                masa.id === updatedMasa.id ? updatedMasa : masa
            ));
            setEditMasa(null);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true);
            } else {
                console.error('Error updating masa:', error);
            }
        }
    };

    const handleSave = (updatedMasa) => {
        handleEditMasa(updatedMasa);
    };

    if (accessDenied) return <AccessDenied />;

    return (
        <div className="p-4">
            {!tableItemData.is_available && (
                <div>
                    <div className="bg-gray-200 font-semibold text-blue-800 py-1 px-4">
                        <h4>Hesap açiqlama</h4>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                        <Link to="/masa-siparis/1" className="masa-detail-item text-yellow-500 hover:border-yellow-500 p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <div className="w-full">
                                <i className="fa-solid fa-right-long text-xl mb-2"></i>
                                <h4 className="text-sm font-semibold">Hesap açiqlama</h4>
                            </div>
                        </Link>
                        {
                            tableItemData.total_price ? (
                                <div onClick={() => setModalMain("hesapKes")} className="masa-detail-item text-green-500 hover:border-green-500 p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                    <div className="w-full">
                                        <i className="fa-solid fa-money-bills text-xl mb-2"></i>
                                        <h4 className="text-sm font-semibold">Hesab</h4>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => handleDeleteMasa()} className="masa-detail-item text-red-500 hover:border-red-500 p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                                    <div className="w-full">
                                        <i className="fa-regular fa-circle-xmark text-xl mb-2"></i>
                                        <h4 className="text-sm font-semibold">Ləğv et</h4>
                                    </div>
                                </div>
                            )
                        }
                        <div onClick={() => setModalMain("masaDegistir")} className="masa-detail-item text-blue-500 hover:border-blue-500 p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <div className="w-full">
                                <i className="fa-solid fa-arrow-right-arrow-left text-xl mb-2"></i>
                                <h4 className="text-sm font-semibold">Masa deyişdir</h4>
                            </div>
                        </div>
                        <div onClick={() => setModalMain("masaBirlesdir")} className="masa-detail-item hover:border-black p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <div className="w-full">
                                <i className="fa-solid fa-arrows-to-circle text-xl mb-2"></i>
                                <h4 className="text-sm font-semibold">Masa birləştir</h4>
                            </div>
                        </div>
                        <div onClick={() => setModalMain("OncedenOde")} className="masa-detail-item text-green-400 hover:border-green-500 p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                            <div className="w-full">
                                <i className="fa-solid fa-money-bills text-xl mb-2"></i>
                                <h4 className="text-sm font-semibold">Əvvəlcədən ödə</h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4">
                <div className="bg-gray-200 font-semibold text-blue-800 py-1 px-4">
                    <h4>Masa</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    <div className="masa-detail-item hover:border-black p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <div onClick={() => handleEdit(tableItemData)} className="w-full">
                            <i className="fa-solid fa-pen text-xl mb-2"></i>
                            <h4 className="text-sm font-semibold">Masa Deyişdir</h4>
                        </div>
                    </div>
                    <div onClick={() => setModalMain("qrMenuKod")} className="masa-detail-item hover:border-black p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <div className="w-full">
                            <i className="fa-solid fa-qrcode text-xl mb-2"></i>
                            <h4 className="text-sm font-semibold">Qr menü kod</h4>
                        </div>
                    </div>
                    <Link to={`/masa-tanimlari`} className="masa-detail-item hover:border-black p-2 flex flex-col items-center text-center border border-gray-300 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <div className="w-full">
                            <i className="fa-solid fa-plus text-xl mb-2"></i>
                            <h4 className="text-sm font-semibold">Yeni masa əlavə edin</h4>
                        </div>
                    </Link>
                </div>
            </div>

            {editMasa &&
                <EditMasaPopup
                    masa={editMasa}
                    onSave={handleSave}
                    onClose={() => setEditMasa(null)}
                    groups={groups}
                />
            }
        </div>
    );
}

export default MasaModalMain;
