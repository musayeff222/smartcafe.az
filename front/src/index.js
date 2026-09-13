import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { initTheme } from './theme/initTheme';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { setupStore } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { UiSettingsProvider } from './context/UiSettingsContext';

initTheme();

const store = setupStore();
const persistor = persistStore(store);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <LanguageProvider>
    <ThemeProvider>
      <UiSettingsProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <App />
          </PersistGate>
        </Provider>
      </UiSettingsProvider>
    </ThemeProvider>
  </LanguageProvider>
);

reportWebVitals();
