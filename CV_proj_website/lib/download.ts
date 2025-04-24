// Client-side download functionality
export async function downloadImages(images: string[]): Promise<void> {
  try {
    // Import JSZip and file-saver dynamically to avoid issues in SSR
    const [JSZip, { saveAs }] = await Promise.all([import("jszip").then((mod) => mod.default), import("file-saver")])

    const zip = new JSZip()
    const imgFolder = zip.folder("processed-images")

    // For each image URL, fetch the image and add it to the zip
    const fetchPromises = images.map(async (imageUrl, index) => {
      try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        imgFolder?.file(`image-${index + 1}.${getExtensionFromMimeType(blob.type)}`, blob)
      } catch (error) {
        console.error(`Failed to fetch image ${imageUrl}:`, error)
      }
    })

    await Promise.all(fetchPromises)

    // Generate the zip file and trigger download
    const content = await zip.generateAsync({ type: "blob" })
    saveAs(content, "processed-images.zip")
  } catch (error) {
    console.error("Error downloading images:", error)
    throw error
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  }

  return mimeToExt[mimeType] || "jpg"
}
