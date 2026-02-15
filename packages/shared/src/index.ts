// Tipos compartidos entre frontend y backend

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'user';
  createdAt: Date;
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  imageUrls: string[];
  status: AuctionStatus;
  startDate: Date;
  endDate: Date;
  sellerId: string;
}

export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface Bid {
  id: string;
  auctionItemId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export * from './auth.types';
export * from './profile.types';
