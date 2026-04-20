import React from "react";

const TableBodyRow = ({ stock, onRemove, onDecrease, onIncrease }) => {
  return (
    <tr className="font-medium">
      <td onClick={onRemove} className="text-red-500 p-3 cursor-pointer">
        <i className="fa-solid fa-trash-can"></i>
      </td>
      <td className="p-3">{stock.name}</td>
      <td className="p-3 flex items-center">
        <button
          onClick={onDecrease}
          className="bg-red-500 font-medium text-center py-2 w-8 rounded-l text-white"
        >
          -
        </button>
        <input
          type="number"
          value={stock.quantity}
          className="p-2 text-right border-y text-[15px] w-20"
          readOnly
        />
        <button
          onClick={onIncrease}
          className="bg-green-500 font-medium text-center py-2 w-8 rounded-r text-white"
        >
          +
        </button>
      </td>
      <td className="p-3 text-right">{stock.price} ₼</td>
    </tr>
  );
};

export default TableBodyRow;
