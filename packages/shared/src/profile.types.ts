export type ProfileChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ProfileChangeRequest = {
  id: string;
  userId: string;
  requestedEmail?: string | null;
  requestedFullName?: string | null;
  requestedPhone?: string | null;
  status: ProfileChangeStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | Date | null;
  createdAt: string | Date;
};

export type CreateProfileChangeRequest = {
  email?: string;
  fullName?: string;
  phone?: string;
};
