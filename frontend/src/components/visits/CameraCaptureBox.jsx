import React, { useEffect } from 'react';
import { Camera, RefreshCw, Upload, Trash2 } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { captureFrameWithMetadata } from '../../services/cameraService';

export default function CameraCaptureBox({ coords, photo, onPhotoChange }) {
  const { videoRef, isStreaming, error, startCamera, stopCamera, switchCamera } = useCamera();

  useEffect(() => {
    startCamera('environment');
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    try {
      const captured = await captureFrameWithMetadata(videoRef.current, {
        lat: coords?.lat,
        lng: coords?.lng,
        accuracy: coords?.accuracy,
        address: coords?.address,
        timestamp: new Date().toISOString(),
      });
      onPhotoChange(captured);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileFallback = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onPhotoChange({
      blob: file,
      previewUrl,
      capturedAt: new Date().toISOString(),
      metadata: {
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        accuracy: coords?.accuracy ?? null,
        address: coords?.address || '',
      },
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">Shop / Visit Photo</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={switchCamera}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Flip Camera
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
            <Upload className="h-3.5 w-3.5" />
            File
            <input type="file" accept="image/*" capture="environment" onChange={handleFileFallback} className="hidden" />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
          {error} — You can still attach a photo using the File button above.
        </p>
      )}

      {!photo ? (
        <div className="space-y-2.5">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Starting camera preview...
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isStreaming}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Capture Photo with GPS & Timestamp
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <img
            src={photo.previewUrl}
            alt="Captured visit"
            className="aspect-video w-full rounded-lg border border-slate-200 object-cover"
          />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Captured: {new Date(photo.capturedAt).toLocaleString()}</span>
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}