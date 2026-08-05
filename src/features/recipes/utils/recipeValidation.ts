import {
    FREE_PLAN_MAX_IMPORT_FILE_BYTES,
    FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
    PREMIUM_PLAN_MAX_STORAGE_BYTES,
    RECIPE_IMAGE_UPLOAD_MAX_FILE_BYTES,
} from '@/features/subscription/constants/limits'

export type RecipeImageUploadPlan = 'free' | 'premium'

export function isRecipeImageUploadTooLarge(fileBytes: number) {
    return fileBytes > RECIPE_IMAGE_UPLOAD_MAX_FILE_BYTES
}

export function isImportFileTooLarge(fileBytes: number) {
    return fileBytes > FREE_PLAN_MAX_IMPORT_FILE_BYTES
}

export function exceedsImportStorageLimit(input: {
    currentBytes: number
    replacingBytes?: number
    nextBytes: number
    plan: RecipeImageUploadPlan
}) {
    const limit = input.plan === 'premium'
        ? PREMIUM_PLAN_MAX_STORAGE_BYTES
        : FREE_PLAN_MAX_IMPORT_TOTAL_BYTES
    return input.currentBytes - (input.replacingBytes ?? 0) + input.nextBytes > limit
}
