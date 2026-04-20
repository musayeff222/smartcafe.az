import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sessions: {}, // hər table üçün ayrıca saxlanacaq
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    startSession: (state, action) => {
      const { tableId, endTime, rate } = action.payload;
      state.sessions[tableId] = {
        time: 0,
        isRunning: true,
        endTime: endTime || null,
        activeIndex: null,
        priceTimer: "0.00",
        minuteRateQepik: rate || 3,
      };
    },
    tick: (state, action) => {
      const { tableId } = action.payload;
      const session = state.sessions[tableId];
      if (!session || !session.isRunning) return;

      if (session.endTime) {
        // geri sayım
        const remaining = Math.max(
          0,
          Math.floor((session.endTime - Date.now()) / 1000)
        );
        session.time = remaining;
        if (remaining <= 0) {
          session.isRunning = false;
        }
      } else {
        // irəli sayım
        session.time += 1;
      }
    },
    pauseSession: (state, action) => {
      const { tableId } = action.payload;
      if (state.sessions[tableId]) {
        state.sessions[tableId].isRunning = false;
      }
    },
    stopSession: (state, action) => {
      const { tableId } = action.payload;
      delete state.sessions[tableId]; // tam silirik
    },
    updatePrice: (state, action) => {
      const { tableId, price } = action.payload;
      if (state.sessions[tableId]) {
        state.sessions[tableId].priceTimer = price;
      }
    },
    setActiveIndex: (state, action) => {
      const { tableId, index } = action.payload;
      if (state.sessions[tableId]) {
        state.sessions[tableId].activeIndex = index;
      }
    },
  },
});

export const {
  startSession,
  tick,
  pauseSession,
  stopSession,
  updatePrice,
  setActiveIndex,
} = timerSlice.actions;
export default timerSlice.reducer;
