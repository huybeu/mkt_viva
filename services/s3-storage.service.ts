import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { PresignInput, StorageService, UploadInput } from "./storage.service";

export class S3StorageService implements StorageService {
  private bucket = process.env.S3_BUCKET ?? "";
  private client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined, region: process.env.S3_REGION || "auto",
    credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" } : undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT)
  });
  private ready() { if (!this.bucket) throw new Error("S3_BUCKET chưa được cấu hình"); }
  getPublicUrl(key: string) { return `${(process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "")}/${key}`; }
  async upload(input: UploadInput) { this.ready(); await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: input.key, Body: input.body, ContentType: input.contentType })); return { url: this.getPublicUrl(input.key) }; }
  async delete(key: string) { this.ready(); await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }
  async exists(key: string) { this.ready(); try { await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key })); return true; } catch { return false; } }
  async createPresignedUploadUrl(input: PresignInput) { this.ready(); return getSignedUrl(this.client, new PutObjectCommand({ Bucket: this.bucket, Key: input.key, ContentType: input.contentType }), { expiresIn: input.expiresIn ?? 600 }); }
}

export const storage = new S3StorageService();
