import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowRightIcon, ArrowsPointingInIcon, ArrowsRightLeftIcon, BanknotesIcon, CurrencyDollarIcon, ExclamationTriangleIcon, PencilIcon, PlusIcon, PrinterIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'

function TableCard({ id, title, staff, total }) {
    const [open, setOpen] = useState(false)

    const handleClick = () => {
        setOpen(!open)
    }
    return (
        <div className="w-[175px] h-[150px] overflow-hidden rounded-lg  relative">
            <NavLink to={`/table-order/${id}`}>
                {/* <div className="w-full h-full flex justify-center items-center bg-[#10E35E]">
                <h3 className="text-xl">
                    {title}
                </h3>
            </div> */}
                <div className='w-full h-full bg-[#ff0000] p-1'>
                    <div>
                        <h4 className='text-xl'>{title}</h4>
                        <span className='text-sm'>{staff}</span>
                    </div>
                    <div className='w-full text-center text-2xl font-bold mt-2'>
                        <p>{total} AZN</p>
                    </div>
                </div>
            </NavLink>
            <div className="absolute bottom-1 right-1">
                <button onClick={handleClick} className="[&_span]:block [&_span]:rounded-full [&_span]:w-[4px] [&_span]:h-[4px] [&_span]:bg-black flex flex-col space-y-1 bg-white w-6 py-[6px] [&_span]:mx-auto rounded">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <Transition show={open}>
                <Dialog className="relative z-10" onClose={setOpen}>
                    <TransitionChild
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <TransitionChild
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start w-full">
                                            <div className="mt-3 text-center w-full sm:ml-4 sm:mt-0 sm:text-left">
                                                <div className='w-full'>
                                                    <DialogTitle as="h3" className=" text-[20px] font-normal leading-6 text-gray-900 border-b-[1px] border-black pb-2">
                                                        {title}
                                                    </DialogTitle>

                                                </div>
                                                {/* <div className='mt-5'>
                                                    <h4 className='border-blue-500 text-blue-600 bg-[#2d7ee017] mt-2 px-2 font-semibold'>
                                                        Masa
                                                    </h4>
                                                    <div className="mt-2 flex justify-between gap-y-2 [&_a]:font-semibold [&_a]:flex [&_a]:flex-col [&_a]:items-center [&_a]:border-[#3f3f3f18] [&_a]:border-[1px] [&_a]:rounded [&_a]:w-[32%] [&_a]:min-w-[180px] flex-wrap [&_a]:h-[90px] [&_a]:justify-center">
                                                        <NavLink className="hover:border-orange-500 text-orange-500">
                                                            <ArrowRightIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Hesab Detalı</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-green-500 text-green-500">
                                                            <BanknotesIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Hesab Kəs</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-blue-500 text-blue-500">
                                                            <ArrowsRightLeftIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Masa dəyişdir</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-violet-500 text-violet-500">
                                                            <ArrowsPointingInIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Masa birləşdir</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-amber-500  text-amber-500">
                                                            <PrinterIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Yazdır</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-teal-500 text-teal-500">
                                                            <CurrencyDollarIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Öncədən ödə</h4>
                                                        </NavLink>
                                                    </div>
                                                </div> */}
                                                <div className='mt-5'>
                                                    <h4 className='border-blue-500 text-blue-600 bg-[#2d7ee017] mt-2 px-2 font-semibold'>
                                                        Masa
                                                    </h4>
                                                    <div className="mt-2 flex justify-between [&_a]:font-semibold [&_a]:flex [&_a]:flex-col [&_a]:items-center [&_a]:border-[#3f3f3f18] [&_a]:border-[1px] [&_a]:rounded [&_a]:w-[32%] [&_a]:min-w-[180px] flex-wrap [&_a]:h-[90px] [&_a]:justify-center">
                                                        <NavLink to={`/table-customazing/23`} className="hover:border-black">
                                                            <PencilIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Masa düzəlişi</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-black">
                                                            <QrCodeIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>QR menyu kod</h4>
                                                        </NavLink>
                                                        <NavLink className="hover:border-black">
                                                            <PlusIcon className="block h-5 w-5" aria-hidden="true" />
                                                            <h4>Yeni masa əlavə et</h4>
                                                        </NavLink>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                            onClick={() => setOpen(false)}
                                            data-autofocus
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}

export default TableCard;