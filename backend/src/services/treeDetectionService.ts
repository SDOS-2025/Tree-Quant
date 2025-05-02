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
        this.weightsPath = path.join(__dirname, '..', '..', 'uploads', 'best.pt');
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

            console.log('Starting Python script with:', {
                script: this.pythonScriptPath,
                image: imagePath,
                weights: this.weightsPath
            });

            const pythonProcess = spawn('python', [this.pythonScriptPath, imagePath]);

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                console.log('Python stdout:', chunk);
                output += chunk;
            });

            pythonProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                console.error('Python stderr:', chunk);
                error += chunk;
            });

            pythonProcess.on('close', (code) => {
                console.log('Python process exited with code:', code);
                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    const outputLines = output.trim().split('\n');
                    const lastJsonLine = outputLines.reverse().find(line => line.trim().startsWith('{'));
                    if (!lastJsonLine) {
                        throw new Error('No JSON output from Python script');
                    }
                    const result = JSON.parse(lastJsonLine);
                    resolve(result);
                } catch (e: unknown) {
                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                    reject(new Error(`Failed to parse Python script output: ${errorMessage}\nOutput: ${output}\nError: ${error}`));
                }
            });
        });
    }
}

