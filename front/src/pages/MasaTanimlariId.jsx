import React, { useState } from "react";

function UpdateMasa() {
  // Изначальные значения состояния
  const [displayOrder, setDisplayOrder] = useState(1);
  const [tableName, setTableName] = useState("Мой Стол");
  const [group, setGroup] = useState("");

  // Функция для обработки сохранения
  const handleSave = () => {
    // Логика для сохранения данных
    console.log("Saving:", { displayOrder, tableName, group });
  };

  return (
    <>
      <form className="bg-gray-50 rounded border w-1/3 p-3">
        <div className="flex flex-wrap mb-5">
          <h3 className="min-w-full mb-2">Gösterim sıra</h3>
          <input
            className="border rounded py-2 px-3 w-1/4 outline-none text-sm font-medium"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap mb-5">
          <h3 className="min-w-full mb-2">Masa adı</h3>
          <input
            className="border rounded py-2 px-3 w-full outline-none text-sm font-medium"
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap mb-5">
          <h3 className="min-w-full mb-2">Grup</h3>
          <select
            className="border rounded py-2 px-3 w-full outline-none text-sm font-medium"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">Hamısı</option>
            <option value="Group 1">Group 1</option>
            <option value="Group 2">Group 2</option>
            {/* Добавьте здесь другие опции по необходимости */}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-sky-600 font-medium py-2 px-4 rounded text-white"
            onClick={handleSave}
          >
            Saxla
          </button>
        </div>
      </form>
    </>
  );
}

export default UpdateMasa;
