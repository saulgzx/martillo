import multer from 'multer';
import { AppError } from '../utils/app-error';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

export async function assertValidUploadedFile(file: Express.Multer.File): Promise<void> {
  const { fileTypeFromBuffer } = await import('file-type');
  const fileType = await fileTypeFromBuffer(file.buffer);
  if (!fileType || !allowedMimeTypes.has(fileType.mime)) {
    throw new AppError(400, 'Unsupported file type');
  }
}
