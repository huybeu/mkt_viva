export interface UploadInput { key: string; body: Buffer; contentType: string; }
export interface PresignInput { key: string; contentType: string; expiresIn?: number; }
export interface StorageService {
  upload(input: UploadInput): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  createPresignedUploadUrl(input: PresignInput): Promise<string>;
  exists(key: string): Promise<boolean>;
}
