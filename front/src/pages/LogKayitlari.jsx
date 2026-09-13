import React from 'react'
import { Helmet } from 'react-helmet'

function LogKayitlari() {
    return (
        <>
                   <Helmet>
        <title>Login | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
         <section className='p-4'>
            <div className='rounded border '>
                <div className='p-3 border-b bg-[#fafbfc]'>
                    <h3 className='font-semibold'>Kasa/Raporlama</h3>
                </div>
                <div className='p-3 bg-white flex gap-5'>
                    <div className='p-3 border h-fit rounded w-1/4 bg-[#fafbfc]'>
                        <div className='flex flex-wrap mb-5'>
                            <h3 className='min-w-full mb-2'>Başlangıç</h3>
                            <input className='border rounded py-2 px-3 w-2/3 mr-3 outline-none text-sm font-medium' type="date" name="" id="" />
                            <input className='border rounded py-2 px-3 outline-none text-sm font-medium' type="time" name="" id="" />
                        </div>
                        <div className='flex flex-wrap mb-5'>
                            <h3 className='min-w-full mb-2'>Bitiş</h3>
                            <input className='border rounded py-2 px-3 w-2/3 mr-3 outline-none text-sm font-medium' type="date" name="" id="" />
                            <input className='border rounded py-2 px-3 outline-none text-sm font-medium' type="time" name="" id="" />
                        </div>
                        <div className='flex flex-wrap mb-5'>
                            <h3 className='min-w-full mb-2'>İşlem/Detay</h3>
                            <input className='border rounded  py-2 px-3 w-full outline-none text-sm font-medium' type="text" name="" id="" />
                        </div>
                        <div className='flex gap-3'>
                            <button className='rounded py-2 px-4 bg-red-600 text-white'>Filtrele</button>
                            <button className='rounded py-2 px-4 bg-blue-500 text-white'>Temizle</button>
                            <button className='flex items-center gap-2 rounded py-2 px-4 bg-slate-900 text-white'><i className="fa-solid fa-print"></i>Yazdır</button>
                        </div>
                    </div>
                    <div className='p-3 border h-fit rounded w-[calc(75%-20px)] bg-white'>

                        <table className='w-full text-left border rounded bg-[#fafbfc] mb-3'>
                            <thead className='border-b border-gray-500 bg-[#e5e5e5]'>
                                <tr>
                                    <th className='p-3 font-semibold'>Tarih</th>
                                    <th className='p-3 font-semibold'>İşlem</th>
                                </tr>
                            </thead>
                            <tbody className='text-sm'>
                                <tr className='border-b'>
                                    <td className='p-3'>14.08.2024 19:35:15</td>
                                    <td className='p-3'>Hasan tuncer giriş yaptı.</td>
                                </tr>
                                <tr className='border-b'>
                                    <td className='p-3'>14.08.2024 19:35:15</td>
                                    <td className='p-3'>Hasan tuncer giriş yaptı.</td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>
        </section>
        </>
     
    )
}

export default LogKayitlari