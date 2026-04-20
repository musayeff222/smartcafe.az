import React from 'react'

function GiderEkle({ setGiderEkle }) {
    return (
        <div class="absolute w-full flex items-center h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
            <div class="w-2/5  bg-white rounded m-auto overflow-hidden border">
                <div class="flex bg-gray-50 items-center justify-between py-1 px-4 uppercase border-b">
                    <h4>Giderler</h4>
                    <button className='py-1 px-3 bg-black text-white rounded' onClick={() => setGiderEkle(false)}><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form className='p-3'>
                    <div className='border rounded bg-gray-100 p-3'>
                        <div className='flex flex-wrap items-center mb-3'>
                            <h3 className='min-w-full mb-2'>Grup</h3>
                            <select className='form-item w-full' name="" id="">
                                <option value="">Genel</option>
                            </select>
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Adı/Açıklama</h3>
                            <input className='border rounded py-2 px-3 w-full outline-none text-sm font-medium' type="text" name="" id="" />
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Məbləğ</h3>
                            <input className='border rounded-l py-2 px-3 w-10/12 outline-none text-sm font-medium' type="text" name="" id="" value='0'/>
                            <div className='border border-l-0 bg-gray-300 text-center w-2/12 rounded-r py-2 px-3 '>₺</div>
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Miktar</h3>
                            <input className='border rounded py-2 px-3 w-10/12 outline-none text-sm font-medium' type="text" name="" id="" value="1"/>
                            <div  className='border border-l-0 bg-gray-300 text-center w-2/12 rounded-r py-2 px-3 '>Adet</div>
                        </div>
                        <div className='flex flex-wrap items-center mb-3'>
                            <h3 className='min-w-full mb-2'>Ödeme tip</h3>
                            <select className='form-item w-full' name="" id="">
                                <option value="">Peşin</option>
                            </select>
                        </div>
                        <div className='flex flex-wrap w-full mb-3'>
                            <h3 className='min-w-full mb-2'>Toplam</h3>
                            <input className='border rounded py-2 px-3 w-10/12 outline-none text-sm font-medium' type="text" name="" id="" value="1"/>
                            <div  className='border border-l-0 bg-gray-300 text-center w-2/12 rounded-r py-2 px-3 '>TL</div>
                        </div>
                        <div className='flex flex-wrap w-full mb-5'>
                            <h3 className='min-w-full mb-2'>Tarih/saat</h3>
                            <input className='border rounded py-2 px-3 w-2/3 mr-3 outline-none text-sm font-medium' type="date" name="" id="" />
                            <input className='border rounded py-2 px-3 w outline-none text-sm font-medium' type="time" name="" id="" />
                        </div>
                        <button className='block bg-sky-600 font-medium py-2 px-4 rounded text-white'>Saxla</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default GiderEkle