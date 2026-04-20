
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import EditTransactionModal from './EditTransactionModal';
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';
// Модальное окно для добавления суммы
const AddBalanceModal = ({ onClose, handleAddBalance }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAddBalance(amount, date, note);
        onClose();
    };

    const handleAmountChange = (e) => {
        const value = parseFloat(e.target.value);
        if (value < 0) {
            setAmount('');
        } else {
            setAmount(value);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Bakiye əlavə edin</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" htmlFor="amount">
                            Miktar (azn):
                        </label>
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={handleAmountChange}
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
                            İzah (isteğe bağlıdır):
                        </label>
                        <input
                            id="note"
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded py-2 px-4 bg-gray-500 text-white hover:bg-gray-600"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="rounded py-2 px-4 bg-green-600 text-white hover:bg-green-700"
                        >
                            Əlavə edin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function MusteriInfo({ musteriId }) {
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [customerData, setCustomerData] = useState(null);
    const [totalBalance, setTotalBalanc] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false); 
    const [filters, setFilters] = useState({
        date: '',
        amount: '',
        type: '',
        description: ''
    });

    useEffect(() => {
        const fetchCustomerData = async () => {
            try {
                const response = await axios.get(`${base_url}/customers/${musteriId}`, getHeaders());
                const { money, customer_transactions } = response.data;
                setTotalBalanc(response.data.money);
                setCustomerData(response.data);
                setTransactions(customer_transactions.map(tx => ({
                    id: tx.id,
                    date: tx.date,
                    amount: parseFloat(tx.amount),
                    type: tx.type === 'credit' ? 'credit' : 'debit',
                    description: tx.note || '',
                    color: tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                })));
            } catch (error) {
                console.error('Ошибка при загрузке данных клиента:', error);
                setError('Müştəri datasını yükləmək alınmadı.');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerData();
    }, [musteriId]);

    // const totalBalance = response.data.money;

    const handleAddBalance = async (amount, date, note) => {
        try {
            const response = await axios.post(`${base_url}/customers/${musteriId}/transaction`, {
                amount,
                type: 'credit',
                note,
                date
            }, getHeaders());

            setTransactions([
                ...transactions,
                {
                    id: response.data.id,
                    date,
                    amount: parseFloat(amount),
                    type: 'credit',
                    description: note || '',
                    color: 'bg-green-100'
                }
            ]);
            window.location.reload()
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
                console.error('Ошибка при добавлении баланса:', error);
                setError('Не удалось добавить баланс.');

            }
        }
    };

    const handleUpdateTransaction = async (id, amount, date, note) => {
        try {
            await axios.put(`${base_url}/customers/transaction/${id}`, {
                amount,
                date,
                "type": "credit",
                note
            }, getHeaders());

            setTransactions(transactions.map(tx => 
                tx.id === id
                    ? { ...tx, amount: parseFloat(amount), date, description: note }
                    : tx
            ));
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
              
          
              console.error('Ошибка при обновлении транзакции:', error);
              setError('Не удалось обновить транзакцию.');
                
            }
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await axios.delete(`${base_url}/customers/transaction/${id}`, getHeaders());

            setTransactions(transactions.filter(tx => tx.id !== id));
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
              
      
              console.error('Ошибка при удалении транзакции:', error);
              setError('Не удалось удалить транзакцию.');
                
            }
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
            Tarih: t.date,
            Məbləğ: `${t.amount.toFixed(2)} azn`,
            Tip: t.type,
            İzah: t.description
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, "transactions.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Transactions Report', 14, 16);

        const tableData = transactions.map(t => [
            t.date,
            `${t.amount.toFixed(2)} azn`,
            t.type,
            t.description
        ]);

        doc.autoTable({
            head: [['Tarih', 'Məbləğ', 'Tip', 'İzah']],
            body: tableData,
            startY: 24
        });

        doc.text(`Toplam bakiye: ${totalBalance} azn`, 14, doc.autoTable.previous.finalY + 10);
        doc.save('transactions.pdf');
    };

    const filteredTransactions = transactions.filter(transaction =>
        (!filters.date || transaction.date.includes(filters.date)) &&
        (!filters.amount || transaction.amount.toString().includes(filters.amount)) &&
        (!filters.type || transaction.type.includes(filters.type)) &&
        (!filters.description || transaction.description.toLowerCase().includes(filters.description.toLowerCase()))
    );
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    if (loading) return <div className="p-4">Загрузка...</div>;
    if (error) return <div className="p-4">{error}</div>;

    return (
        <>
            <div className='flex gap-3 items-center mb-4'>
                <h2 className='font-semibold text-2xl mr-auto'>{customerData?.name}</h2>
                <button
                    className='rounded py-2 px-4 bg-green-600 text-white hover:bg-green-700'
                    onClick={() => setShowModal(true)}
                >
                    Bakiye əlavə edin
                </button>
            </div>
            <div className='flex items-center gap-4 mb-4'>
                <p className={`text-lg font-semibold text-${totalBalance >= 0 ? 'green':"red"}-600 bg-${totalBalance >= 0 ? 'green':"red"}-50 rounded p-2`}>
                    Toplam bakiye: {totalBalance} azn
                </p>
                <button
                    className='rounded py-2 px-4 bg-gray-700 text-white hover:bg-gray-800'
                    onClick={exportToExcel}
                >
                    EXCEL
                </button>
                <button
                    className='rounded py-2 px-4 bg-gray-700 text-white hover:bg-gray-800'
                    onClick={exportToPDF}
                >
                    PDF
                </button>
            </div>
            <div className='mb-4'>
                <input
                    className='py-2 px-4 border rounded w-full mb-2'
                    placeholder='Tarih filtresi'
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
                <input
                    className='py-2 px-4 border rounded w-full mb-2'
                    placeholder='Miktar filtresi'
                    value={filters.amount}
                    onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
                />
                <input
                    className='py-2 px-4 border rounded w-full mb-2'
                    placeholder='Tip filtresi'
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                />
                <input
                    className='py-2 px-4 border rounded w-full'
                    placeholder='İzah filtresi'
                    value={filters.description}
                    onChange={(e) => setFilters({ ...filters, description: e.target.value })}
                />
            </div>
            {/* <table className='w-full text-left border border-gray-300 rounded bg-white'>
    <thead className='bg-gray-200'>
        <tr className='border-b border-gray-300'>
            <th className='p-4 text-left font-semibold text-gray-700'>Tarih</th>
            <th className='p-4 w-2/12 text-right font-semibold text-gray-700'>Məbləğ</th>
            <th className='p-4 text-center font-semibold text-gray-700'>Tip</th>
            <th className='p-4 text-center font-semibold text-gray-700'>İzah</th>
            <th className='p-4 w-1/10 text-center font-semibold text-gray-700'>Detay</th>
        </tr>
    </thead>
    <tbody>
        {filteredTransactions.map((transaction) => (
            <tr 
                key={transaction.id} 
                className={`${transaction.color} border-b border-gray-300 hover:bg-gray-50 transition-colors duration-300`}
            >
                <td className='p-4'>{transaction.date}</td>
                <td className='p-4 text-center'>{transaction.amount.toFixed(2)} ₼</td>
                <td className='p-4 text-center'>{transaction.type == 'credit'?"Bakiye Eklendi":"Ödəniş alindi"}</td>
                <td className='p-4 text-center'>{transaction.description}</td>
                <td className='p-4 text-center'>
                    <button 
                        className='rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300'
                        onClick={() => {
                            setCurrentTransaction(transaction);
                            setShowEditModal(true);
                        }}
                    >
                        Düzenle
                    </button>
                </td>
            </tr>
        ))}
    </tbody>
</table> */}
<div className='overflow-x-auto'>
    <table className='w-full text-left border border-gray-300 rounded bg-white'>
        <thead className='bg-gray-200'>
            <tr className='border-b border-gray-300'>
                <th className='p-4 text-left font-semibold text-gray-700'>Tarih</th>
                <th className='p-4 text-right font-semibold text-gray-700'>Məbləğ</th>
                <th className='p-4 text-center font-semibold text-gray-700'>Tip</th>
                <th className='p-4 text-center font-semibold text-gray-700'>İzah</th>
                <th className='p-4 text-center font-semibold text-gray-700'>Detay</th>
            </tr>
        </thead>
        <tbody>
            {filteredTransactions.map((transaction) => (
                <tr 
                    key={transaction.id} 
                    className={`${transaction.color} border-b border-gray-300 hover:bg-gray-50 transition-colors duration-300`}
                >
                    <td className='p-4'>{transaction.date}</td>
                    <td className='p-4 text-right'>{transaction.amount.toFixed(2)} ₼</td>
                    <td className='p-4 text-center'>{transaction.type === 'credit' ? "Bakiye əlavə olundu" : "Ödəniş alindi"}</td>
                    <td className='p-4 text-center'>{transaction.description}</td>
                    <td className='p-4 text-center'>
                        <button 
                            className='rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300'
                            onClick={() => {
                                setCurrentTransaction(transaction);
                                setShowEditModal(true);
                            }}
                        >
                            Yeniləyin
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
</div>

            {showModal && (
                <AddBalanceModal 
                    onClose={() => setShowModal(false)} 
                    handleAddBalance={handleAddBalance} 
                />
            )}
            {showEditModal && currentTransaction && (
                <EditTransactionModal
                    transaction={currentTransaction}
                    onClose={() => setShowEditModal(false)}
                    handleUpdateTransaction={handleUpdateTransaction}
                    handleDeleteTransaction={handleDeleteTransaction}
                />
            )}
        </>
    );
}

const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default MusteriInfo;
