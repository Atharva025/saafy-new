/**
 * Compresses an image file (PNG/JPG) using HTML5 Canvas to a standard size (300x300 JPEG)
 * to ensure database storage efficiency and smooth network retrieval.
 *
 * @param {File} file - The uploaded image file
 * @param {number} maxWidth - Target width
 * @param {number} maxHeight - Target height
 * @param {number} quality - JPEG compression quality (0 to 1)
 * @returns {Promise<string>} Base64 Data URL of compressed image
 */
export function compressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Crop/Resize to fit exactly square aspect ratio (as playlists are square)
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const ctx = canvas.getContext('2d');

        // Draw image cropped in the center as a square
        const minSize = Math.min(width, height);
        const sx = (width - minSize) / 2;
        const sy = (height - minSize) / 2;

        ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, maxWidth, maxHeight);

        // Export to JPEG Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
