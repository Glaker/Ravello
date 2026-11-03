import { site } from '../theme/tokens';

/** "nº" con la o volada subrayada: en Urbanist el signo º se confunde con una "o". */
export function Direccion({ text = site.direccion }: { text?: string }) {
  const [a, b] = text.split('nº');
  if (b === undefined) return <>{text}</>;
  return (
    <>
      {a}n<span className="r-ord">o</span>
      {b}
    </>
  );
}
