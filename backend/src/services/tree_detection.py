import cv2
import numpy as np
from ultralytics import YOLO
import sys
import json
import os

def process_image(image_path):
    try:
        # Load YOLO model
        model = YOLO("weights/best.pt")

        # Real-world scale (meters per pixel approximation)
        scale_m_per_pixel = 0.005  # Adjust if needed

        # Load the image
        frame = cv2.imread(image_path)

        # Run detection
        results = model(frame)
        boxes = results[0].boxes

        # Dictionary to store tree diameters
        tree_diameters = {}

        if boxes is not None:
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

        # Create output directory if it doesn't exist
        output_dir = "output"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Save the annotated image
        output_filename = os.path.basename(image_path)
        output_path = os.path.join(output_dir, f"annotated_{output_filename}")
        cv2.imwrite(output_path, frame)

        # Prepare response
        response = {
            "total_trees": len(tree_diameters),
            "tree_diameters": tree_diameters,
            "annotated_image_path": output_path
        }

        # Print JSON response for Node.js to capture
        print(json.dumps(response))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Please provide an image path"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    process_image(image_path) 