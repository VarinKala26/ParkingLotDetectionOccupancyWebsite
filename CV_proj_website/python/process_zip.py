#!/usr/bin/env python3
"""
This script processes a zip file containing images or individual image files.
It extracts/copies the images, processes them, and returns the paths to the processed images.
"""

import sys
import os
import json
import zipfile
import tempfile
from PIL import Image, ImageFilter, ImageEnhance
import shutil
from datetime import datetime

import numpy as np
import matplotlib.pyplot as plt
import cv2
import torch
from sklearn.cluster import KMeans  
from ultralytics import YOLO

DETECTION_MODEL = "/Users/manojk/Desktop/IIIT Delhi/06 CSE344 CV/Project/CV_proj_website/python/yolov12x.pt"  # Path to YOLO detection model 
DETECTION_CONFIDENCE = 0.1  # Detection confidence threshold
DETECTION_IOU = 0.6  # IOU threshold for non-max suppression
TARGET_CLASSES = {
    2: 'car',
    5: 'bus',
    7: 'truck'
}

def get_image_paths(folder, first_n):
    """
    Returns a sorted list of first_n image paths in the folder.

    Args:
        folder (str): The root directory to search in.
        first_n (int, optional): The number of images to return. If None, returns all images.
            Defaults to None.

    Returns:
        List[str]: Sorted list of full image paths.
    """
    image_paths = []
    for root, _, files in os.walk(folder):
        for file in files:
            if any(file.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png")):
                image_paths.append(os.path.join(root, file))

    return sorted(image_paths)[:first_n]

import torch
from ultralytics import YOLO

def detect_car_spots(images_path, batch_size=32):
    """
    Detects car spots in images using YOLO, with batching.

    Args:
        images_path (list): List of image paths.
        batch_size (int): Number of images to process at once.

    Returns:
        list: List of detected car boxes (xyxy format) for all images.
    """
    # Load YOLO model
    detection_model = YOLO(DETECTION_MODEL)

    car_boxes = []
    

    # Process in batches
    for i in range(0, len(images_path), batch_size):
        batch = images_path[i:i + batch_size]

        detections = detection_model(
            batch,
            # classes = list(TARGET_CLASSES.keys()),
            conf=DETECTION_CONFIDENCE,
            iou=DETECTION_IOU,
            agnostic_nms=True,
            verbose=False,
        )

        target_classes_tensor = torch.tensor(list(TARGET_CLASSES.keys()), device=detection_model.device)
        for result in detections:
            result.boxes = result.boxes[
                torch.isin(result.boxes.cls.int(), target_classes_tensor)
            ]
            car_boxes.append(result.boxes.xyxy.cpu().numpy())

    return car_boxes

def plot_parking_slots(image_path, parking_slots, show=False):
    """
    Plots the detected parking slots on the image.

    Args:
        image_path (str): Path to the image.
        parking_slots (list): List of detected parking slots.
    """

    # Load the image
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Plot the parking slots
    for id ,slot in enumerate(parking_slots, start=1):
        x1, y1, x2, y2 = map(int, slot)
        cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), thickness=1)

        # Label the parking slot with its ID
        cv2.putText(image, str(id), (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    plt.imshow(image)
    plt.axis('off')
    if show:
        plt.show()
    return image

def find_parking_slots(car_boxes):
    # Step 1: Find the image with the most cars detected 
    k = max(len(boxes) for boxes in car_boxes)
    index = max(range(len(car_boxes)), key=lambda i: len(car_boxes[i]))

    # Step 2: Combine all boxes into a single array
    combined = np.vstack(car_boxes)

    # Step 3: Use the longest list as the initial seed for KMeans
    init_centers = np.array(car_boxes[index])
    
    # Step 4: Apply KMeans clustering
    kmeans = KMeans(n_clusters=k, init=init_centers, n_init=1)
    kmeans.fit(combined)

    return kmeans.cluster_centers_

def get_parking_slots(folder, first_n = None, plot_idx = 0):
    # Get all image paths in the folder
    images_path = get_image_paths(folder, first_n)

    # Detect car spots in all images 
    car_boxes = detect_car_spots(images_path)

    # Find parking slots using KMeans clustering
    parking_slots = find_parking_slots(car_boxes)

    # Plot the parking slots on the image
    parking_slots_image = plot_parking_slots(images_path[plot_idx], parking_slots)

    return parking_slots, parking_slots_image

def get_occupancies(img_path, parking_slots):
    # Load image with both PIL and OpenCV
    pil_img = Image.open(img_path).convert("RGB")
    image = cv2.imread(img_path)  # OpenCV uses BGR

    # Load model
    model = YOLO("/Users/manojk/Desktop/IIIT Delhi/06 CSE344 CV/Project/CV_proj_website/python/yolo11m-carpark.pt")
    model.eval()

    empty = []
    occupied = []

    for idx, (x1, y1, x2, y2) in enumerate(parking_slots, start=1):
        # Crop slot with PIL
        slot_img = pil_img.crop((x1, y1, x2, y2))

        # Predict class (0 = empty, 1 = occupied)
        results = model(slot_img, verbose=False)[0]
        cls = results.probs.top1  # index of predicted class

        # Choose box color: Green for empty, Red for occupied
        color = (0, 255, 0) if cls == 0 else (0, 0, 255)

        # Append to respective list
        if cls == 0:
            empty.append(idx)
        else:
            occupied.append(idx)

        x1, y1, x2, y2 = map(int, (x1, y1, x2, y2))
        # Draw bounding box and label on original image
        cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness=1)
        cv2.putText(image, str(idx), (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    # Convert BGR to RGB for display (optional)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    return empty, occupied, image

def get_final_images(image_path, parking_slots):
    DETECTION_MODEL = "yolo12x.pt"  # Path to YOLO detection model 
    DETECTION_CONFIDENCE = 0.1  # Detection confidence threshold
    DETECTION_IOU = 0.6  # IOU threshold for non-max suppression
    TARGET_CLASSES = {
        2: 'car',
        5: 'bus',
        7: 'truck'
    }

    # parking_slots, parking_slots_image = get_parking_slots(image_dir)
    empty, occupied, image = get_occupancies(image_path, parking_slots)

    return image
    

def process_single_image(image_path):
    # Create a unique output directory in the public folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    public_dir = os.path.join(os.path.dirname(os.path.dirname(image_path)), "public")
    output_dir = os.path.join(public_dir, "zip-samples", f"processed_{timestamp}")
    processed_dir = os.path.join(output_dir, "processed")
    os.makedirs(processed_dir, exist_ok=True)

    # Process the image
    try:
        # Copy the image to processed directory
        filename = os.path.basename(image_path)
        dst_path = os.path.join(processed_dir, filename)
        shutil.copy2(image_path, dst_path)
        
        # Return path relative to public directory
        relative_path = os.path.join("zip-samples", f"processed_{timestamp}", "processed", filename)
        return [relative_path]
    except Exception as e:
        print(f"Error processing image {image_path}: {e}", file=sys.stderr)
        return []

def process_zip(zip_path):
    # Create a unique output directory in the public folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    public_dir = os.path.join(os.path.dirname(os.path.dirname(zip_path)), "public")
    output_dir = os.path.join(public_dir, "zip-samples", f"processed_{timestamp}")
    os.makedirs(output_dir, exist_ok=True)

    # Extract the zip file
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(output_dir)
    
    # Remove macOS metadata folder so we don’t try to open “__MACOSX/._…” files
    macosx_dir = os.path.join(output_dir, "__MACOSX")
    if os.path.isdir(macosx_dir):
        shutil.rmtree(macosx_dir)

    parking_slots, parking_slots_image = get_parking_slots(output_dir)

    # Process each image in the extracted directory
    processed_images = []
    for root, _, files in os.walk(output_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                # Here you would add your image processing logic
                # For now, we'll just copy the image to a processed subdirectory
                # processed_dir = os.path.join(output_dir, "processed")
                # os.makedirs(processed_dir, exist_ok=True)
                
                # src_path = os.path.join(root, file)
                # dst_path = os.path.join(processed_dir, file)
                # shutil.copy2(src_path, dst_path)
                
                # Process the image
                processed_path = process_image(os.path.join(root, file), output_dir, timestamp, parking_slots)
                if processed_path:
                    processed_images.append(processed_path)

                # # Return path relative to public directory
                # relative_path = os.path.join("zip-samples", f"processed_{timestamp}", "processed", file)
                # processed_images.append(relative_path)

    # print("Hi there! Processed Images successfully")
    return processed_images

def process_zip_file(zip_path):
    """Process images in a zip file and return paths to processed images."""
    # Create a temporary directory to extract the zip file
    with tempfile.TemporaryDirectory() as temp_dir:
        # Extract the zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
        
        # Find all image files in the extracted directory
        image_files = []
        for root, _, files in os.walk(temp_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                    image_files.append(os.path.join(root, file))
        
        # Process each image
        processed_images = []
        for img_path in image_files:
            processed_path = process_image(img_path)
            if processed_path:
                processed_images.append(processed_path)
        
        # In a real implementation, you would save the processed images
        # and return their paths. For this demo, we'll return placeholder paths.
        print("Processed Images successfully")
        return [f"/placeholder.svg?height=400&width=600&text=Processed+{i+1}" for i in range(len(processed_images))]

def process_image(image_path, output_dir, timestamp, parking_slots):
    """Apply image processing to an image and return the path to the processed image."""
    try:
        # Open the image
        # img = Image.open(image_path)
        
        # Apply some processing (example: enhance contrast and apply blur)
        # enhancer = ImageEnhance.Contrast(img)
        # img = enhancer.enhance(1.5)  # Increase contrast
        # img = img.filter(ImageFilter.GaussianBlur(radius=1))  # Apply slight blur
        img = get_final_images(image_path, parking_slots)
        
        # Save the processed image
        processed_dir = os.path.join(output_dir, "processed")
        os.makedirs(processed_dir, exist_ok=True)

        filename = os.path.basename(image_path)
        dest_path = os.path.join(processed_dir, f"processed_{filename}")

        # processed_dir = os.path.join(os.path.dirname(image_path), 'processed')
        # os.makedirs(processed_dir, exist_ok=True)
        # processed_path = os.path.join(processed_dir, filename)
        img = Image.fromarray(img)
        img.save(dest_path)

        relative_path = os.path.join("zip-samples", f"processed_{timestamp}", "processed", f"processed_{filename}")
        
        return relative_path
    
    except Exception as e:
        print(f"Error processing image {image_path}: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_zip.py <file_path> <is_zip>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    is_zip = sys.argv[2].lower() == "true"
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    if is_zip:
        processed_images = process_zip(file_path)
    else:
        processed_images = process_single_image(file_path)
    
    print("\n".join(processed_images))  # Print paths for the API to capture
