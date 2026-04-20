import React from "react";

const OrderTable = ({
  orderDetails,
  openRows,
  toggleRow,
  handleCheckboxChange,
  handleAddStock,
  handleRemoveStock2,
  setPendingRemoveData,
  setShowPasswordScreen,
}) => {
  // İsmi 12 karakterden sonra kısalt
  const truncateName = (name) => {
    if (!name) return "";
    if (name.length <= 12) return name;
    return name.substring(0, 12) + "...";
  };

  return (
    <div className="w-full overflow-x-auto overflow-y-auto max-h-[400px]">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-gray-100 border-b border-gray-300 text-xs sm:text-sm">
          <tr>
            <th className="p-1 font-semibold text-center w-10">Mətbəx</th>
            <th className="p-1 font-semibold text-left w-32">Adı</th>
            <th className="p-1 font-semibold text-center w-24">Miqdar</th>
            <th className="p-1 font-semibold text-right">Qiymət</th>
            <th className="p-1 font-semibold text-center w-10">Sil</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-sm sm:text-base">
          {orderDetails.map((item, index) => {
            const isSet = item.type === "set";
            const itemPrice = Number(item.price) || 0;

            // 📦 Set məhsulları
            if (isSet) {
              return (
                <React.Fragment key={`set-${item.id}-${index}`}>
                  <tr
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => toggleRow(item.id)}
                  >
                    <td className="p-1 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-green-500"
                        onChange={(e) => handleCheckboxChange(item, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>

                    <td className="p-1 font-semibold text-sm">{truncateName(item.name)} (Set)</td>

                    <td className="p-1 text-center">
                      <div className="flex items-center justify-center gap-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingRemoveData({
                              stockId: item.id,
                              pivot_id: item.pivot_id,
                              quantity: 1,
                              increase_boolean: false,
                            });
                            setShowPasswordScreen(true);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-l text-xs font-bold"
                        >
                          −
                        </button>

                        <input
                          type="number"
                          value={item.quantity}
                          readOnly
                          className="border-y border-gray-300 w-8 bg-white text-center py-0.5 px-1 text-sm font-medium focus:outline-none"
                          style={{ textAlign: 'center' }}
                        />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddStock(item.id);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 flex items-center justify-center rounded-r text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="text-right whitespace-nowrap p-1 text-sm">
                      {itemPrice.toFixed(2)}₼
                    </td>

                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStock2(
                          item.id,
                          item?.pivot_id,
                          item.quantity
                        );
                      }}
                      className="text-center text-green-600 hover:text-green-700 cursor-pointer p-1"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </td>

                    <td className="text-center pr-2">
                      <i
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(item.id);
                        }}
                        className={`fa-solid ${
                          openRows[item.id]
                            ? "fa-chevron-down"
                            : "fa-chevron-right"
                        } text-gray-600 text-sm sm:text-base cursor-pointer`}
                      ></i>
                    </td>
                  </tr>

                  {/* Alt elementlər */}
                  {openRows[item.id] &&
                    item.items.map((setItem, idx) => (
                      <tr
                        key={`set-item-${setItem.stock_id}-${idx}`}
                        className="bg-gray-50 text-gray-700"
                      >
                        <td className="text-center p-1">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-green-500"
                            onChange={(e) =>
                              handleCheckboxChange(setItem, e)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td colSpan="2" className="pl-2 italic p-1 text-sm">
                          → {truncateName(setItem.stock_name)}
                        </td>
                        <td className="text-center">
                          {setItem.quantity * item.quantity}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            }

            // 🧾 Normal məhsullar
            return (
              <tr
                key={`${item.id}-${index}`}
                className="hover:bg-gray-50 transition"
              >
                <td className="text-center p-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-green-500"
                    onChange={(e) => handleCheckboxChange(item, e)}
                  />
                </td>

                <td className="p-1 text-sm">
                  {truncateName(item.name)}
                  {item.count && (
                    <span className="ml-1 text-gray-600 text-xs">
                      ({item.count} {item.unit})
                    </span>
                  )}
                </td>

                <td className="text-center p-1">
                  <div className="flex items-center justify-center gap-0">
                    <button
                      onClick={() => {
                        setPendingRemoveData({
                          stockId: item.id,
                          pivot_id: item.pivot_id,
                          quantity: 1,
                          increase_boolean: false,
                        });
                        setShowPasswordScreen(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-l text-xs font-bold"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      readOnly
                      value={item.quantity}
                      className="border-y border-gray-300 w-8 bg-white text-center py-0.5 px-1 text-sm font-medium focus:outline-none"
                      style={{ textAlign: 'center' }}
                    />

                    <button
                      onClick={() => handleAddStock(item.id, item?.detail_id)}
                      className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 flex items-center justify-center rounded-r text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </td>

                <td className="text-right whitespace-nowrap p-1 text-sm">
                  {itemPrice.toFixed(2)}₼
                </td>

                <td
                  onClick={() => {
                    setPendingRemoveData({
                      stockId: item.id,
                      pivot_id: item.pivot_id,
                      quantity: item.quantity,
                      increase_boolean: false,
                    });
                    setShowPasswordScreen(true);
                  }}
                  className="text-center text-red-500 hover:text-red-600 cursor-pointer p-1"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </td>

                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
