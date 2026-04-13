import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

export async function uploadProductImage(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log("uploadProductImage called for:", file.name);
  
  if (!auth.currentUser) {
    console.error("Upload failed: No authenticated user");
    throw new Error('You must be logged in to upload images.');
  }

  // Compress image before upload
  let fileToUpload: File | Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      console.log("Starting compression for:", file.name);
      fileToUpload = await compressImage(file);
      console.log("Compression successful. Original:", file.size, "Compressed:", fileToUpload.size);
    } catch (e) {
      console.warn("Compression failed, using original file:", e);
    }
  }

  // Limit file size to 10MB (increased for safety)
  if (fileToUpload.size > 10 * 1024 * 1024) {
    throw new Error('File size too large. Max 10MB allowed.');
  }

  const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
  console.log("Storage reference created. Path:", storageRef.fullPath, "Bucket:", storage.app.options.storageBucket);
  
  // Test if we can even create a reference (basic check)
  if (!storageRef.fullPath) {
    throw new Error('Failed to create storage reference. Check your Firebase configuration.');
  }

  const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

  return new Promise((resolve, reject) => {
    // Set a timeout for the upload (3 minutes)
    const timeout = setTimeout(() => {
      uploadTask.cancel();
      console.error("Upload timed out after 3 minutes");
      reject(new Error('Upload timed out. This is almost always because Firebase Storage is NOT enabled in your console. Please go to Firebase Console -> Storage and click "Get Started".'));
    }, 180000); 

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload progress for ${file.name}: ${progress.toFixed(2)}% (${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes)`);
        if (onProgress) onProgress(progress);
      }, 
      (error) => {
        clearTimeout(timeout);
        console.error("Firebase Storage Upload Error Details:", {
          code: error.code,
          message: error.message,
          serverResponse: (error as any).serverResponse
        });
        
        let friendlyMessage = 'Upload failed.';
        if (error.code === 'storage/unauthorized') {
          friendlyMessage = 'Permission denied. You must enable Storage and set Rules to "allow write: if request.auth != null;" in the Firebase Console.';
        } else if (error.code === 'storage/canceled') {
          friendlyMessage = 'Upload was canceled or timed out.';
        } else if (error.code === 'storage/unknown') {
          friendlyMessage = 'An unknown error occurred. This often happens if the Storage bucket is not yet provisioned.';
        }
        
        reject(new Error(`${friendlyMessage} (Error Code: ${error.code})`));
      }, 
      async () => {
        clearTimeout(timeout);
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Upload successful! URL:", downloadURL);
          resolve(downloadURL);
        } catch (e) {
          console.error("Error getting download URL:", e);
          reject(e);
        }
      }
    );
  });
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
}
