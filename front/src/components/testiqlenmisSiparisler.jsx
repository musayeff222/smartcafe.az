import React from "react";

const ApprovedOrdersModal = ({ approvedOrders, onClose,pendingOrders }) => {

  console.log("pendingOrdersMOdalinIci",pendingOrders);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99999]">
    <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl mx-2 shadow-lg">
      <h3 className="text-lg font-bold text-center mb-4">Təsdiqlənmiş Sifarişlərim</h3>
      {Array.isArray(approvedOrders) && approvedOrders.length > 0 ? (
        <div>
          {/* Scrollable table container */}
          <div className=" overflow-y-auto max-h-96 space-y-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedOrders.flatMap((order) =>
                  order.stocks.map((stock, index) => (
                    <tr key={`${order.order_id}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stock.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stock.price} ₼
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>





 
          <p className="mt-4 text-xl font-bold text-center">
            Total:{" "}
            {approvedOrders.reduce((acc, order) => acc + order.total_price, 0)} ₼
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500">Təsdiqlənmiş sifarişlər yoxdur.</p>
      )}
  



  <div>
  {Array.isArray(pendingOrders) && pendingOrders.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-md mb-10">
                <h2 className="text-xl font-semibold mb-4">
                  Təsdiq olunmamış Sifarişlərim
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Miktar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Toplam
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingOrders.flatMap((order) =>
                        order.stocks.map((stock, index) => (
                          <tr key={`${order.order_id}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {stock.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stock.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stock.price} ₼
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-xl font-bold">
                  Toplam Məbləğ:{" "}
                  {pendingOrders.reduce(
                    (acc, order) => acc + order.total_price,
                    0
                  )}{" "}
                  ₼
                </p>
              </div>
            )}
  </div>




      <div className="flex justify-center mt-6">
        <button
          onClick={onClose}
          className="bg-[#dc3545] text-white py-2 px-6 rounded-md hover:bg-[#c82333] transition"
        >
          Bağla
        </button>
      </div>
    </div>
  </div>
  
  );
};

export default ApprovedOrdersModal;
