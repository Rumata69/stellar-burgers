import { combineReducers } from '@reduxjs/toolkit';

import { constructorSlice, ingredientsSlice, ordersSlice, userSlice } from './slices';

export const rootReducer = combineReducers({
  ingredients: ingredientsSlice.reducer,
  burgerConstructor: constructorSlice.reducer,
  orders: ordersSlice.reducer,
  user: userSlice.reducer,
});
