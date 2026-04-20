import React, { useState } from "react";

const PasswordScreen = ({ onSuccess }) => {
  const [password, setPassword] = useState("3478");
  const [passwordNew, setPasswordNew] = useState("");

  const [isModalVisible, setModalVisible] = useState(true);
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const handleButtonClick = (value) => {
    if (value === "clear") {
      setPasswordNew("");
    } else if (value === "back") {
      setPasswordNew(password.slice(0, -1));
    } else {
      setPasswordNew((prev) => (prev.length < 6 ? prev + value : prev));
    }
  };

  const handleSubmit = () => {
    if (password === passwordNew) {
      setModalVisible(false);
      onSuccess(); // şifre doğruysa işlemi tetikle
    } else {
      alert("Password səhvdir");
    }
  };

  return (
    isModalVisible && (
      <div className="fixed inset-0 bg-gradient-to-r from-slate-400 from-slate-100 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-96 relative">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
           Şifrəni Daxil Edin!
          </h2>

          <div className="bg-gray-100 p-4 rounded-xl mb-6 text-lg font-mono tracking-widest border border-gray-300">
            {isPasswordVisible
              ? passwordNew
              : passwordNew.replace(/./g, "*") }
          </div>

          <button
            onClick={() => setPasswordVisible(!isPasswordVisible)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full mb-6 shadow-lg"
          >
            {isPasswordVisible ? "Gizlə" : "Göstər"} Şifrəni
          </button>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleButtonClick(num.toString())}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md"
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => handleButtonClick("clear")}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-md"
            >
              Təmizlə
            </button>

            <button
              onClick={() => handleButtonClick("0")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md"
            >
              0
            </button>

            <button
              onClick={() => handleButtonClick("back")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg shadow-md"
            >
              Geri
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg w-full"
          >
            Kilidi aç
          </button>
        </div>
      </div>
    )
  );
};

export default PasswordScreen;
