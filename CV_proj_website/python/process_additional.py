#!/usr/bin/env python3
"""
This script processes additional images uploaded by the user.
It applies different processing than the initial zip file processing.
"""

import sys
import os
import json
from PIL import Image, ImageOps, ImageEnhance

def process_additional_image(image_path):
    """Apply special processing to additional images and return the path to the processed image."""
    try:
        # Open the image
        img = Image.open(image_path)
        
        # Apply different processing (example: convert to grayscale and apply edge enhancement)
        img = ImageOps.grayscale(img)  # Convert to grayscale
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(2.0)  # Increase sharpness
        
        # Save the processed image
        filename = os.path.basename(image_path)
        processed_dir = os.path.join(os.path.dirname(image_path), 'additional_processed')
        os.makedirs(processed_dir, exist_ok=True)
        processed_path = os.path.join(processed_dir, f"additional_{filename}")
        img.save(processed_path)
        
        return processed_path
    except Exception as e:
        print(f"Error processing additional image {image_path}: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_additional.py <image_file_path>", file=sys.stderr)
        sys.exit(1)
    
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}", file=sys.stderr)
        sys.exit(1)
    
    processed_path = process_additional_image(image_path)
    
    # In a real implementation, you would return the actual path to the processed image.
    # For this demo, we'll return placeholder paths.
    processed_images = [
        "/placeholder.svg?height=400&width=600&text=Additional+1",
        "/placeholder.svg?height=400&width=600&text=Additional+2"
    ]
    
    print(json.dumps(processed_images))
