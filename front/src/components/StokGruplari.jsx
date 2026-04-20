import React, { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "./AccessDenied";
import { base_url } from '../api/index';
// Функция для получения токена из localStorage
// Headers for GET requests
const getGetHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Headers for POST and PUT requests (multipart/form-data)
const getPostPutHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    // 'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
  }
});

function StokGruplari({ setShowPopup, editGroupid, seteditGroupid }) {
  const [yeniStok, setYeniStok] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    // image: null,
    show_on_qr_menu: true,
    kitchen_printer_active: false,
    bar_printer_active: false,
    color: "#FF5733",
  });
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showOptions, setShowOptions] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false); 
  // Загрузка данных всех групп
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(
          `${base_url}/stock-groups`,
          getGetHeaders()
        );

   
        
        setGroups(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке данных групп", error);
      }
    };

    fetchGroups();
  }, []);

  // Обработка изменений в полях формы
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Обработка загрузки файла
  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      image: e.target.files[0] || null, // Сохраняем выбранный файл или null, если файл не выбран
    }));
  };

  // Преобразование данных для отправки
  const prepareFormData = () => {
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('image', formData.image);
    formDataToSend.append('show_on_qr_menu', formData.show_on_qr_menu.toString());
    formDataToSend.append('kitchen_printer_active', formData.kitchen_printer_active.toString());
    formDataToSend.append('bar_printer_active', formData.bar_printer_active.toString());
    formDataToSend.append('color', formData.color);
    return formDataToSend;
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = {
        ...formData,
        show_on_qr_menu: formData.show_on_qr_menu,
        kitchen_printer_active: formData.kitchen_printer_active,
        bar_printer_active: formData.bar_printer_active,
      };
      console.log(formData);

      try {
        if (editMode) {
          // Обновление существующей группы
          await axios.put(
            `${base_url}/stock-groups/${editingId}`,
            formDataToSend,
            getPostPutHeaders()
          );
          console.log('Group updated successfully');
        } else {
          // Создание новой группы
          await axios.post(
            `${base_url}/stock-groups`,
            formDataToSend,
            getPostPutHeaders()
          );
          console.log('Group created successfully');
        }
      } catch (error) {
        // Обработка ошибок
        if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
          setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error('An error occurred:', error);
          
      }
        // Дополнительные действия, такие как отображение сообщения пользователю
       
      }
      // Сброс формы и состояния после отправки
      setFormData({
        name: "",
        image: null,
        show_on_qr_menu: true,
        kitchen_printer_active: false,
        bar_printer_active: false,
        color: "#FF5733",
      });
      setYeniStok(true);
      setEditMode(false);
      setEditingId(null);
    
      // Перезагрузка списка групп
      const response = await axios.get(
        `${base_url}/stock-groups`,
        getGetHeaders()
      );
      setGroups(response.data);
    
      // Возвращаемся к списку после создания или редактирования
      setYeniStok(false);
    } catch (error) {
      console.error("Ошибка при отправке формы", error);
    }
  };
  

  // Функция для редактирования данных
  const handleEdit = async (id) => {
    try {
      const response = await axios.get(
        `${base_url}/stock-groups/${id}`,
        getGetHeaders()
      );
      setEditingId(id);
      setFormData({
        ...response.data,
        image: null, // Замените это, если у вас есть способ предварительного просмотра изображения
      });
      setYeniStok(false);
      setEditMode(true);
      setYeniStok(true);
      seteditGroupid(null);
    } catch (error) {
      console.error("Ошибка при загрузке данных для редактирования", error);
    }
  };

  useEffect(() => {
    if (editGroupid) {
      handleEdit(editGroupid);
    }
  }, [editGroupid]);

  // Функция для удаления данных
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${base_url}/stock-groups/${id}`,
        getGetHeaders()
      );
      // Перезагрузка списка групп после удаления
      const response = await axios.get(
        `${base_url}/stock-groups`,
        getGetHeaders()
      );
      setGroups(response.data);
      setShowOptions(null);
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
        setAccessDenied(true); // Set access denied if response status is 403
    } else {
      
      // console.error("Ошибка при удалении группы", error);
        
    }
    }
  };
  if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
  return (
    <div className="absolute w-full h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
      <div className="w-4/5 h-full bg-white rounded m-auto overflow-y-scroll border">
        <div className="flex items-center bg-gray-50 justify-between py-1 px-4 uppercase border-b">
          <h4>{editMode ? "Qrupu redaktə edin" : "Yeni qrup əlavə edin"}</h4>
          {!yeniStok && (
            <button className="btn-ad" onClick={() => setYeniStok(true)}>
              + Yeni Qrup
            </button>
          )}
          {yeniStok && !editMode && (
            <button
              onClick={() => setYeniStok(false)}
              className="ml-auto mr-2 bg-gray-700 flex items-center gap-1 font-medium py-2 px-4 rounded text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="currentColor"
                className="bi bi-chevron-double-left"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                />
                <path
                  fillRule="evenodd"
                  d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                />
              </svg>
              Geri
            </button>
          )}
          <button
            className="py-1 px-3 bg-black text-white rounded"
            onClick={() => setShowPopup(null)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="p-3">
          {yeniStok ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-gray-700">Adi</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded py-2 px-3"
                  required
                />
              </div>
              {/* <div className="mb-3">
                <label className="block text-gray-700">Изображение</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                  className="w-full border rounded py-2 px-3"
                />
              </div> */}
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="show_on_qr_menu"
                    checked={formData.show_on_qr_menu}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Qr menuda göstərilsin
                </label>
              </div>
              {/* <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="kitchen_printer_active"
                    checked={formData.kitchen_printer_active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Mutfak yazıcı
                </label>
              </div>
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="bar_printer_active"
                    checked={formData.bar_printer_active}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Bar yazıcı
                </label>
              </div>
              <div className="mb-3">
                <label className="block text-gray-700">Цвет</label>
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-1/2 border rounded px-3"
                />
              </div> */}
              <button
                type="submit"
                className="py-2 px-4 bg-blue-500 text-white rounded"
              >
                {editMode ? "Güncələ" : "Yarat"} qrupu
              </button>
            </form>
          ) : (
            <table className="w-full text-left border rounded bg-[#fafbfc] mb-3">
              <thead className="border-b border-gray-500 bg-[#e5e5e5]">
                <tr>
                  <th className="p-3 font-semibold">Adi</th>
                  {/* <th className="p-3 font-semibold">Изображение</th> */}
                  <th className="p-3 font-semibold">Detal</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {groups.map((group) => (
                  <tr key={group.id} className="relative">
                    <td className="px-3 py-2">{group.name}</td>
               
                    <td className="px-3 py-2">
                      <button
                        className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() =>
                          setShowOptions(
                            showOptions === group.id ? null : group.id
                          )
                        }
                      >
                        Detal
                      </button>
                      {showOptions === group.id && (
                        <div className="absolute top-full right-5 bg-white border rounded shadow-lg mt-2 z-10">
                          <button
                            className="block px-4 py-2 text-red-500 hover:bg-gray-100 w-full text-left"
                            onClick={() => handleDelete(group.id)}
                          >
                            Sil
                          </button>
                          <button
                            className="block px-4 py-2 text-blue-500 hover:bg-gray-100 w-full text-left"
                            onClick={() => {
                              handleEdit(group.id);
                              setShowOptions(null); // Закрываем меню после выбора
                            }}
                          >
                            Düzənlə
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default StokGruplari;


