import React, { Suspense } from 'react';
import ShopDetailsClient from './ShopDetailsClient';

export default function ShopDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading shop details...</div>}>
      <ShopDetailsClient />
    </Suspense>
  );
}
