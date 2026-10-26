import type { CompleteUploadResponse, UploadIntent } from "../types/api";
import { apiClient } from "./apiClient";

/** Runs the shared intent -> binary upload -> completion flow for an INPUT file. */
export async function uploadAndConfirmInputFile(
  file: File,
  createIntent: () => Promise<UploadIntent>,
  cachedIntent: UploadIntent | undefined,
  rememberIntent: (intent: UploadIntent | undefined) => void,
): Promise<CompleteUploadResponse> {
  let intent = cachedIntent;
  if (!intent) {
    intent = await createIntent();
    rememberIntent(intent);
  }

  const completion = await (async () => {
    await apiClient.files.uploadInputBinary(intent!.uploadUrl, intent!.file.id, file);
    return apiClient.files.completeUpload(intent!.file.id);
  })();
  rememberIntent(undefined);
  return completion;
}
