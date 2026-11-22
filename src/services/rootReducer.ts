import { combineReducers } from '@reduxjs/toolkit';

import constructorReducer from './slices/constructor';
import ingredientsReducer from './slices/ingredients';
import ordersReducer from './slices/orders';
import userReducer from './slices/user';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  burgerConstructor: constructorReducer,
  orders: ordersReducer,
  user: userReducer,
});
