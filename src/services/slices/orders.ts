import { getFeedsApi, getOrderByNumberApi, getOrdersApi, orderBurgerApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { clearConstructor } from './constructor';
import { logout } from './user';

import type { TFeedState, TOrder } from '@utils-types';

export const ORDERS_REFRESH_INTERVAL = 5000;

type OrdersState = {
  feed: TFeedState;
  history: TOrder[];
  historyLoading: boolean;
  historyError: string | null;
  historyRequestId: string | null;
  current: TOrder | null;
  detailsLoading: boolean;
  detailsError: string | null;
  detailsRequestId: string | null;
  creating: boolean;
  created: TOrder | null;
  createError: string | null;
};

const ordersInitial: OrdersState = {
  feed: {
    orders: [],
    total: 0,
    totalToday: 0,
    isLoading: false,
    error: null,
  },
  history: [],
  historyLoading: false,
  historyError: null,
  historyRequestId: null,
  current: null,
  detailsLoading: false,
  detailsError: null,
  detailsRequestId: null,
  creating: false,
  created: null,
  createError: null,
};

export const loadFeed = createAsyncThunk('orders/feed', getFeedsApi, {
  condition: (_, { getState }) =>
    !(getState() as { orders: OrdersState }).orders.feed.isLoading,
});

export const loadHistory = createAsyncThunk('orders/history', getOrdersApi, {
  condition: (_, { getState }) =>
    !(getState() as { orders: OrdersState }).orders.historyLoading,
});

export const loadOrder = createAsyncThunk('orders/details', async (number: number) => {
  const result = await getOrderByNumberApi(number);

  if (!result.success || !result.orders[0]) throw new Error('Заказ не найден');

  return result.orders[0];
});

export const createOrder = createAsyncThunk(
  'orders/create',
  async (ids: string[], { dispatch }) => {
    const result = await orderBurgerApi(ids);

    dispatch(clearConstructor());
    void dispatch(loadFeed());
    void dispatch(loadHistory());

    return result.order;
  },
  {
    condition: (_, { getState }) =>
      !(getState() as { orders: OrdersState }).orders.creating,
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: ordersInitial,
  reducers: {
    closeOrder: (state) => {
      state.created = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFeed.pending, (state) => {
        state.feed.isLoading = true;
        state.feed.error = null;
      })
      .addCase(loadFeed.fulfilled, (state, { payload }) => {
        state.feed = {
          orders: payload.orders,
          total: payload.total,
          totalToday: payload.totalToday,
          isLoading: false,
          error: null,
        };
      })
      .addCase(loadFeed.rejected, (state, action) => {
        state.feed.isLoading = false;
        state.feed.error = action.error.message;
      })
      .addCase(loadHistory.pending, (state, action) => {
        state.historyLoading = true;
        state.historyError = null;
        state.historyRequestId = action.meta.requestId;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        if (state.historyRequestId !== action.meta.requestId) return;

        state.historyLoading = false;
        state.history = [...action.payload].reverse();
      })
      .addCase(loadHistory.rejected, (state, action) => {
        if (state.historyRequestId !== action.meta.requestId) return;

        state.historyLoading = false;
        state.historyError = action.error.message ?? 'Не удалось загрузить заказы';
      })
      .addCase(loadOrder.pending, (state, action) => {
        state.detailsLoading = true;
        state.detailsError = null;
        state.current = null;
        state.detailsRequestId = action.meta.requestId;
      })
      .addCase(loadOrder.fulfilled, (state, action) => {
        if (state.detailsRequestId !== action.meta.requestId) return;

        state.detailsLoading = false;
        state.current = action.payload;
      })
      .addCase(loadOrder.rejected, (state, action) => {
        if (state.detailsRequestId !== action.meta.requestId) return;

        state.detailsLoading = false;
        state.detailsError = action.error.message ?? 'Не удалось загрузить заказ';
      })
      .addCase(createOrder.pending, (state) => {
        state.creating = true;
        state.created = null;
        state.createError = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.created = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message ?? 'Не удалось оформить заказ';
      })
      .addCase(logout.fulfilled, (state) => {
        state.history = [];
        state.historyLoading = false;
        state.historyError = null;
        state.historyRequestId = null;
        state.current = null;
        state.created = null;
      });
  },
});

export const { closeOrder } = ordersSlice.actions;

export default ordersSlice.reducer;
