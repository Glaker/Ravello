import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './theme/global.css';
import { theme } from './theme/theme';
import { supabaseConfigured } from './lib/supabase';

const Landing = lazy(() => import('./pages/Landing'));
const Carta = lazy(() => import('./pages/Carta'));
const AdminCarta = lazy(() => import('./pages/AdminCarta'));
const Mozo = lazy(() => import('./pages/Mozo'));
const Cocina = lazy(() => import('./pages/Cocina'));
const Resumen = lazy(() => import('./pages/Resumen'));
const Qr = lazy(() => import('./pages/Qr'));
const Demo = lazy(() => import('./pages/Demo'));

function MissingEnv() {
  return (
    <div style={{ padding: 32, maxWidth: 560 }}>
      <h1 className="r-title">Falta configurar Supabase</h1>
      <p>Copiá <code>.env.example</code> a <code>.env.local</code> y completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="light">
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--crema)' }} />}>
          {supabaseConfigured ? (
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/carta" element={<Carta />} />
              <Route path="/admin/carta" element={<AdminCarta />} />
              <Route path="/admin" element={<AdminCarta />} />
              <Route path="/admin/resumen" element={<Resumen />} />
              <Route path="/qr" element={<Qr />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/mozo" element={<Mozo />} />
              <Route path="/cocina" element={<Cocina />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          ) : (
            <MissingEnv />
          )}
        </Suspense>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
