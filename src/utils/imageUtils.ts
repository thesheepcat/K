/**
 * Image processing utilities for profile images
 */

/**
 * Resize and crop image to 48x48px square
 * Accepts PNG, JPEG, or BMP formats
 * If rectangular, automatically crops to square from center
 */
export const processProfileImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Invalid file format. Please select PNG, JPEG, or BMP image.'));
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file is too large. Please select a file smaller than 5MB.'));
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }
    
    img.onload = () => {
      try {
        // Set canvas size to 48x48
        canvas.width = 48;
        canvas.height = 48;
        
        // Calculate crop dimensions to maintain aspect ratio
        const minDimension = Math.min(img.width, img.height);
        const cropX = (img.width - minDimension) / 2;
        const cropY = (img.height - minDimension) / 2;
        
        // Draw the image cropped and resized to 48x48
        ctx.drawImage(
          img,
          cropX, cropY, minDimension, minDimension,
          0, 0, 48, 48
        );
        
        // Convert to base64 (PNG format)
        const base64 = canvas.toDataURL('image/png');
        const base64Data = base64.split(',')[1]; // Remove data:image/png;base64, prefix
        resolve(base64Data);
      } catch (error) {
        reject(new Error('Failed to process image'));
      } finally {
        // Clean up object URL
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate nickname format (no emojis allowed)
 */
export const validateNickname = (nickname: string): { isValid: boolean; error?: string } => {
  if (!nickname || !nickname.trim()) {
    return { isValid: false, error: 'Nickname is required' };
  }

  if (nickname.length > 20) {
    return { isValid: false, error: 'Nickname must be 20 characters or less' };
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  if (emojiRegex.test(nickname)) {
    return { isValid: false, error: 'Nickname cannot contain emojis' };
  }

  return { isValid: true };
};