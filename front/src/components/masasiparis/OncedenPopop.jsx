import React from "react";
import OncedenOde from "../OncedenOde";

const OncedenPopop = ({
  odersIdMassa,
  setrefreshfetch,
  setoncedenodePopop,
  name,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
        <div className="bg-gray-200 p-4 flex justify-between items-center border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {name} onceden
          </h3>
          <button
            onClick={() => setoncedenodePopop(false)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          <OncedenOde
            odersId={odersIdMassa}
            setrefreshfetch={setrefreshfetch}
          />
        </div>
      </div>
    </div>
  );
};

export default OncedenPopop;
