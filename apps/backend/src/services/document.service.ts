import { DocumentType } from '@prisma/client';
import { cloudinary } from '../config/cloudinary';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { assertValidUploadedFile } from '../middleware/upload.middleware';

const DOCUMENT_URL_TTL_SECONDS = 60 * 60;

type SignedUrlOptions = {
  asAttachment?: boolean;
  resourceType?: 'image' | 'raw' | 'auto';
};

export async function uploadDocument(
  userId: string,
  auctionId: string,
  file: Express.Multer.File,
  type: DocumentType,
) {
  await assertValidUploadedFile(file);

  const bidder = await prisma.bidder.findUnique({
    where: {
      userId_auctionId: {
        userId,
        auctionId,
      },
    },
  });

  if (!bidder) {
    throw new AppError(404, 'Bidder registration not found for this auction');
  }

  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    {
      folder: `martillo/private-documents/${bidder.id}`,
      resource_type: resourceType,
      type: 'authenticated',
    },
  );

  const document = await prisma.bidderDocument.create({
    data: {
      bidderId: bidder.id,
      type,
      cloudinaryId: result.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      // Cloudinary metadata (best-effort)
      format: (result as unknown as { format?: string }).format ?? null,
      resourceType: (result as unknown as { resource_type?: string }).resource_type ?? resourceType,
      bytes: (result as unknown as { bytes?: number }).bytes ?? null,
    },
  });

  return document;
}

export async function generateSignedUrl(
  cloudinaryId: string,
  options?: SignedUrlOptions,
): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + DOCUMENT_URL_TTL_SECONDS;
  return cloudinary.url(cloudinaryId, {
    sign_url: true,
    type: 'authenticated',
    resource_type: options?.resourceType ?? 'auto',
    expires_at: expiresAt,
    flags: options?.asAttachment ? 'attachment' : undefined,
  });
}

export async function getDocuments(
  requesterId: string,
  targetUserId: string,
  auctionId: string,
  isAdmin: boolean,
) {
  if (!isAdmin && requesterId !== targetUserId) {
    throw new AppError(403, 'Forbidden');
  }

  const bidder = await prisma.bidder.findUnique({
    where: {
      userId_auctionId: {
        userId: targetUserId,
        auctionId,
      },
    },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!bidder) {
    throw new AppError(404, 'Bidder registration not found');
  }

  const data = await Promise.all(
    bidder.documents.map(async (document) => ({
      id: document.id,
      type: document.type,
      uploadedAt: document.uploadedAt,
      originalName: document.originalName,
      mimeType: document.mimeType,
      previewUrl: await generateSignedUrl(document.cloudinaryId, {
        resourceType:
          document.resourceType === 'raw' || document.format === 'pdf' ? 'raw' : 'image',
      }),
      downloadUrl: await generateSignedUrl(document.cloudinaryId, {
        asAttachment: true,
        resourceType:
          document.resourceType === 'raw' || document.format === 'pdf' ? 'raw' : 'image',
      }),
    })),
  );

  return data;
}
