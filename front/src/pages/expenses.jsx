import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AccessDenied from '../components/AccessDenied';
import { base_url } from '../api/index';
import { Helmet } from 'react-helmet';

const getHeaders = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

function Expenses() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  const [categoryExpenses, setCategoryExpenses] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Xərc kateqoriyalarını gətir
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${base_url}/expense-categories`, getHeaders());
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Yeni xərc kateqoriyası əlavə et
  const createCategory = async () => {
    try {
      await axios.post(`${base_url}/expense-categories`, { name: newCategoryName }, getHeaders());
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error("Error creating category", err);
    }
  };

  // ✅ Seçilmiş kateqoriyanın xərclərini gətir
  const fetchCategoryExpenses = async (categoryId) => {
    try {
      const res = await axios.get(`${base_url}/expense-categories/${categoryId}/expenses`, getHeaders());
      setCategoryExpenses(res.data);
    } catch (err) {
      console.error("Error fetching category expenses", err);
    }
  };

  // ✅ Seçilmiş kateqoriyaya xərc əlavə et
  const addExpense = async () => {
    try {
      await axios.post(`${base_url}/expense-categories/${selectedCategoryId}/expenses`, {
        amount: Number(expenseAmount),
        reason: expenseReason
      }, getHeaders());

      setExpenseAmount('');
      setExpenseReason('');
      fetchCategoryExpenses(selectedCategoryId);
      fetchCategories(); // total_expense yenilənsin deyə
    } catch (err) {
      console.error("Error adding expense", err);
    }
  };

  // ✅ Kateqoriya sil
  const deleteCategory = async (categoryId) => {
    try {
      await axios.delete(`${base_url}/expense-categories/${categoryId}`, getHeaders());
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
        setCategoryExpenses(null);
      }
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategoryExpenses(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  return (
    <section className="p-4">
      <Helmet>
        <title>Xərc Kateqoriyaları | Smartcafe</title>
        <meta name="description" content="Xərc idarəetmə paneli" />
      </Helmet>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ✅ Sol: Kateqoriya Siyahısı */}
        <div className="border p-4 rounded shadow">
          <h2 className="font-semibold text-lg mb-2">Kateqoriyalar</h2>

          {loading ? (
            <p>Yüklənir...</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex justify-between items-center border-b py-2">
                <button
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`text-left ${selectedCategoryId === category.id ? 'font-bold text-blue-600' : ''}`}
                >
                  {category.name} - {category.total_expense} ₼
                </button>
                <button onClick={() => deleteCategory(category.id)} className="text-red-500">Sil</button>
              </div>
            ))
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Yeni kateqoriya adı"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <button onClick={createCategory} className="bg-blue-500 text-white px-4 py-2 rounded">Əlavə et</button>
          </div>
        </div>

        {/* ✅ Sağ: Seçilmiş Kateqoriyanın Detalları */}
        <div className="border p-4 rounded shadow">
          {selectedCategoryId && categoryExpenses ? (
            <>
              <h2 className="font-semibold text-lg mb-2">
                {categoryExpenses.category} - Toplam: {categoryExpenses.total_expense} ₼
              </h2>

              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Məbləğ"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="border p-2 rounded w-full mb-2"
                />
                <input
                  type="text"
                  placeholder="Səbəb"
                  value={expenseReason}
                  onChange={(e) => setExpenseReason(e.target.value)}
                  className="border p-2 rounded w-full mb-2"
                />
                <button onClick={addExpense} className="bg-green-600 text-white px-4 py-2 rounded">Xərc əlavə et</button>
              </div>
            </>
          ) : (
            <p>Kateqoriya seçilməyib.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Expenses;
