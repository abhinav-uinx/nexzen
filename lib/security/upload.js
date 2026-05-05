const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MIME_TO_EXTENSION = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file, { required = false } = {}) {
  if (!file || typeof file !== 'object' || typeof file.size !== 'number') {
    if (required) {
      throw new Error('Image file is required.')
    }

    return null
  }

  if (file.size === 0) {
    if (required) {
      throw new Error('Image file is required.')
    }

    return null
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Only PNG, JPG, and WebP images are allowed.')
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Images must be 5MB or smaller.')
  }

  return {
    extension: MIME_TO_EXTENSION[file.type] || '.bin',
  }
}
