import React from "react";
import user from "../img/dontuser.png";
import { logOut } from "../action/MainAction";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const DontActiveAcount = ({ logOut, sil }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const handleClick = async () => {
    await logOut();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          type="button"
          onClick={() => {
            handleClick();
            sil(false);
          }}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          Г—
        </button>
        <div className="text-center mb-6">
          <img src={user} alt="" className="w-20 h-20 mx-auto mb-4" />
        </div>
        <p className="text-center text-lg font-medium text-gray-800">
          {t("account.inactive", { phone: "+994 50 424 38 92" })}
        </p>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({ token: state.Data.token });
const mapDispatchToProps = { logOut };
export default connect(mapStateToProps, mapDispatchToProps)(DontActiveAcount);
