import Link from 'next/link';

type BidderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';

type Props = {
  status: BidderStatus | null;
  auctionId: string;
  paddleNumber?: number | null;
  reason?: string;
};

export function BidderStatusBanner({ status, auctionId, paddleNumber, reason }: Props) {
  if (!status) {
    return (
      <Link
        href={`/auctions/${auctionId}/register`}
        className="inline-flex rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white"
      >
        Participar en este remate
      </Link>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Tu solicitud esta siendo revisada.
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Estas aprobado para participar. Paleta #{paddleNumber ?? '--'}.
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Tu solicitud no fue aprobada{reason ? `: ${reason}` : '.'}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700">
      No puedes participar en este remate.
    </div>
  );
}
