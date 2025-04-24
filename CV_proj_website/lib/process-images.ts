// This is a client-side mock for development/preview
// In a real implementation, these functions would call server actions

// Function to process a zip file containing images
export async function processZipFile(file: File): Promise<string[]> {
  const formData = new FormData()
  formData.append("file", file)

  try {
    console.log("Starting zip file processing...")
    const response = await fetch('/api/process-images', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
      throw new Error(`Failed to process images: ${errorText}`)
    }
    
    const data = await response.json()
    console.log("Received processed images:", data.images)
    return data.images
  } catch (error) {
    console.error("Error processing zip file:", error)
    throw error
  }
}

// Function to process additional images
export async function processAdditionalImages(file: File): Promise<string[]> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("isAdditional", "true")

  try {
    console.log("Starting additional image processing...")
    const response = await fetch('/api/process-images', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", errorText)
      throw new Error(`Failed to process images: ${errorText}`)
    }
    
    const data = await response.json()
    console.log("Received processed images:", data.images)
    return data.images
  } catch (error) {
    console.error("Error processing additional images:", error)
    throw error
  }
}
