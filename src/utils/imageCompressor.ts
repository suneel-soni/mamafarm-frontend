/**
 * Compresses an image file client-side using HTML5 Canvas to ensure
 * its size does not exceed maxKb (default: 100KB).
 */
export async function compressImageToMaxKb(
  file: File,
  maxKb: number = 100,
  maxWidth: number = 600,
  maxHeight: number = 600
): Promise<{ base64: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down dimensions proportionately
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not initialize canvas context.'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress with decreasing quality step
        let quality = 0.85;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        let sizeInBytes = Math.round((base64.length * 3) / 4);

        while (sizeInBytes > maxKb * 1024 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
          sizeInBytes = Math.round((base64.length * 3) / 4);
        }

        const finalKb = Math.round(sizeInBytes / 1024);

        if (finalKb > maxKb) {
          return reject(
            new Error(
              `Photo size (${finalKb}KB) exceeds maximum 100KB limit even after compression. Please select a smaller photo.`
            )
          );
        }

        resolve({ base64, sizeKb: finalKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
