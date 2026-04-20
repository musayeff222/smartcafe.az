import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import axios from "axios";
import { base_url } from "../api/index";

// Headers ayarı
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Async thunk
export const fetchOrderById = createAsyncThunk(
  "order/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${base_url}/orders/${id}`, getHeaders());
      const formatted = response.data;
      const items = formatted?.items || [];

      // pivot_id ve pivot.price dahil ederek itemları mapliyoruz
      const shareItems = items.map(({ name, quantity, price, pivot }) => ({
        name,
        quantity,
        price: pivot?.price ?? price, // Pivot fiyatı varsa onu al
        pivot_id: pivot?.id || null,
      }));

      const totalAmount = shareItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
        0
      );

      return {
        orderID: formatted.id || null,
        shares: [
          {
            type: "cash",
            amount: totalAmount,
            items: shareItems,
          },
        ],
        items: shareItems,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Order fetch failed");
    }
  }
);


// Slice tanımı
const orderSlice = createSlice({
  name: "order",
  initialState: {
    shares: [],
    orderID: null,
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearOrder: (state) => {
      state.shares = [];
      state.orderID = null;
      state.items = [];
      state.error = null;
    },
    setFormattedOrder: (state, action) => {
      const { id, items } = action.payload;
    
      // Burada her item'ın pivot_id'si olduğunu garanti ediyoruz
      const formattedItems = items.map(({ name, quantity, price, pivot }) => ({
        name,
        quantity,
        price: pivot?.price ?? price,
        pivot_id: pivot?.id || null,
      }));
    
      const totalAmount = formattedItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
        0
      );
    
      state.orderID = id;
      state.shares = [
        {
          type: "cash",
          amount: totalAmount,
          items: formattedItems,
        },
      ];
      state.items = formattedItems; // ayrıca state.items içine de formatted veriyoruz
    },
    
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.shares = action.payload.shares;
        state.orderID = action.payload.orderID;
        state.items = action.payload.items;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const orderPersistConfig = {
  key: "order",
  storage,
  whitelist: ["orderID", "shares", "items"],
};

export const { clearOrder, setFormattedOrder } = orderSlice.actions;

// ❗ Persist edilmiş reducer export ediyoruz
export default persistReducer(orderPersistConfig, orderSlice.reducer);
