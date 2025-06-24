// Validate latitude and longitude coordinates
exports.validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Latitude must be between -90 and 90
  if (lat < -90 || lat > 90) {
    return false;
  }

  // Longitude must be between -180 and 180
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}; 