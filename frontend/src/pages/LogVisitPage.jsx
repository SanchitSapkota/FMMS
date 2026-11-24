
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { visitService } from "../services/visitService";
import { uploadVisitPhoto } from "../services/cameraService";
import VisitForm from "../components/visits/VisitForm";

export default function LogVisitPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleCreateVisit = async (formValues) => {
        setSubmitting(true);

        try {
            const payload = new FormData();

            const {
                photo,
                photos,
                repId,
                repName,
                ...visitFields
            } = formValues;

            // Add the visit fields.
            Object.entries(visitFields).forEach(([key, value]) => {
                if (value === undefined || value === null || value === "") {
                    return;
                }

                if (typeof value === "object" && !(value instanceof Blob)) {
                    payload.append(key, JSON.stringify(value));
                } else {
                    payload.append(key, value);
                }
            });

            // Add the captured photo.
            const photoItems = [];

            if (photo) {
                photoItems.push(photo);
            }

            if (Array.isArray(photos)) {
                photoItems.push(...photos);
            }

            for (const item of photoItems) {
                const photoData = item?.blob
                    ? item
                    : await uploadVisitPhoto(item);

                if (photoData?.blob) {
                    payload.append(
                        "photos",
                        photoData.blob,
                        `visit_${Date.now()}.jpg`
                    );

                    if (photoData.capturedAt) {
                        payload.append(
                            "capturedAt",
                            photoData.capturedAt
                        );
                    }

                    // Use photo GPS metadata if the form did not
                    // already provide a location.
                    if (
                        !visitFields.location &&
                        photoData.metadata?.lat != null &&
                        photoData.metadata?.lng != null
                    ) {
                        payload.set(
                            "location",
                            JSON.stringify({
                                lat: photoData.metadata.lat,
                                lng: photoData.metadata.lng,
                                accuracy: photoData.metadata.accuracy,
                                address: photoData.metadata.address || ""
                            })
                        );
                    }
                } else if (item instanceof Blob) {
                    payload.append(
                        "photos",
                        item,
                        `visit_${Date.now()}.jpg`
                    );
                }
            }

            await visitService.create(payload);

            navigate("/visits");
        } catch (error) {
            console.error(
                "Visit submission failed:",
                error.response?.data || error
            );

            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Unable to submit visit report.";

            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-900">
                    Log Shop / Business Visit
                </h1>

                <p className="text-xs text-slate-500">
                    Captures business details, GPS coordinates,
                    timestamp, and camera photo
                </p>
            </div>

            <VisitForm
                onSubmit={handleCreateVisit}
                submitting={submitting}
            />
        </div>
    );
}
