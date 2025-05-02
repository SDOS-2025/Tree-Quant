import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface TreeDetectionResult {
    total_trees: number;
    tree_diameters: { [key: number]: number };
    annotated_image_path: string;
}

export class TreeDetectionService {
    private static instance: TreeDetectionService;
    private pythonScriptPath: string;
    private weightsPath: string;

    private constructor() {
        this.pythonScriptPath = path.join(__dirname, 'tree_detection.py');
        this.weightsPath = path.join(__dirname, 'weights', 'best.pt');
    }

    public static getInstance(): TreeDetectionService {
        if (!TreeDetectionService.instance) {
            TreeDetectionService.instance = new TreeDetectionService();
        }
        return TreeDetectionService.instance;
    }

    public async processImage(imagePath: string): Promise<TreeDetectionResult> {
        return new Promise((resolve, reject) => {
            // Check if the image file exists
            if (!fs.existsSync(imagePath)) {
                reject(new Error('Image file not found'));
                return;
            }

            // Check if the Python script exists
            if (!fs.existsSync(this.pythonScriptPath)) {
                reject(new Error('Python script not found'));
                return;
            }

            // Check if the weights file exists
            if (!fs.existsSync(this.weightsPath)) {
                reject(new Error('Model weights not found'));
                return;
            }

            const pythonProcess = spawn('python', [this.pythonScriptPath, imagePath]);

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (e) {
                    reject(new Error('Failed to parse Python script output'));
                }
            });
        });
    }
} 