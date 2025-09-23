import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
  error?: string | null
  acceptedTypes?: string[]
}

export const FileUpload = ({
  onFileSelect,
  isLoading = false,
  error = null,
  acceptedTypes = ['.csv', '.xlsx'],
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!acceptedTypes.includes(fileExtension)) {
      return // Let parent handle validation error
    }

    onFileSelect(file)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const uploadAreaClasses = [
    'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
    'min-h-touch-target cursor-pointer',
    isDragOver
      ? 'border-primary-500 bg-primary-50'
      : error
      ? 'border-danger-500 bg-danger-50'
      : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-25',
  ].join(' ')

  if (isLoading) {
    return (
      <div className="border-2 border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Processing file...</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Please wait while we parse your transaction data.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        data-testid="file-upload-area"
        className={uploadAreaClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Drop your file here' : 'Upload CSV or Excel file'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop your transaction file, or{' '}
              <span className="text-primary-600 font-medium">click to browse</span>
            </p>
          </div>

          {/* File Requirements */}
          <div className="text-xs text-gray-400 space-y-1">
            <p>Supported formats: {acceptedTypes.join(', ')}</p>
            <p>Required columns: date, amount, category, description, merchant</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-danger-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger-800">
                Upload Error
              </h3>
              <p className="text-sm text-danger-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          onClick={() => {
            // This could open a modal with sample CSV format or help
          }}
        >
          Need help formatting your CSV? View sample format
        </button>
      </div>
    </div>
  )
}