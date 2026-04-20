import React from 'react'

function AlertSuccess({setAlertSuccess}) {
    return (
        <div class="absolute flex items-center justify-center w-full h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
            <div class="w-1/3 p-12  bg-white rounded-lg text-center border">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" /><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" /></svg>
                <h3 className='text-3xl font-semibold'>Başarılı</h3>
                <p className='font-semibold text-lg text-green-500  mb-6'>Bilgiler kaydedilmiştir.</p>
                <button onClick={() => setAlertSuccess(false)} className='rounded text-white bg-sky-600 py-2 px-4'>Tamam</button>
            </div>
        </div>
    )
}

export default AlertSuccess