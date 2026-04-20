import React, { useState, useEffect } from 'react';

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

const DateTimeDisplay = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border rounded p-2 text-sm bg-white hover:border-black">
      {formatDate(dateTime)}
    </div>
  );
};

export default DateTimeDisplay;
