import fs from 'fs';
import path from 'path';

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const UPLOAD_DIR = 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

/**
 * Service to handle file uploads
 * Logic can be swapped for S3/Cloudinary later
 */
export const uploadFile = async (file) => {
    // 1. Validate File Existence
    if (!file) {
        throw new Error('No file provided');
    }

    // 2. Validate Size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }

    // 3. Validate MIME Type
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only JPG, PNG, and PDF allowed.');
    }

    // 4. Generate Unique Filename (Mocking Cloud Storage Key)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 5. Save File (In real app, stream to S3 here)
    // Assuming 'file' is from multer or similar middleware which might have already saved it to temp
    // If using memory storage, we write buffer. If disk storage, we rename/move.
    // For simplicity with standard express-fileupload or multer memory storage:
    if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
        // If multer diskStorage was used, it's already saved, just return path
        // But we want to enforce our naming/location logic if needed.
        // For now, let's assume this service receives a file object that needs saving.
        fs.copyFileSync(file.path, filePath);
        fs.unlinkSync(file.path); // Remove temp
    }

    return filename; // Return Key
};

/**
 * Generate a signed URL (Mocked)
 */
export const getSignedUrl = (fileKey) => {
    // In production: s3.getSignedUrl(...)
    return `/uploads/${fileKey}`;
};
