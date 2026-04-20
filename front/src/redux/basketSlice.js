import { createSlice } from "@reduxjs/toolkit";

const basketSlice = createSlice({
  name: "basket",
  initialState: {
    items: [],
    totalPrice: 0, 
  },
  reducers: {
    addItem: (state, action) => {
      // Hem ana id'yi hem de detail_id'yi kontrol ederek mevcut ürün var mı diye bakıyoruz
      const existingItem = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.detail_id === action.payload.detail_id
      );
    
      if (existingItem) {
        // Eğer ürün varsa miktarı artır
        existingItem.quantity += action.payload.quantity;
        state.totalPrice += parseFloat(action.payload.price) * action.payload.quantity;
      } else {
        // Yeni ürünü sepete ekle
        state.items.push({ ...action.payload });
        state.totalPrice += parseFloat(action.payload.price) * action.payload.quantity;
      }
    },
    
    removeItem: (state, action) => {
      // Hem id hem de detail_id'ye göre silinecek ürünü bulun
      const itemToRemove = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.detail_id === action.payload.detail_id
      );
      if (itemToRemove) {
        state.totalPrice -= parseFloat(itemToRemove.price) * itemToRemove.quantity; // Fiyatı çıkar
        state.items = state.items.filter(
          (item) =>
            !(item.id === action.payload.id && item.detail_id === action.payload.detail_id)
        );
      }
    },
    
    clearBasket: (state) => {
      state.items = [];
      state.totalPrice = 0; // Sepet boşalınca toplam fiyat sıfırlanır
    },
    increaseQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity += 1;
        state.totalPrice += parseFloat(item.price); // Fiyatı artır
      }
    },
    decreaseQuantity: (state, action) => {
  const item = state.items.find(
    item =>
      item.id === action.payload.id &&
      item.detail_id === action.payload.detail_id
  );
  if (item && item.quantity > 1) {
    item.quantity -= 1;
    state.totalPrice -= parseFloat(item.price);
  }
},


  },
});

export const { addItem, removeItem, clearBasket, increaseQuantity, decreaseQuantity } = basketSlice.actions;
export default basketSlice.reducer;
