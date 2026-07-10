import type { StreamEvent } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

/**
 * Uploads the CSV file to the backend and calls onEvent for every
 * NDJSON line the server streams back (start / progress / done),
 * so the UI can show a live progress bar during AI extraction.
 */
export async function importCsv(
  file: File,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/import`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Import failed (HTTP ${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON, keep the default message
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by this browser/response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // last element may be an incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onEvent(JSON.parse(trimmed) as StreamEvent);
      } catch {
        // ignore a malformed line rather than crashing the whole import
      }
    }
  }

  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer.trim()) as StreamEvent);
    } catch {
      // ignore trailing partial data
    }
  }
}
