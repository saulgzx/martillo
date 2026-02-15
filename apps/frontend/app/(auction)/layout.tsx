import type { ReactNode } from 'react';
import { AppTopbar } from '@/components/common/AppTopbar';

export default function AuctionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
          <AppTopbar />
        </div>
      </div>
      {children}
    </div>
  );
}
