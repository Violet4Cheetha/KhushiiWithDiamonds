interface UploadFile {
  name: string
  data: string // base64 encoded
  mimeType: string
}

interface UploadResponse {
  success: boolean
  folderId: string
  folderPath: string
  files: Array<{
    originalName: string
    driveFileId: string
    fileName: string
    directUrl: string
    webViewLink: string
  }>
  imageUrls: string[]
  error?: string
  details?: string
}

export class GoogleDriveUploadService {
  private static readonly EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-drive`

  /**
   * Convert File objects to base64 encoded data
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Determine folder path based on category hierarchy
   */
  private static getFolderPath(
    itemType: 'category' | 'jewelry',
    category?: string,
    parentCategory?: string
  ): string {
    const basePath = 'WebCatalog(DO NOT EDIT)'
    
    if (itemType === 'category') {
      return basePath
    }
    
    // For jewelry items
    if (parentCategory && category) {
      return `${basePath}/${parentCategory}/${category}`
    } else if (category) {
      return `${basePath}/${category}`
    }
    
    return basePath
  }

  /**
   * Upload files to Google Drive
   */
  static async uploadFiles(
    files: File[],
    itemName: string,
    itemType: 'category' | 'jewelry',
    category?: string,
    parentCategory?: string
  ): Promise<UploadResponse> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload')
      }

      // Convert files to base64
      const uploadFiles: UploadFile[] = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await this.fileToBase64(file),
          mimeType: file.type,
        }))
      )

      // Determine folder path
      const folderPath = this.getFolderPath(itemType, category, parentCategory)

      // Prepare request payload
      const requestPayload = {
        files: uploadFiles,
        folderPath,
        itemName,
        itemType,
      }

      // Call the edge function
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: UploadResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      return result

    } catch (error) {
      console.error('Google Drive upload error:', error)
      throw error
    }
  }

  /**
   * Upload category images
   */
  static async uploadCategoryImages(
    files: File[],
    categoryName: string
  ): Promise<string[]> {
    const result = await this.uploadFiles(files, categoryName, 'category')
    return result.imageUrls
  }

  /**
   * Upload jewelry item images
   */
  static async uploadJewelryImages(
    files: File[],
    itemName: string,
    category: string,
    parentCategory?: string
  ): Promise<string[]> {
    const result = await this.uploadFiles(files, itemName, 'jewelry', category, parentCategory)
    return result.imageUrls
  }
}

export default GoogleDriveUploadService