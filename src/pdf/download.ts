import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { Category, Product } from '../lib/types';
import { CartaPdf } from './CartaPdf';

export async function cartaPdfBlob(categories: Category[], products: Product[], updated: string): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(createElement(CartaPdf, { categories, products, updated }) as any).toBlob();
}

export async function downloadCartaPdf(categories: Category[], products: Product[], updated: string): Promise<void> {
  const blob = await cartaPdfBlob(categories, products, updated);
  const d = new Date(updated);
  const name = `Carta Ravello ${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
