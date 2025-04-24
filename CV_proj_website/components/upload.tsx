"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UploadIcon, Loader2 } from "lucide-react"
import { processZipFile, processAdditionalImages } from "@/lib/process-images"

interface UploadProps {
  onUploadComplete?: (images: string[]) => void
  isAdditional?: boolean
}

export function Upload({ onUploadComplete, isAdditional = false }: UploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setIsUploading(true)
    setError(null)

    try {
      console.log("Starting file upload:", file.name)
      
      if (isAdditional) {
        // For additional uploads - allow both images and zip files
        if (file.type.startsWith("image/") || file.name.endsWith(".zip")) {
          const images = file.name.endsWith(".zip") ? 
            await processZipFile(file) : 
            await processAdditionalImages(file)
          console.log("Additional files processed:", images)
          if (onUploadComplete) {
            onUploadComplete(images)
          }
        } else {
          setError("Please upload an image file or ZIP file")
        }
      } else {
        // For initial zip upload
        if (file.name.endsWith(".zip")) {
          const images = await processZipFile(file)
          console.log("Zip file processed, images:", images)
          if (images && images.length > 0) {
            const queryString = `images=${images.join(",")}`
            console.log("Navigating to results with query:", queryString)
            router.push(`/results?${queryString}`)
          } else {
            setError("No images were processed from the ZIP file")
          }
        } else {
          setError("Please upload a ZIP file")
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 w-full max-w-2xl mx-auto text-center cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={isAdditional ? "image/*,.zip" : ".zip"}
        />

        <UploadIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />

        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {isAdditional ? "Upload Additional Files" : "Upload Project Images (ZIP)"}
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          {isAdditional
            ? "Click or drag and drop image files or a ZIP file"
            : "Click or drag and drop a ZIP file containing your project images"}
        </p>

        {fileName && <p className="text-sm font-medium text-blue-600 mt-2">Selected: {fileName}</p>}
        {error && <p className="text-sm font-medium text-red-600 mt-2">{error}</p>}

        <Button onClick={handleButtonClick} className="mt-4 bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" />
              {isAdditional ? "Select Files" : "Select ZIP File"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
