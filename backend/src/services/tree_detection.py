import cv2
import numpy as np
from ultralytics import YOLO
import sys
import json
import os
import traceback

def process_image(image_path):
    try:
        print("Starting image processing...", file=sys.stderr)
        print(f"Image path: {image_path}", file=sys.stderr)
        
        # Load YOLO model - update path to look in backend/uploads folder
        weights_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(image_path))), 'backend', 'uploads', 'best.pt')
        print(f"Weights path: {weights_path}", file=sys.stderr)
        
        if not os.path.exists(weights_path):
            raise FileNotFoundError(f"Weights file not found at: {weights_path}")
            
        print("Loading YOLO model...", file=sys.stderr)
        model = YOLO(weights_path)
        print("YOLO model loaded successfully", file=sys.stderr)

        # Real-world scale (meters per pixel approximation)
        scale_m_per_pixel = 0.005  # Adjust if needed

        # Load the image
        print("Loading image...", file=sys.stderr)
        frame = cv2.imread(image_path)
        if frame is None:
            raise ValueError(f"Failed to load image at: {image_path}")

        # Run detection
        print("Running detection...", file=sys.stderr)
        results = model(frame)
        boxes = results[0].boxes

        # Dictionary to store tree diameters
        tree_diameters = {}

        if boxes is not None:
            print(f"Found {len(boxes)} trees", file=sys.stderr)
            xyxys = boxes.xyxy.cpu().numpy()
            for i, box in enumerate(xyxys):
                x1, y1, x2, y2 = map(int, box)
                width_pixels = x2 - x1
                diameter = width_pixels * scale_m_per_pixel  # Convert pixel width to meters
                tree_diameters[i] = diameter

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

                # Put diameter text on the image
                label = f"ID {i}: {diameter:.2f} m"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX,
                            0.6, (0, 255, 0), 2)
        else:
            print("No trees detected", file=sys.stderr)

        # Create output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(image_path))), 'backend', 'output')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created output directory: {output_dir}", file=sys.stderr)

        # Save the annotated image
        output_filename = os.path.basename(image_path)
        output_path = os.path.join(output_dir, f"annotated_{output_filename}")
        cv2.imwrite(output_path, frame)
        print(f"Saved annotated image to: {output_path}", file=sys.stderr)

        # Prepare response
        response = {
            "total_trees": len(tree_diameters),
            "tree_diameters": tree_diameters,
            "annotated_image_path": output_path
        }

        # Print JSON response for Node.js to capture
        print(json.dumps(response))
        print("Processing completed successfully", file=sys.stderr)

    except Exception as e:
        error_msg = f"Error in process_image: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        error_msg = "Please provide an image path"
        print(error_msg, file=sys.stderr)
        print(json.dumps({"error": error_msg}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    process_image(image_path) 