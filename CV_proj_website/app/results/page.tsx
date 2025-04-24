"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Upload } from "@/components/upload"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [images, setImages] = useState<string[]>([])
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAdditionalIndex, setCurrentAdditionalIndex] = useState(0)

  useEffect(() => {
    const imagePaths = searchParams.get("images")?.split(",") || []
    // Limit to first 10 images
    setImages(imagePaths.slice(0, 10))
    setLoading(false)
  }, [searchParams])

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const nextAdditionalImage = () => {
    setCurrentAdditionalIndex((prevIndex) => (prevIndex + 1) % additionalImages.length)
  }

  const prevAdditionalImage = () => {
    setCurrentAdditionalIndex((prevIndex) => (prevIndex - 1 + additionalImages.length) % additionalImages.length)
  }

  const handleAdditionalUpload = (newImages: string[]) => {
    setAdditionalImages(prev => [...prev, ...newImages.slice(0, 10)])
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">Processing Results</h1>
        
        {images.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>No images to display. Please upload a ZIP file first.</p>
          </div>
        ) : (
          <>
            <div className="relative w-full mb-12">
              {/* Main Image Display */}
              <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-xl bg-white">
                <Image
                  src={`/${images[currentIndex]}`}
                  alt={`Processed image ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Main Navigation Controls */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={prevImage}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span>Previous</span>
                </button>
                
                {/* Image Counter */}
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  {currentIndex + 1} / {images.length}
                </div>

                <button
                  onClick={nextImage}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-lg transition-colors flex items-center gap-2"
                  aria-label="Next image"
                >
                  <span>Next</span>
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Additional Images Section */}
            <div className="bg-white rounded-lg p-6 mb-12 border border-gray-200 shadow-lg">
              <h2 className="text-2xl font-semibold text-blue-600 mb-4">Additional Images</h2>
              <Upload onUploadComplete={handleAdditionalUpload} isAdditional={true} />
              
              {additionalImages.length > 0 && (
                <div className="mt-8">
                  {/* Additional Images Display */}
                  <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-xl bg-white">
                    <Image
                      src={`/${additionalImages[currentAdditionalIndex]}`}
                      alt={`Additional image ${currentAdditionalIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>

                  {/* Additional Images Navigation */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={prevAdditionalImage}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-lg transition-colors flex items-center gap-2"
                      aria-label="Previous additional image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                      <span>Previous</span>
                    </button>
                    
                    {/* Additional Images Counter */}
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      {currentAdditionalIndex + 1} / {additionalImages.length}
                    </div>

                    <button
                      onClick={nextAdditionalImage}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-lg transition-colors flex items-center gap-2"
                      aria-label="Next additional image"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
