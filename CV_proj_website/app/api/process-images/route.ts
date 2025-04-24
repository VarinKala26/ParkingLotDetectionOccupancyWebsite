import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import * as fs from "fs"
import * as path from "path"

const execAsync = promisify(exec)

// This is a server-side API route
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const isAdditional = formData.get("isAdditional") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Save the uploaded file to the input directory
    const inputDir = path.join(process.cwd(), "input")
    const filePath = path.join(inputDir, file.name)
    
    // Ensure input directory exists
    if (!fs.existsSync(inputDir)) {
      fs.mkdirSync(inputDir, { recursive: true })
    }

    // Write the file
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    // Call the Python script with proper path handling
    const pythonScript = path.join(process.cwd(), "python", "process_zip.py")
    const isZip = file.name.toLowerCase().endsWith('.zip')
    const command = `python3 "${pythonScript}" "${filePath}" "${isZip}"`
    console.log("Executing command:", command)
    
    const { stdout, stderr } = await execAsync(command)
    
    if (stderr) {
      console.error("Python script error:", stderr)
      // throw new Error(`Python script error: ${stderr}`)
    }
    
    // Get the processed image paths
    const processedImages = stdout.trim().split("\n").filter(Boolean)
    
    // Clean up the input file
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.error("Error cleaning up input file:", error)
    }
    
    // The paths are already relative to the public directory
    return NextResponse.json({ images: processedImages })
  } catch (error) {
    console.error("Error processing images:", error)
    return NextResponse.json({ error: "Failed to process images" }, { status: 500 })
  }
}
