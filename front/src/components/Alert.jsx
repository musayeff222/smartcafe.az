import React from 'react'

function Alert({setAlert , text}) {
    return (
        <div class="absolute flex items-center justify-center w-full h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
            <div class="w-1/3 p-12  bg-white rounded-lg text-center border">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-circle w-24 h-24 mb-5 m-auto text-orange-500" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                </svg>
                <h3 className='text-3xl font-semibold'>Onaylıyormusunuz ??</h3>
                <p className='font-semibold text-lg  mb-6'>{text}</p>
                <button onClick={()=>setAlert(false)} className='rounded text-white bg-gray-500 py-2 px-4 mr-2'>Hayır</button>
                <button onClick={()=>setAlert(false)} className='rounded text-white bg-orange-500 py-2 px-4'>Evet</button>
            </div>
        </div>
    )
}

export default Alert