'use client';

import { useEffect, useState } from 'react';
import { BidderStatusBanner } from './BidderStatusBanner';
import { apiClient } from '@/lib/api';

type StatusResponse = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
  paddleNumber: number;
};

export function BidderStatusGate({ auctionId }: { auctionId: string }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    apiClient
      .get<{ success: boolean; data: StatusResponse | null }>(
        `/api/auctions/${auctionId}/my-status`,
      )
      .then((response) => setStatus(response.data.data))
      .catch(() => setStatus(null));
  }, [auctionId]);

  return (
    <BidderStatusBanner
      auctionId={auctionId}
      status={status?.status ?? null}
      paddleNumber={status?.paddleNumber}
    />
  );
}
