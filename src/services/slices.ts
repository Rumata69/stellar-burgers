import {
  forgotPasswordApi,
  getFeedsApi,
  getIngredientsApi,
  getOrderByNumberApi,
  getOrdersApi,
  getUserApi,
  loginUserApi,
  logoutApi,
  orderBurgerApi,
  refreshToken,
  registerUserApi,
  resetPasswordApi,
  updateUserApi,
} from '@api';
import {
  createAsyncThunk,
  createSlice,
  isFulfilled,
  isPending,
  isRejected,
  nanoid,
} from '@reduxjs/toolkit';

import { deleteCookie, getCookie, setCookie } from '@utils/cookie';

import type { TLoginData, TRegisterData } from '@api';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  TConstructorState,
  TFeedState,
  TIngredient,
  TOrder,
  TUser,
} from '@utils-types';

export const ORDERS_REFRESH_INTERVAL = 5000;

const clearTokens = (): void => {
  deleteCookie('accessToken');
  localStorage.removeItem('refreshToken');
};

const saveTokens = (data: { accessToken: string; refreshToken: string }): void => {
  setCookie('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
};

type IngredientsState = {
  items: TIngredient[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const ingredientsInitial: IngredientsState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
};

export const loadIngredients = createAsyncThunk('ingredients/load', getIngredientsApi, {
  condition: (_, { getState }) =>
    !(getState() as { ingredients: IngredientsState }).ingredients.loading,
});

export const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState: ingredientsInitial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadIngredients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadIngredients.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.items = action.payload;
      })
      .addCase(loadIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Не удалось загрузить ингредиенты';
      });
  },
});

type UserState = {
  user: TUser | null;
  checked: boolean;
  loading: boolean;
  error: string | null;
  updateError: string | null;
  logoutError: string | null;
};

const userInitial: UserState = {
  user: null,
  checked: false,
  loading: false,
  error: null,
  updateError: null,
  logoutError: null,
};

export const checkAuth = createAsyncThunk(
  'user/check',
  async () => {
    if (!getCookie('accessToken') && !localStorage.getItem('refreshToken')) return null;

    try {
      if (!getCookie('accessToken')) await refreshToken();

      const data = await getUserApi();

      if (!data.success) throw new Error('Не удалось проверить авторизацию');

      return data.user;
    } catch {
      clearTokens();
      return null;
    }
  },
  {
    condition: (_, { getState }) => {
      const { checked, loading } = (getState() as { user: UserState }).user;
      return !checked && !loading;
    },
  }
);

export const login = createAsyncThunk('user/login', async (data: TLoginData) => {
  const result = await loginUserApi(data);
  saveTokens(result);
  return result.user;
});

export const register = createAsyncThunk(
  'user/register',
  async (data: TRegisterData) => {
    const result = await registerUserApi(data);
    saveTokens(result);
    return result.user;
  }
);

export const updateUser = createAsyncThunk(
  'user/update',
  async (data: Partial<TRegisterData>) => {
    const result = await updateUserApi(data);

    if (!result.success) throw new Error('Не удалось сохранить профиль');

    return result.user;
  }
);

export const logout = createAsyncThunk('user/logout', async () => {
  const result = await logoutApi();

  if (!result.success) throw new Error('Не удалось выйти');

  clearTokens();
});

export const recoverPassword = createAsyncThunk(
  'user/recoverPassword',
  async (email: string) => {
    await forgotPasswordApi({ email });
    localStorage.setItem('resetPassword', 'true');
  }
);

export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async (data: { password: string; token: string }) => {
    await resetPasswordApi(data);
    localStorage.removeItem('resetPassword');
  }
);

const userRequests = [
  checkAuth,
  login,
  register,
  updateUser,
  logout,
  recoverPassword,
  resetPassword,
] as const;

export const userSlice = createSlice({
  name: 'user',
  initialState: userInitial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateUser.pending, (state) => {
        state.updateError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateError = action.error.message ?? 'Не удалось сохранить профиль';
      })
      .addCase(logout.pending, (state) => {
        state.logoutError = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.logoutError = action.error.message ?? 'Не удалось выйти';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      .addMatcher(
        isFulfilled(checkAuth, login, register, updateUser),
        (state, action) => {
          state.user = action.payload;
          state.checked = true;
        }
      )
      .addMatcher(isPending(...userRequests), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(isFulfilled(...userRequests), (state) => {
        state.loading = false;
      })
      .addMatcher(isRejected(...userRequests), (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Не удалось выполнить запрос';
        state.checked = true;
      });
  },
});

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

    void dispatch(loadFeed());
    void dispatch(loadHistory());

    return result.order;
  },
  {
    condition: (_, { getState }) =>
      !(getState() as { orders: OrdersState }).orders.creating,
  }
);

export const ordersSlice = createSlice({
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

const constructorInitial: TConstructorState = {
  bun: null,
  ingredients: [],
};

export const constructorSlice = createSlice({
  name: 'burgerConstructor',
  initialState: constructorInitial,
  reducers: {
    addIngredient: {
      prepare: (ingredient: TIngredient) => ({
        payload: { ...ingredient, id: nanoid() },
      }),
      reducer: (state, action: PayloadAction<TIngredient & { id: string }>) => {
        if (action.payload.type === 'bun') state.bun = action.payload;
        else state.ingredients.push(action.payload);
      },
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.ingredients = state.ingredients.filter((item) => item.id !== action.payload);
    },
    moveIngredient: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;

      if (
        from < 0 ||
        to < 0 ||
        from >= state.ingredients.length ||
        to >= state.ingredients.length
      )
        return;

      const [item] = state.ingredients.splice(from, 1);
      state.ingredients.splice(to, 0, item);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createOrder.fulfilled, () => constructorInitial);
  },
});

export const { addIngredient, removeIngredient, moveIngredient } =
  constructorSlice.actions;

export const { closeOrder } = ordersSlice.actions;
