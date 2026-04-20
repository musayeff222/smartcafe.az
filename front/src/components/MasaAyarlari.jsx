

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { base_url } from '../api/index';
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    };
};

function MasaAyarlari({ setMasaAyarlar }) {
    const [colorEmpty, setColorEmpty] = useState("");
    const [colorBooked, setColorBooked] = useState("");

    const handleColorChange = (e) => {
        const { name, value } = e.target;
        if (name === 'empty_table_color') {
            setColorEmpty(value);
        } else if (name === 'booked_table_color') {
            setColorBooked(value);
        }
    };

    const saveColors = async () => {
        localStorage.setItem('empty_table_color', colorEmpty);
        localStorage.setItem('booked_table_color', colorBooked);
        
        window.location.reload();
    };

    const removeColors = async () => {
        localStorage.removeItem('empty_table_color');
        localStorage.removeItem('booked_table_color');
        
        window.location.reload();
    };

    useEffect(() => {
        const fetchAyarlar = async () => {
            try {
                const response = await axios.get(
                    `${base_url}/own-restaurants`,
                    getAuthHeaders()
                );
                const data = response.data;
                setColorEmpty(localStorage.getItem('empty_table_color') || data.empty_table_color);
                setColorBooked(localStorage.getItem('booked_table_color') || data.booked_table_color);
            } catch (error) {
                console.error("Error fetching settings", error);
            }
        };
        fetchAyarlar();
    }, []);

    return (
        <div className="absolute w-full flex items-center h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
            <div className="w-full max-w-md bg-white rounded m-auto overflow-hidden border">
                <div className="flex items-center bg-gray-50 justify-between py-1 px-4 uppercase border-b">
                    <h4>Masa 4</h4>
                    <button
                        className='py-1 px-3 bg-black text-white rounded'
                        onClick={() => setMasaAyarlar(false)}
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className='p-5'>
                    <div className="flex flex-wrap gap-6 mb-8">
                        <div className='w-32'>
                            <h3 className='mb-3 text-gray-600'>Boş masa renk</h3>
                            <input
                                name="empty_table_color"
                                value={colorEmpty}
                                className='w-full bg-white border rounded p-1 h-9'
                                type="color"
                                onChange={handleColorChange}
                            />
                        </div>
                        <div className='w-32'>
                            <h3 className='mb-3 text-gray-600'>Dolu masa renk</h3>
                            <input
                                name="booked_table_color"
                                value={colorBooked}
                                className='w-full bg-white border rounded p-1 h-9'
                                type="color"
                                onChange={handleColorChange}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <button
                            className='inline-block bg-sky-600 font-medium py-2 px-4 rounded text-white'
                            onClick={saveColors}
                        >
                            Saxla
                        </button>
                        <button
                            className='inline-block bg-red-600 font-medium py-2 px-4 rounded text-white'
                            onClick={removeColors}
                        >
                            Temizle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MasaAyarlari;
