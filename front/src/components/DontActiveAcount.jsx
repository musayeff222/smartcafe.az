import React from "react";
import user from "../img/dontuser.png";
import { logOut } from '../action/MainAction';
import { connect } from 'react-redux';
import { useNavigate } from "react-router-dom";
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
      }
  };
};
const DontActiveAcount = ({ token, logOut,sil }) => {
  const navigate = useNavigate();
  const handleClick = async () => {
    await logOut();
    localStorage.removeItem("token");
    localStorage.removeItem('role');
    navigate("/");
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button onClick={()=>(handleClick(),sil(false))}
          // onClick={() => onClose(false)}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="text-center mb-6">
          <img
            src={user}
            alt="Access Denied"
            className="w-20 h-20 mx-auto mb-4"
          />
        </div>
        <div className="text-center text-lg font-medium text-gray-800">
          Hesabınız aktiv deyil. Hesabınızı aktivləşdirmək üçün{" "}
          <a
            title="+994 50 424 38 92"
            target="_blank"
            href="https://wa.me/+994504243892"
            className="text-blue-500 underline hover:text-blue-700"
          >
            +994 50 424 38 92
          </a>{" "}
          ilə əlaqə saxlayın.
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  token: state.Data.token,
});

const mapDispatchToProps = {
  logOut,
};

export default connect(mapStateToProps, mapDispatchToProps)(DontActiveAcount);
// export default ;
