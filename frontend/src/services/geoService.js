export async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { formattedAddress: '', areaName: 'Unassigned Area' };
  }

  const baseUrl =
    import.meta.env.VITE_REVERSE_GEOCODE_URL ||
    'https://nominatim.openstreetmap.org/reverse';

  try {
    const url = `${baseUrl}?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    const addr = data.address || {};
    const areaName =
      addr.suburb ||
      addr.neighbourhood ||
      addr.city_district ||
      addr.city ||
      addr.town ||
      'Field Zone';

    return {
      formattedAddress: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      areaName,
    };
  } catch {
    return {
      formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      areaName: 'Field Zone',
    };
  }
}