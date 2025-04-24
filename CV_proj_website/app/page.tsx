import { Upload } from "@/components/upload"
import { ImageGallery } from "@/components/image-gallery"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Check Parking Lot Occupancy</h1>
        <p className="text-gray-700 mb-8">Upload your Parking Lot images and visualize the results</p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Upload Parking Lot Images</h2>
          <Upload />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Featured Parking Lots</h2>
          <ImageGallery
            images={[
              "/placeholder.svg?height=300&width=400",
              "/placeholder.svg?height=300&width=400",
              "/placeholder.svg?height=300&width=400",
              "/placeholder.svg?height=300&width=400",
              "/placeholder.svg?height=300&width=400",
              "/placeholder.svg?height=300&width=400",
            ]}
          />
        </div>
      </div>
    </main>
  )
}
