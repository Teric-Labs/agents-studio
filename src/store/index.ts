import { configureStore, combineReducers } from '@reduxjs/toolkit';
import builderReducer from './builderSlice';

const rootReducer = combineReducers({
  builder: builderReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

// Typed helpers
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
