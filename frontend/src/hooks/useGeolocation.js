import { useState, useCallback } from 'react';
import { reverseGeocode } from '../services/geoService';

export function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy, address, areaName }
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState('');

  const fetchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setStatus('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const geo = await reverseGeocode(lat, lng);

        setCoords({
          lat,
          lng,
          accuracy,
          address: geo.formattedAddress,
          areaName: geo.areaName,
        });
        setStatus('ready');
      },
      (err) => {
        setStatus('error');
        setError(err.message || 'Unable to retrieve GPS position.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, []);

  const setManualCoords = useCallback(async (lat, lng) => {
    setStatus('loading');
    setError('');
    const geo = await reverseGeocode(lat, lng);
    setCoords({
      lat,
      lng,
      accuracy: 10,
      address: geo.formattedAddress,
      areaName: geo.areaName,
    });
    setStatus('ready');
  }, []);

  return { coords, status, error, fetchCurrentLocation, setManualCoords };
}