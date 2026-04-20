

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure you have axios installed
import AccessDenied from './AccessDenied';
import { base_url } from '../api/index';

const getHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

function OncedenOde({ odersId, setrefreshfetch }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [previousPayments, setPreviousPayments] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false); 

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${base_url}/order/${odersId.id}/prepayments`, getHeaders());
      setPreviousPayments(response.data);
      setrefreshfetch(false);
    } catch (error) {
      console.error('Error fetching previous payments:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [odersId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate that amount is provided
    if (amount <= 0) {
      alert("Məbləğ(Azn) müsbət ədəd olmalıdır.");
      return;
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

      await axios.post(`${base_url}/order/${odersId.id}/prepayments`, {
        amount,
        type: paymentMethod === 'cash' ? 'cash' : 'bank',
        date: currentDate,
      }, getHeaders());

      setrefreshfetch(true); // Notify parent to refresh data
      fetchPayments(); // Fetch updated payments
      setAmount('');
      setPaymentMethod('cash');
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
        setAccessDenied(true); // Set access denied if response status is 403
      } 
      if (error.response && error.response.status === 400 && error.response.data.message === "Order is already fully paid.") {
        setAccessDenied(true); // Set access denied if response status is 403
      } 
      if (error.response && error.response.status === 400 && error.response.data.message === "Amount exceeds the remaining balance.") {
        alert("Məbləğ qalan balansı üstələyir.");
      } 
      if (error.response && error.response.status === 404 && error.response.data.message === "Order not found.") {
        alert("Sifariş yoxdur");
      } 
      else {
        console.error('Error submitting payment:', error);
      }
    }
  };

  const kalanmebleg = (total, onceden) => {
    const result = total - onceden;
    return parseFloat(result.toFixed(1));
  };

  const handleDeleteOrderPrepare = async (prepareId) => {
    try {
      await axios.delete(`${base_url}/order/${odersId.id}/prepayments/${prepareId}`, getHeaders());
      setrefreshfetch(true); // Notify parent to refresh data
      fetchPayments(); // Fetch updated payments
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
        setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error('Error deleting payment:', error);
      }
    }
  };

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-6">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
        <div className="border-t border-gray-300 mb-4"></div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 mr-2">
                <label htmlFor="amount" className="block text-gray-700">Məbləğ(Azn)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value >= 0) {
                      setAmount(value);
                    }
                  }}
                  min="0"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1 ml-2">
                <label htmlFor="payment-method" className="block text-gray-700">Ödeme</label>
                <select
                  id="payment-method"
                  name="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Nağd</option>
                  <option value="transfer">Bank köçürməsi</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Saxla
              </button>
            </div>
          </div>
        </form>

        {/* List of previous payments */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4">Önceki Ödemeler</h4>
          <div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Məbləğ (Azn)</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sil</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {previousPayments.map((payment) => (
        <tr key={payment.id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.amount}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.type === "cash" ? "Nağd" : "Bank köçürməsi"}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <button 
              onClick={() => handleDeleteOrderPrepare(payment.id)}
              className="text-red-500 hover:text-red-700"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        </div>

        {/* Total Sum */}
        <div className="mt-6 flex justify-end font-semibold text-gray-700">
          <span className="text-lg">Toplam: </span>
          <span className="text-lg ml-2">{odersId.total_price?? 0} AZN</span>
        </div>
        <div className="mt-6 flex justify-end font-semibold text-green-700">
          <span className="text-lg">Artıq ödənilib: </span>
          <span className="text-lg ml-2">{odersId.total_prepayment ?? 0} AZN</span>
        </div>
        <div className="mt-6 flex justify-end font-semibold text-red-700">
          <span className="text-lg">Qalıq: </span>
          <span className="text-lg ml-2">{kalanmebleg(odersId.total_price, odersId.total_prepayment)} AZN</span>
        </div>
      </div>
    </div>
  );
}

export default OncedenOde;
