import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styles from './ImageCropper.module.css';

type Point = { x: number; y: number };
type Area = { x: number; y: number; width: number; height: number };

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageUrl: string) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (location: Point) => {
        setCrop(location);
    };

    const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error('Error cropping image:', e);
        }
    };

    return (
        <div className={styles.cropperModal}>
            <div className={styles.cropperContainer}>
                <div className={styles.cropperHeader}>
                    <h3>Recadrer votre photo</h3>
                    <button onClick={onCancel} className={styles.closeButton}>✕</button>
                </div>

                <div className={styles.cropperWrapper}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaChange}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className={styles.controls}>
                    <label className={styles.controlLabel}>
                        Zoom
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </label>
                </div>

                <div className={styles.cropperActions}>
                    <button onClick={onCancel} className={styles.cancelButton}>
                        Annuler
                    </button>
                    <button onClick={createCroppedImage} className={styles.saveButton}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper function to crop the image
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Limit size to 200x200 for profile pictures to reduce base64 size
    const maxSize = 200;
    const size = Math.min(pixelCrop.width, pixelCrop.height, maxSize);

    canvas.width = size;
    canvas.height = size;

    // Draw the cropped image, resized to max 200x200
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size
    );

    // Convert canvas to blob with reduced quality (0.7 instead of 0.95)
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Canvas is empty');
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        }, 'image/jpeg', 0.7); // Reduced quality from 0.95 to 0.7
    });
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}
