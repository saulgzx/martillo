export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'AUCTIONEER' | 'CONSIGNOR' | 'BIDDER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  rut: string;
  phone: string;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string | null;
  status: UserStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthResponse {
  accessToken: string;
  user: UserPublic;
}
