import { getIngredientsApi } from '@api';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { TIngredient } from '@utils-types';

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

const ingredientsSlice = createSlice({
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

export default ingredientsSlice.reducer;
