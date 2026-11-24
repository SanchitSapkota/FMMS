
/**
 * Captures a frame from a video element and adds GPS/timestamp metadata.
 */
export function captureFrameWithMetadata(videoEl, meta = {}) {
  if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) {
    throw new Error("Camera stream is not ready yet.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  const timestamp = meta.timestamp || new Date().toISOString();

  const gpsText =
    meta.lat != null && meta.lng != null
      ? `GPS: ${Number(meta.lat).toFixed(5)}, ${Number(meta.lng).toFixed(5)} (±${Math.round(meta.accuracy || 0)}m)`
      : "GPS: Unavailable";

  const barHeight = Math.max(44, Math.round(canvas.height * 0.08));

  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

  ctx.fillStyle = "#f8fafc";
  ctx.font = `${Math.max(12, Math.round(barHeight * 0.32))}px sans-serif`;

  ctx.fillText(
    `${new Date(timestamp).toLocaleString()} | ${gpsText}`,
    14,
    canvas.height - barHeight * 0.35
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to capture photo."));
          return;
        }

        const previewUrl = URL.createObjectURL(blob);

        resolve({
          blob,
          previewUrl,
          capturedAt: timestamp,
          metadata: {
            width: canvas.width,
            height: canvas.height,
            lat: meta.lat ?? null,
            lng: meta.lng ?? null,
            accuracy: meta.accuracy ?? null,
            address: meta.address || "",
          },
        });
      },
      "image/jpeg",
      0.85
    );
  });
}

/**
 * Keeps the photo locally.
 * Actual upload happens together with the visit report.
 */
export async function uploadVisitPhoto(photoData) {
  if (!photoData?.blob) {
    throw new Error("No captured photo available.");
  }

  return {
    id: `photo_${Date.now()}`,
    blob: photoData.blob,
    url: photoData.previewUrl,
    capturedAt: photoData.capturedAt,
    metadata: photoData.metadata,
  };
}
