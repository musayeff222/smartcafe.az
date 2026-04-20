import React from "react";

const PaymentDetails = ({ label, totalPrice, increase, btn = false, value }) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{label}</span>
        {btn ? (
          <>
            <input
              type="text"
              value={value}
              readOnly
              className="border rounded-l p-2 text-right w-20"
            />
            <button
              onClick={btn}
              className="bg-green-500 text-white py-1 px-2 rounded-r focus:outline-none"
            >
              +
            </button>
          </>
        ) : (
          <div className="flex items-center">
            <div className="border font-medium py-1 px-2 rounded-l bg-gray-100">
              ₼
            </div>
            <div className="border border-l-0 rounded-r p-2 w-32 text-right bg-gray-100">
              {totalPrice}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentDetails;
