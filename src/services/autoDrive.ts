import { config } from "@/config/app";
import { createAutoDriveApi } from "@autonomys/auto-drive";

export interface AutoDriveUploadResult {
  cid: string;
}

export interface AutoDriveClient {
  uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType?: string
  ): Promise<AutoDriveUploadResult>;

  uploadJson(
    data: Record<string, unknown>,
    filename: string
  ): Promise<AutoDriveUploadResult>;

  getCredits(): Promise<{ uploadBytesRemaining: string }>;
}

/**
 * Real Auto Drive client using @autonomys/auto-drive SDK.
 * Authenticates with the app's API key — uploads consume credits
 * on the Eulonomys Auto Drive account.
 */
export class SdkAutoDriveClient implements AutoDriveClient {
  private api: ReturnType<typeof createAutoDriveApi>;

  constructor() {
    if (!config.autoDrive.apiKey) {
      throw new Error("AUTO_DRIVE_API_KEY is required");
    }
    this.api = createAutoDriveApi({
      provider: "apikey",
      apiKey: config.autoDrive.apiKey,
      apiUrl: config.autoDrive.apiUrl,
    });
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    _mimeType?: string
  ): Promise<AutoDriveUploadResult> {
    const cid = await this.api.uploadFileFromBuffer(buffer, filename, {
      compression: true,
    });
    return { cid };
  }

  async uploadJson(
    data: Record<string, unknown>,
    filename: string
  ): Promise<AutoDriveUploadResult> {
    const cid = await this.api.uploadObjectAsJSON(data, filename, {
      compression: true,
    });
    return { cid };
  }

  async getCredits(): Promise<{ uploadBytesRemaining: string }> {
    const credits = await this.api.getPendingCredits();
    return { uploadBytesRemaining: credits.toString() };
  }
}

/**
 * Stub client for development without an API key.
 */
export class StubAutoDriveClient implements AutoDriveClient {
  async uploadFile(
    _buffer: Buffer,
    filename: string
  ): Promise<AutoDriveUploadResult> {
    const hash = Buffer.from(`${filename}-${Date.now()}`).toString("base64url");
    return { cid: `bafk_stub_${hash}` };
  }

  async uploadJson(
    _data: Record<string, unknown>,
    filename: string
  ): Promise<AutoDriveUploadResult> {
    const hash = Buffer.from(`${filename}-${Date.now()}`).toString("base64url");
    return { cid: `bafk_stub_${hash}` };
  }

  async getCredits(): Promise<{ uploadBytesRemaining: string }> {
    return { uploadBytesRemaining: "999999999" };
  }
}

// Use real client if API key is configured, otherwise stub
export const autoDriveClient: AutoDriveClient = config.autoDrive.apiKey
  ? new SdkAutoDriveClient()
  : new StubAutoDriveClient();
