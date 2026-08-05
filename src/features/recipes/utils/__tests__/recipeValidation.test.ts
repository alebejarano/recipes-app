import {
    exceedsImportStorageLimit,
    isImportFileTooLarge,
    isRecipeImageUploadTooLarge,
} from '../recipeValidation'
import {
    FREE_PLAN_MAX_IMPORT_FILE_BYTES,
    FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
    PREMIUM_PLAN_MAX_STORAGE_BYTES,
    RECIPE_IMAGE_UPLOAD_MAX_FILE_BYTES,
} from '@/features/subscription/constants/limits'

describe('recipe image and import limits', () => {
    it('rejects an image only when it exceeds the upload limit', () => {
        expect(isRecipeImageUploadTooLarge(RECIPE_IMAGE_UPLOAD_MAX_FILE_BYTES)).toBe(false)
        expect(isRecipeImageUploadTooLarge(RECIPE_IMAGE_UPLOAD_MAX_FILE_BYTES + 1)).toBe(true)
    })

    it('rejects an import file only when it exceeds the per-file limit', () => {
        expect(isImportFileTooLarge(FREE_PLAN_MAX_IMPORT_FILE_BYTES)).toBe(false)
        expect(isImportFileTooLarge(FREE_PLAN_MAX_IMPORT_FILE_BYTES + 1)).toBe(true)
    })

    it('accounts for replaced files when checking total storage', () => {
        expect(exceedsImportStorageLimit({
            currentBytes: FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
            replacingBytes: 2,
            nextBytes: 2,
            plan: 'free',
        })).toBe(false)
        expect(exceedsImportStorageLimit({
            currentBytes: FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
            nextBytes: 1,
            plan: 'free',
        })).toBe(true)
    })

    it('uses the larger premium storage limit for premium users', () => {
        expect(exceedsImportStorageLimit({
            currentBytes: FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
            nextBytes: 1,
            plan: 'premium',
        })).toBe(false)
        expect(exceedsImportStorageLimit({
            currentBytes: PREMIUM_PLAN_MAX_STORAGE_BYTES,
            nextBytes: 1,
            plan: 'premium',
        })).toBe(true)
    })
})
