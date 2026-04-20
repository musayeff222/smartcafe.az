import React, { useState } from 'react';

const EditTransactionModal = ({ transaction, onClose, handleUpdateTransaction, handleDeleteTransaction }) => {
    const [amount, setAmount] = useState(transaction.amount);
    const [date, setDate] = useState(transaction.date);
    const [note, setNote] = useState(transaction.description);

    const handleUpdate = (e) => {
        e.preventDefault();
        handleUpdateTransaction(transaction.id, amount, date, note);
        onClose();
        window.location.reload()
    };

    const handleDelete = () => {
        handleDeleteTransaction(transaction.id);
        onClose();
        window.location.reload()
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Yeniləyin</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleUpdate}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" htmlFor="amount">
                            Miktar (azn):
                        </label>
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" htmlFor="date">
                            Tarih:
                        </label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" htmlFor="note">
                        Izah (istəyə görə):
                        </label>
                        <input
                            id="note"
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex justify-between gap-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded py-2 px-4 bg-red-600 text-white hover:bg-red-700"
                        >
                            Sil
                        </button>
                        <button
                            type="submit"
                            className="rounded py-2 px-4 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
