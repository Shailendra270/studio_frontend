import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.css';
import store from './store';

// Add after the store import
if (process.env.NODE_ENV === 'development') {
  (window as any).__store = store;
}

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);

