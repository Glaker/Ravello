import { useState, type ReactNode } from 'react';
import { Button, PinInput, Stack, Text } from '@mantine/core';
import { Logo } from '../brand/Logo';

const KEY = 'ravello-admin-ok';
// SOLO DEMO: el PIN viaja en el bundle (VITE_*). Ver README → "Antes de producción".
const PIN = String(import.meta.env.VITE_ADMIN_PIN ?? '');

function unlocked() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function PinGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(unlocked);
  const [value, setValue] = useState('');
  const [err, setErr] = useState(false);

  if (ok) return <>{children}</>;

  const tryPin = (v: string) => {
    if (v === PIN) {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* sin storage: queda desbloqueado solo en memoria */
      }
      setOk(true);
    } else {
      setErr(true);
      setValue('');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--crema)', padding: 24 }}>
      <Stack align="center" gap={28} style={{ color: 'var(--bordo)' }}>
        <Logo width={160} />
        <div className="r-title" style={{ fontSize: 28, textAlign: 'center' }}>
          Admin de la carta
          <span className="r-filete" style={{ margin: '10px auto 0' }} />
        </div>
        <PinInput
          length={Math.max(PIN.length, 4)}
          type="number"
          mask
          size="lg"
          value={value}
          error={err}
          onChange={(v) => {
            setErr(false);
            setValue(v);
          }}
          onComplete={tryPin}
          autoFocus
          aria-label="PIN"
        />
        <Text size="sm" c={err ? 'terracota.7' : 'tinta.5'} fw={500}>
          {err ? 'Ese PIN no es. Probá de nuevo.' : 'Ingresá el PIN del local.'}
        </Text>
        {!PIN && (
          <Button variant="subtle" onClick={() => setOk(true)}>
            Entrar (no hay VITE_ADMIN_PIN configurado)
          </Button>
        )}
      </Stack>
    </div>
  );
}
