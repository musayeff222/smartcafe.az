import React from "react";
import { useNavigate } from "react-router-dom";
import PasswordScreen from "../../components/ScreenPassword3";
import ScreenPassword from "../../components/ScreenPassword2";



const TotalPriceHesab = ({ totalPrice, setHesabKes, setHandleModal, handlePrint, handleDeleteMasa }) => {
  const navigate = useNavigate();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
const [isPasswordConfirmed, setIsPasswordConfirmed] = React.useState(false);

  return (
    <div className="flex gap-2 mt-4">
      {totalPrice && (
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
  onClick={() => {
    setIsPasswordModalOpen(true);
  }}
  className="bg-gray-800 text-white py-2 px-4 rounded flex items-center gap-2"
>
  Ləğv edin
</button>


{isPasswordModalOpen && (
  <PasswordScreen
    onSuccess={() => {
      handleDeleteMasa();
      setIsPasswordModalOpen(false);
      navigate("/masalar");
    }}
  />
)}

    </div>
  );
};

export default TotalPriceHesab;
