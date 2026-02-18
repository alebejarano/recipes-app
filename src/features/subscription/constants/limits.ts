export const FREE_PLAN_MAX_RECIPES = 100
export const FREE_PLAN_MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024
export const FREE_PLAN_MAX_IMPORT_TOTAL_BYTES = 50 * 1024 * 1024
export const RECIPE_IMAGE_MASTER_MAX_DIMENSION_PX = 960
export const RECIPE_IMAGE_MASTER_COMPRESS_QUALITY = 0.78
export const RECIPE_IMAGE_MASTER_MAX_FILE_BYTES = 1 * 1024 * 1024
export const RECIPE_IMAGE_MASTER_TOO_LARGE_MESSAGE =
  'This image is still larger than 1MB after optimization. Please choose another photo.'
export const IMPORT_FILE_TOO_LARGE_MESSAGE =
  'This file is larger than 10MB. Please choose a smaller file.'
export const IMPORT_ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const IMPORT_ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const
