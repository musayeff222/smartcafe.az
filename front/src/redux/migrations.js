export const migrations = {
    0: (state) => {
      return {
        ...state,
        orders: {}
      }
    },
    1: (state) => {
      return {
        ...state,
        orders: Object.keys(state.orders).reduce((acc, key) => {
          if (state.orders[key].lastUpdated > Date.now() - 86400000) {
            acc[key] = state.orders[key];
          }
          return acc;
        }, {})
      }
    }
  };
