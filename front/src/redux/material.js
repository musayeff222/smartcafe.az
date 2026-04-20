import { createSlice } from '@reduxjs/toolkit';

const materialSlice = createSlice({
  name: 'material',
  initialState: {
    loading: false,
    error: null,
    data: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setMaterialData: (state, action) => {
      state.data = action.payload;
    },
    resetMaterialState: (state) => {
      state.loading = false;
      state.error = null;
      state.data = null;
    }
  },
});

export const { setLoading, setError, setMaterialData, resetMaterialState } = materialSlice.actions;
export default materialSlice.reducer;
