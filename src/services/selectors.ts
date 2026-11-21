import type { RootState } from './store';

export const selectIngredients = (state: RootState): RootState['ingredients'] =>
  state.ingredients;

export const selectConstructor = (state: RootState): RootState['burgerConstructor'] =>
  state.burgerConstructor;

export const selectOrders = (state: RootState): RootState['orders'] => state.orders;

export const selectUser = (state: RootState): RootState['user'] => state.user;
