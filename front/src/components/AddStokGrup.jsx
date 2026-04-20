import React from 'react'

function AddStokGrup() {
    return (
        <div className='p-3 bg-gray-50 border rounded'>
            <div className='flex flex-wrap mb-5'>
                <h3 className='min-w-full mb-2'>Adı</h3>
                <input className='border rounded py-2 px-3 w-full outline-none text-sm font-medium' type="text" name="" id="" />
            </div>
            <div className='flex flex-wrap mb-5'>
                <h3 className='min-w-full mb-2'>Resim (.jpg , .png max:2048 kb)</h3>
                <input className='border rounded py-2 px-3 w-full outline-none text-sm font-medium' type="file" name="" id="cari" />
            </div>
            <div className='border rounded flex items-center py-2 px-5 w-full bg-white mb-5'>
                <input className='mr-3 h-6' type="checkbox" name="" id="qr" />
                <label className='text-sm font-semibold' htmlFor="qr">QR menüde göster</label>
            </div>
            <div className='flex flex-wrap mb-5'>
                <h3 className='min-w-full mb-2'>Gösterim sıra</h3>
                <input className='border rounded py-2 px-3 w-1/4 outline-none text-sm font-medium' type="number" name="" id="" />
            </div>
            <div className='w-32 mb-5'>
                <h3 className='mb-3'>Grup renk</h3>
                <input className='w-full bg-white border rounded p-1 h-9' type="color" name="" id="" />
            </div>
            <h3 className='mb-3'>Yazdır (Bu gruptaki stoklar seçtiğiniz yazıcıya yönlendirilecektir.)</h3>
            <div className='border rounded flex items-center py-2 px-5 w-full bg-white mb-3'>
                <input className='mr-3 h-6' type="checkbox" name="" id="qr" />
                <label className='text-sm font-semibold' htmlFor="qr">Mutfak yazıcı</label>
            </div>
            <div className='border rounded flex items-center py-2 px-5 w-full bg-white mb-5'>
                <input className='mr-3 h-6' type="checkbox" name="" id="qr" />
                <label className='text-sm font-semibold' htmlFor="qr">Bar yazıcı</label>
            </div>
            <button className='inline-block bg-sky-600 font-medium py-2 px-4 rounded text-white'>Saxla</button>
        </div>
    )
}

export default AddStokGrup