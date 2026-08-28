export type StorageVisibility = "public" | "private";
export type StoragePurpose = "lesson-image" | "tts-audio" | "avatar" | "temporary-audio";
export type StoredObject = { key: string; size: number; mimeType: string; visibility: StorageVisibility; publicUrl?: string };
export type PutObjectInput = { data: Uint8Array; mimeType: string; visibility: StorageVisibility; purpose: StoragePurpose; extension?: string };

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StoredObject>;
  read(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
