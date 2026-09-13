/** Web menyu — brauzer GPS konumu */

export function requestBrowserLocation({ fresh = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: "unsupported", message: "Brauzer konum dəstəkləmir." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        resolve({
          latitude: lat,
          longitude: lng,
          location_maps_url: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      },
      (err) => {
        reject({
          code: err.code === 1 ? "denied" : "failed",
          message:
            err.code === 1
              ? "Konum icazəsi verilmədi."
              : "Konum alına bilmədi.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: fresh ? 0 : 120000,
      }
    );
  });
}
