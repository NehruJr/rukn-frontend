/**
 * Utility functions for panorama processing and Photo Sphere Viewer panoData calculation
 */

export const calculatePanoData = ({
  imageWidth,
  imageHeight,
  horizontalCoverageDegrees = 360,
  verticalCoverageDegrees = 180
}) => {
  // A full 360 equirectangular sphere has a 2:1 aspect ratio
  // If the image is partial (e.g. mobile phone panorama spanning 180 deg horizontally),
  // we calculate the hypothetical full sphere dimensions and offsets.
  const isFullSphere = Math.abs(imageWidth / imageHeight - 2) < 0.1 && horizontalCoverageDegrees >= 350;

  if (isFullSphere) {
    return {
      isPartial: false,
      fullWidth: imageWidth,
      fullHeight: imageHeight,
      croppedWidth: imageWidth,
      croppedHeight: imageHeight,
      croppedX: 0,
      croppedY: 0
    };
  }

  // Calculate full sphere width based on horizontal coverage degrees
  const fullWidth = Math.round((imageWidth / horizontalCoverageDegrees) * 360);
  const fullHeight = Math.round(fullWidth / 2);

  // Position cropped panorama vertically centered in the sphere
  const croppedX = 0;
  const croppedY = Math.max(0, Math.round((fullHeight - imageHeight) / 2));

  return {
    isPartial: true,
    fullWidth,
    fullHeight,
    croppedWidth: imageWidth,
    croppedHeight: imageHeight,
    croppedX,
    croppedY
  };
};

export const getImageDimensions = (urlOrBlob) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = urlOrBlob;
  });
};

export default {
  calculatePanoData,
  getImageDimensions
};
