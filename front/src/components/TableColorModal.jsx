import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTableColors } from '../action/TableActions';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'

function TableColorModal({setOpen }) {
    const restaurant = useSelector(state => state.restaurant);
    const dispatch = useDispatch();

    const [colors, setColors] = useState({
        free_table_color: restaurant?.free_table_color,
        full_table_color: restaurant?.full_table_color
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setColors(prevColors => ({
            ...prevColors,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = dispatch(updateTableColors(restaurant.id, colors));
        if (result === "success") {
            setOpen(false)
        } 
    };
    
    return (
        <Transition show={true}>
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
                                <div className="bg-white  pb-4 pt-5 sm:pb-4">
                                    <div className="sm:flex sm:items-start w-full">
                                        <div className="mt-3 text-center w-full sm:mt-0 sm:text-left">
                                            <div className='w-full'>
                                                <DialogTitle as="h3" className=" text-[20px] font-normal leading-6 text-gray-900 border-b-[1px] border-gray pb-2 pl-4">
                                                    masa ayarlar
                                                </DialogTitle>

                                                <div className='mt-5 pl-4'>
                                                    <form action="" onSubmit={handleSubmit}>
                                                        <div className='flex space-x-3'>
                                                            <div className='flex flex-col space-y-1 items-center'>
                                                                <label htmlFor="">Boş masa rəng</label>
                                                                <input type="color" value={colors.free_table_color} onChange={handleChange} name='free_table_color' className='p-[3px] rounded border-[1px] border-[#d9dbde] bg-white w-24 h-9 appearance-none' />
                                                            </div>
                                                            <div className='flex flex-col space-y-1 items-center'>
                                                                <label htmlFor="">Dolu masa rəng</label>
                                                                <input type="color" value={colors.full_table_color} onChange={handleChange} name='full_table_color' className='p-[3px] rounded border-[1px] border-[#d9dbde] bg-white w-24 h-9 appearance-none' />
                                                            </div>
                                                        </div>
                                                        <div className='flex justify-between items-center mt-10'>
                                                            <div className="bg-gray-50  py-3 sm:flex sm:flex-row-reverse ">
                                                                <button
                                                                    type="submit"
                                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-[#206bc4] px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-bg-[#2059c4] hover:bg-[#2059c4]"
                                                                    data-autofocus
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                            <div className="bg-gray-50 sm:flex sm:flex-row-reverse sm:pr-6">
                                                                <button
                                                                    type="button"
                                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                                    onClick={() => setOpen(false)}
                                                                    data-autofocus
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>

                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}



export default TableColorModal;