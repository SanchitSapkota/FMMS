
import React, { useState, useEffect } from "react";
import { MapPin, RefreshCw, Clock } from "lucide-react";
import { useGeolocation } from "../../hooks/useGeolocation";
import { visitService } from "../../services/visitService";
import CameraCaptureBox from "./CameraCaptureBox";

const OUTCOMES = [
    { label: "Interested", value: "interested" },
    { label: "Follow-Up Needed", value: "follow-up-required" },
    { label: "Not Interested", value: "not-interested" },
];

export default function VisitForm({ onSubmit, submitting }) {
    const {
        coords,
        status,
        error,
        fetchCurrentLocation,
        setManualCoords,
    } = useGeolocation();

    const [photo, setPhoto] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);
    const [assignmentError, setAssignmentError] = useState("");

    const [form, setForm] = useState({
        assignmentId: "",
        outcome: "interested",
        remarks: "",
        nextFollowUpDate: "",
        followUpRemarks: "",
    });

    useEffect(() => {
        fetchCurrentLocation();
    }, [fetchCurrentLocation]);

    useEffect(() => {
        const loadAssignments = async () => {
            try {
                setLoadingAssignments(true);
                setAssignmentError("");

                const records = await visitService.list({
                    role: "representative",
                });

                setAssignments(records);
            } catch (err) {
                console.error(
                    "Unable to load assignments:",
                    err.response?.data || err
                );

                setAssignmentError(
                    err.response?.data?.message ||
                    "Unable to load assigned businesses."
                );
            } finally {
                setLoadingAssignments(false);
            }
        };

        loadAssignments();
    }, []);

    const selectedAssignment = assignments.find(
        (item) => String(item.id) === String(form.assignmentId)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.assignmentId) {
            alert("Please select an assigned business.");
            return;
        }

        if (!selectedAssignment) {
            alert("Selected assignment could not be found. Please select again.");
            return;
        }

        if (
            form.outcome === "follow-up-required" &&
            !form.nextFollowUpDate
        ) {
            alert("Please select a follow-up date.");
            return;
        }

        onSubmit({
            assignmentId: form.assignmentId,
            outcome: form.outcome,
            remarks: form.remarks,
            nextFollowUpDate: form.nextFollowUpDate,
            followUpRemarks: form.followUpRemarks,
            visitedAt: new Date().toISOString(),
            location: coords
                ? {
                    lat: coords.lat,
                    lng: coords.lng,
                    accuracy: coords.accuracy,
                    address: coords.address,
                }
                : null,
            photo,
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-base font-semibold text-slate-900">
                    Assigned Business
                </h2>

                <div>
                    <label className="block text-xs font-medium text-slate-700">
                        Select Business *
                    </label>

                    <select
                        name="assignmentId"
                        required
                        value={form.assignmentId}
                        onChange={handleChange}
                        disabled={loadingAssignments}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                        <option value="">
                            {loadingAssignments
                                ? "Loading assignments..."
                                : "Select an assigned business"}
                        </option>

                        {assignments.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.businessName || "Unnamed Business"}
                                {item.area ? ` - ${item.area}` : ""}
                            </option>
                        ))}
                    </select>

                    {assignmentError && (
                        <p className="mt-2 text-xs text-red-600">
                            {assignmentError}
                        </p>
                    )}

                    {!loadingAssignments &&
                        !assignmentError &&
                        assignments.length === 0 && (
                            <p className="mt-2 text-xs text-amber-700">
                                No assignments found. Ask your manager to assign a business.
                            </p>
                        )}
                </div>

                {selectedAssignment && (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        <p>
                            <strong>Business:</strong>{" "}
                            {selectedAssignment.businessName}
                        </p>
                        <p>
                            <strong>Address:</strong>{" "}
                            {selectedAssignment.address || "Not available"}
                        </p>
                        <p>
                            <strong>Area:</strong>{" "}
                            {selectedAssignment.area || "Not available"}
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-700">
                        Visit Outcome *
                    </label>

                    <select
                        name="outcome"
                        value={form.outcome}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                        {OUTCOMES.map((outcome) => (
                            <option
                                key={outcome.value}
                                value={outcome.value}
                            >
                                {outcome.label}
                            </option>
                        ))}
                    </select>
                </div>

                {form.outcome === "follow-up-required" && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">
                                Next Follow-up Date *
                            </label>

                            <input
                                type="date"
                                name="nextFollowUpDate"
                                required
                                min={new Date().toISOString().split("T")[0]}
                                value={form.nextFollowUpDate}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">
                                Follow-up Remarks
                            </label>

                            <textarea
                                name="followUpRemarks"
                                rows={2}
                                value={form.followUpRemarks}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-700">
                        Visit Remarks
                    </label>

                    <textarea
                        name="remarks"
                        rows={4}
                        value={form.remarks}
                        onChange={handleChange}
                        placeholder="Product feedback, stock observations, discussion details..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-1.5 text-base font-semibold text-slate-900">
                            <MapPin className="h-4 w-4 text-indigo-600" />
                            GPS & Reverse Geocoding
                        </h2>

                        <button
                            type="button"
                            onClick={fetchCurrentLocation}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${
                                    status === "loading" ? "animate-spin" : ""
                                }`}
                            />
                            Refresh GPS
                        </button>
                    </div>

                    {status === "loading" && (
                        <p className="text-xs text-slate-500">
                            Acquiring GPS coordinates...
                        </p>
                    )}

                    {error && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    setManualCoords(27.6833, 84.4333)
                                }
                                className="font-medium underline"
                            >
                                Use Sample GPS (Bharatpur)
                            </button>
                        </div>
                    )}

                    {coords && (
                        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                            <p>
                                <strong>Coordinates:</strong>{" "}
                                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                {" "} (±{Math.round(coords.accuracy || 0)}m)
                            </p>

                            <p>
                                <strong>Address:</strong>{" "}
                                {coords.address}
                            </p>
                        </div>
                    )}

                    <p className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Visit timestamp recorded automatically.
                    </p>
                </div>

                <CameraCaptureBox
                    coords={coords}
                    photo={photo}
                    onPhotoChange={setPhoto}
                />

                <button
                    type="submit"
                    disabled={
                        submitting ||
                        loadingAssignments ||
                        assignments.length === 0 ||
                        !form.assignmentId
                    }
                    className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                    {submitting ? "Saving Visit..." : "Submit Field Visit"}
                </button>
            </div>
        </form>
    );
}
