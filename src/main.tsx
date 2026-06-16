import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SensoryProvider } from './context/SensoryContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SensoryProvider>
      <App />
    </SensoryProvider>
  </StrictMode>,
);
