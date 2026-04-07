import { config } from "@/config/app";

/**
 * Auto Drive SDK wrapper.
 * Uploads happen under the user's own identity (their session token),
 * not a server-side API key.
 *
 * The exact auth pattern for third-party apps is TBD (see spec §4.3).
 * This wrapper abstracts the integration boundary so the rest of the app
 * is insulated from changes to the auth flow.
 */

export interface AutoDriveUploadResult {
  cid: string;
}

export interface AutoDriveClient {
  uploadFile(
    file: File | Blob,
    filename: string,
    userToken: string
  ): Promise<AutoDriveUploadResult>;

  uploadJson(
    data: Record<string, unknown>,
    filename: string,
    userToken: string
  ): Promise<AutoDriveUploadResult>;
}

export function getGatewayUrl(cid: string): string {
  return `${config.autoDrive.gatewayUrl}/${cid}`;
}

/**
 * Stub Auto Drive client for development.
 * Returns deterministic fake CIDs.
 */
export class StubAutoDriveClient implements AutoDriveClient {
  async uploadFile(
    _file: File | Blob,
    filename: string,
    _userToken: string
  ): Promise<AutoDriveUploadResult> {
    // Generate a fake CID based on filename and timestamp
    const hash = Buffer.from(`${filename}-${Date.now()}`).toString("base64url");
    return { cid: `bafk_stub_${hash}` };
  }

  async uploadJson(
    data: Record<string, unknown>,
    filename: string,
    _userToken: string
  ): Promise<AutoDriveUploadResult> {
    const hash = Buffer.from(`${filename}-${Date.now()}`).toString("base64url");
    return { cid: `bafk_stub_${hash}` };
  }
}

export const autoDriveClient: AutoDriveClient = new StubAutoDriveClient();
