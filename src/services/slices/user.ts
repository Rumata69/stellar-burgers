import {
  forgotPasswordApi,
  getUserApi,
  loginUserApi,
  logoutApi,
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
} from '@reduxjs/toolkit';

import { deleteCookie, getCookie, setCookie } from '@utils/cookie';

import type { TLoginData, TRegisterData } from '@api';
import type { TUser } from '@utils-types';

const clearTokens = (): void => {
  deleteCookie('accessToken');
  localStorage.removeItem('refreshToken');
};

const saveTokens = (data: { accessToken: string; refreshToken: string }): void => {
  setCookie('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
};

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

const userSlice = createSlice({
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

export default userSlice.reducer;
