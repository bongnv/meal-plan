# Image Upload Feature - Implementation Plan

## Feature Overview

Allow users to upload images for recipes with user-provided imgbb API key stored in Dexie and synced to cloud. Users can choose between:
1. **URL Input** (existing) - paste image URL from web
2. **File Upload** (new) - upload image file to imgbb

**Architecture Choice:** Option 3 (User-Provided API Key) + Hybrid URL/Upload
- API key stored in Dexie metadata table
- API key synced to cloud via existing sync mechanism
- Keep existing URL field for flexibility
- Each user manages their own imgbb API quota

## Implementation Steps (Top-Down, Integrate-First)

### Phase 1: API Key Management & Storage

#### 1. Update Dexie metadata schema to support settings
- **Location:** `src/db/database.ts`
- **Changes:**
  - Update `Metadata` interface to support string values: `{ key: string; value: string | number }`
  - Add helper methods:
    ```typescript
    async getSettings(key: string): Promise<string | null>
    async updateSettings(key: string, value: string): Promise<void>
    ```
  - Keys: `'imgbbApiKey'`, `'imageUploadProvider'` (future: imgur, etc.)
- **Tests:** `src/db/database.test.ts`
  - Test string value storage in metadata
  - Test getSettings/updateSettings methods
  - Test backward compatibility with number values (lastModified)

#### 2. Update SyncService to include metadata in sync
- **Location:** `src/services/syncService.ts`
- **Changes:**
  - Add `settings: Record<string, string>` to `SyncData` interface
  - Update `SyncDataSchema` with settings validation
  - Modify `exportData()` to include metadata settings (filter out `lastModified`, `schemaVersion`)
  - Modify `importData()` to restore settings from cloud
  - Cloud file format:
    ```json
    {
      "recipes": [...],
      "ingredients": [...],
      "settings": {
        "imgbbApiKey": "user-key-here",
        "imageUploadProvider": "imgbb"
      },
      "lastModified": 123456,
      "version": 3
    }
    ```
- **Tests:** `src/services/syncService.test.ts`
  - Test settings export to cloud
  - Test settings import from cloud
  - Test settings sync with LWW strategy
  - Test backward compatibility with files without settings

#### 3. Create image upload configuration and types
- **Location:** `src/config/imageUpload.ts`
- **Content:**
  ```typescript
  export const IMAGE_UPLOAD_CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  }

  export type ImageUploadProvider = 'imgbb' | 'imgur' // future: add more
  
  export interface ImageUploadResult {
    url: string
    deleteUrl?: string
    provider: ImageUploadProvider
  }
  ```

#### 4. Create imgbb upload service (stateless)
- **Location:** `src/services/imageUploadService.ts`
- **Methods:**
  ```typescript
  /**
   * Upload image file to imgbb
   * @param file - Image file to upload
   * @param apiKey - User's imgbb API key
   * @returns Promise<ImageUploadResult>
   */
  async function uploadToImgbb(file: File, apiKey: string): Promise<ImageUploadResult>

  /**
   * Validate image file before upload
   * @param file - Image file to validate
   * @throws Error if validation fails
   */
  function validateImageFile(file: File): void
  ```
- **Implementation:**
  - Use `FormData` to build multipart request
  - POST to `https://api.imgbb.com/1/upload?key={apiKey}`
  - Handle errors (invalid key, file too large, network errors)
  - Return standardized result with URL
- **Tests:** `src/services/imageUploadService.test.ts`
  - Test successful upload (mock fetch)
  - Test file validation (size, type, extension)
  - Test invalid API key error
  - Test network error handling
  - Test file size exceeds limit
  - Test unsupported file type

### Phase 2: Settings UI for API Key

#### 5. Create Settings page structure
- **Location:** `src/pages/SettingsPage.tsx`
- **Changes:**
  - Create new page component
  - Use Mantine `Tabs` component for sections:
    - "Cloud Sync" tab (existing CloudSyncSettings)
    - "Image Upload" tab (new ImageUploadSettings)
  - Update routing in `App.tsx`: `/settings` route
- **UI:** Simple tabbed layout with clear navigation

#### 6. Build ImageUploadSettings component (TDD)
- **Location:** `src/components/settings/ImageUploadSettings.tsx`
- **Features:**
  - Display current provider (imgbb)
  - API key input (password field with show/hide toggle)
  - "Save" button to store key
  - "Test Connection" button to verify key works
  - Help text with link to get imgbb API key: `https://api.imgbb.com/`
  - Status indicator: "✓ Connected" or "⚠ Not configured"
- **Tests:** `src/components/settings/ImageUploadSettings.test.tsx`
  - Test renders form fields
  - Test save API key
  - Test test connection button
  - Test error handling (invalid key)
  - Test help text and links
  - Test status indicators
- **UI Flow:**
  1. User enters API key
  2. Clicks "Test Connection"
  3. Service makes test upload (1x1 pixel image)
  4. If successful: save key to Dexie, show success notification
  5. If failed: show error message, don't save

#### 7. Add Settings link to navigation
- **Location:** `src/components/layout/Navigation.tsx` or main nav component
- **Changes:**
  - Add "Settings" navigation link
  - Icon: `IconSettings` from Tabler Icons
  - Position: After "Ingredients" in nav menu

### Phase 3: RecipeForm Image Upload UI

#### 8. Create ImageUploadInput component (TDD)
- **Location:** `src/components/recipes/ImageUploadInput.tsx`
- **Props:**
  ```typescript
  interface ImageUploadInputProps {
    value?: string // current image URL
    onChange: (url: string | undefined) => void
    error?: string
  }
  ```
- **Features:**
  - Two input modes (tabs or toggle):
    - "URL" mode: TextInput for pasting URLs (existing behavior)
    - "Upload" mode: FileButton + preview
  - Image preview for both modes
  - Upload progress indicator
  - "Remove image" button when image exists
  - Disabled state when API key not configured
  - Error display for upload failures
- **Tests:** `src/components/recipes/ImageUploadInput.test.tsx`
  - Test URL mode renders and works
  - Test Upload mode renders and works
  - Test file selection triggers upload
  - Test upload progress shown
  - Test successful upload updates value
  - Test upload error displayed
  - Test disabled when no API key
  - Test preview for URL and uploaded images
  - Test remove image button
- **UI Design:**
  ```
  ┌─────────────────────────────────────────┐
  │ Image (optional)                        │
  │                                         │
  │ [URL] [Upload]  ← tabs/toggle           │
  │                                         │
  │ URL Tab:                                │
  │ ┌─────────────────────────────────────┐ │
  │ │ https://example.com/image.jpg       │ │
  │ └─────────────────────────────────────┘ │
  │                                         │
  │ Upload Tab:                             │
  │ [Choose File]  myimage.jpg  [X Remove] │
  │                                         │
  │ Preview:                                │
  │ ┌──────────────┐                        │
  │ │   [Image]    │                        │
  │ └──────────────┘                        │
  └─────────────────────────────────────────┘
  ```

#### 9. Integrate ImageUploadInput into RecipeForm (TDD)
- **Location:** `src/components/recipes/RecipeForm.tsx`
- **Changes:**
  - Replace existing TextInput for imageUrl with `<ImageUploadInput />`
  - Check if API key configured, show hint if not:
    - "Upload disabled. Configure API key in Settings to upload images."
  - Handle upload in progress state (disable form submission)
  - Update form validation to accept uploaded URLs
- **Tests:** `src/components/recipes/RecipeForm.test.tsx`
  - Test ImageUploadInput renders
  - Test URL mode works (existing tests)
  - Test upload mode works
  - Test form submission with uploaded image
  - Test hint shown when API key not configured
  - Test form disabled during upload

### Phase 4: Quality Assurance & Polish

#### 10. End-to-end testing
- **Manual Testing Checklist:**
  - [ ] Configure API key in Settings
  - [ ] Test connection with valid key
  - [ ] Test connection with invalid key
  - [ ] Create recipe with URL image (existing)
  - [ ] Create recipe with uploaded image
  - [ ] Edit recipe and change image (URL → Upload)
  - [ ] Edit recipe and change image (Upload → URL)
  - [ ] Remove image from recipe
  - [ ] Verify image displays in RecipeDetail
  - [ ] Verify image displays in meal plan cards
  - [ ] Test sync: settings should sync to cloud
  - [ ] Test sync: switch files, API key persists per file
  - [ ] Test offline: upload fails gracefully
  - [ ] Test file validation (wrong type, too large)

#### 11. Run all quality checks
- Execute test suite: `npm test`
- Check coverage for new code
- Run linter: `npm run lint`
- Build check: `npm run build`
- Save outputs to `tmp/image-upload-final-checks.txt`

#### 12. Update documentation
- Update REQUIREMENTS.md checkbox for image upload feature
- Add section to README.md explaining:
  - How to get imgbb API key
  - How to configure in Settings
  - Upload vs URL modes
- Update ARCHITECTURE.md with:
  - Image upload service description
  - Settings storage in metadata table
  - Sync behavior for settings

## Migration Strategy

**No breaking changes:**
- Existing recipes with `imageUrl` continue to work
- New `Metadata` schema is backward compatible (supports both string and number values)
- Sync service handles files with/without settings gracefully
- Users without API key can still use URL mode

**Cloud File Version:**
- Bump to `version: 4` when settings are added
- Older clients (v3) ignore settings field (no error)
- Newer clients (v4) read settings if present

## User Experience Flow

### First-Time Setup
1. User creates/edits recipe
2. Sees "Upload" tab but it's disabled
3. Click shows hint: "Configure API key in Settings"
4. Navigate to Settings → Image Upload
5. Follow link to get imgbb key
6. Paste key, click "Test Connection"
7. Success: key saved, return to recipe form
8. Upload now works

### Ongoing Usage
1. User creates recipe
2. Choose URL or Upload tab based on preference
3. URL: paste link (fast, no upload needed)
4. Upload: select file, auto-uploads, shows preview
5. Recipe saved with imageUrl (regardless of source)

## Testing Strategy

**Unit Tests:**
- Database metadata methods
- Sync service with settings
- Image upload service (mocked fetch)
- Image validation logic
- Component logic

**Integration Tests:**
- Settings save → sync → load on different device
- Upload image → save recipe → display in list
- Switch between URL and Upload modes

**Manual Tests:**
- End-to-end flows (checklist in step 10)
- Error scenarios
- Network failures
- Invalid API keys

## Future Enhancements

**Phase 2 Features (Not in this implementation):**
- Support additional providers (Imgur, Cloudinary)
- Image cropping/resizing before upload
- Batch upload for multiple recipes
- Image gallery/library for reuse
- Automatic image optimization
- Delete uploaded images from imgbb (using delete URL)

## Acceptance Criteria

- [ ] Users can configure imgbb API key in Settings
- [ ] API key is stored in Dexie and synced to cloud
- [ ] Users can upload image files from RecipeForm
- [ ] Users can still paste image URLs (existing feature preserved)
- [ ] Upload shows progress and errors appropriately
- [ ] File validation prevents invalid uploads
- [ ] Images display correctly after upload
- [ ] Settings sync across devices
- [ ] All tests pass with >80% coverage on new code
- [ ] Documentation updated
