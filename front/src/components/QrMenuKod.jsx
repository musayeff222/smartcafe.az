

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import axios from 'axios';
import { base_url,domain_url } from '../api/index';
// Функция для получения заголовков авторизации
const getHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

function QrMenuKod({ tableId }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Выполнение POST-запроса для получения токена
        const response = await axios.get(
          `${base_url}/qr/${tableId}`,
          // null, // Пустое тело запроса, если не требуется данные
          getHeaders() // Передача заголовков в третьем аргументе
        );
        console.log(response.data);
        // Предполагается, что токен возвращается в формате { token: '...' }
        const token = response.data; // Убедитесь, что путь к токену верный

        // Генерация ссылки с токеном
        const generatedLink = `${domain_url}/order-details/${token}`;
        setLink(generatedLink);
      } catch (error) {
        console.error('Ошибка при получении токена:', error);
        setError('Не удалось получить данные. Пожалуйста, попробуйте позже.');
      }
    };

    fetchToken();
  }, [tableId]);

  return (
    <div className='border rounded bg-gray-50 m-4 p-3'>
      {error && <div className="text-red-500 mb-3">{error}</div>}
      {link ? (
        <>
          <QRCode value={link} size={110} />
          <input
            type="text"
            className='form-item w-full my-3 bg-white'
            value={link}
            readOnly
          />
          <button className='border w-full rounded py-2 px-3 text-sm font-medium mb-3 text-start'>
          QR kodunu saxlamaq üçün sağ klikləyin və "Şəkili fərqli saxla" düyməsini basın.
          </button>
        </>
      ) : (
        <div>Загрузка...</div>
      )}
    </div>
  );
}

export default QrMenuKod;
