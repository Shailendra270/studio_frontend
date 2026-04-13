import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import streamsReducer from './slices/streamsSlice';
import clipsReducer from './slices/clipsSlice';
import foldersReducer from './slices/foldersSlice';
import assetsReducer from './slices/assetsSlice';
import tagsReducer from './slices/tagsSlice';
import teamsReducer from './slices/teamsSlice';
import competitionsReducer from './slices/competitionsSlice';

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    streams: streamsReducer,
    clips: clipsReducer,
    folders: foldersReducer,
    assets: assetsReducer,
    tags: tagsReducer,
    teams: teamsReducer,
    competitions: competitionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Make store available globally for API client
if (typeof window !== 'undefined') {
  (window as any).__REDUX_STORE__ = store;
}

export default store;
