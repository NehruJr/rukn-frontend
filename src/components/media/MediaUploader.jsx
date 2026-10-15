import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Star, ArrowUp, ArrowDown, Check, Loader2 } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import styles from './MediaUploader.module.css';

export const MediaUploader = ({ images = [], onChange, maxImages = 20 }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    const initialUploadState = filesToUpload.map((file, idx) => ({
      id: `${Date.now()}_${idx}`,
      file,
      name: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles((prev) => [...prev, ...initialUploadState]);

    for (const item of initialUploadState) {
      try {
        const uploadedData = await mediaService.uploadToCloudinary(item.file, (percent) => {
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: percent } : f))
          );
        });

        const newImage = {
          url: uploadedData.url,
          publicId: uploadedData.public_id,
          width: uploadedData.width,
          height: uploadedData.height,
          bytes: uploadedData.bytes,
          caption: item.name.replace(/\.[^/.]+$/, ''),
          isPrimary: images.length === 0,
          order: images.length
        };

        onChange((currentImages) => {
          const updated = [...(currentImages || []), newImage];
          // Ensure at least one primary
          if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
            updated[0].isPrimary = true;
          }
          return updated;
        });

        setUploadingFiles((prev) => prev.filter((f) => f.id !== item.id));
      } catch (err) {
        console.error('Upload failed for:', item.name, err);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'error', error: 'Upload failed' } : f))
        );
      }
    }
  }, [images, maxImages, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 15 * 1024 * 1024 // 15MB
  });

  const handleSetPrimary = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onChange(updated);
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reindexed = reordered.map((img, idx) => ({ ...img, order: idx }));
    onChange(reindexed);
  };

  return (
    <div className={styles.container}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className={styles.uploadIcon} size={32} />
        <p className={styles.dropText}>
          {isDragActive
            ? 'Drop the property images here...'
            : 'Drag & drop property images, or click to browse'}
        </p>
        <span className={styles.dropSubtext}>
          JPEG, PNG, WebP up to 15MB each (Max {maxImages} images)
        </span>
      </div>

      {/* Uploading progress items */}
      {uploadingFiles.length > 0 && (
        <div className={styles.progressList}>
          {uploadingFiles.map((f) => (
            <div key={f.id} className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <Loader2 className={styles.spinner} size={16} />
                <span className={styles.progressName}>{f.name}</span>
                <span className={styles.progressPercent}>{f.progress}%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: `${f.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Gallery Grid */}
      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((img, idx) => (
            <div key={img.publicId || img.url || idx} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img src={img.url} alt={img.caption || `Property image ${idx + 1}`} />
                {img.isPrimary && (
                  <span className={styles.primaryBadge}>
                    <Star size={12} fill="currentColor" /> Primary
                  </span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  title="Move left"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  className={styles.actionBtn}
                >
                  <ArrowUp size={14} className={styles.rotateLeft} />
                </button>

                <button
                  type="button"
                  title={img.isPrimary ? 'Primary cover' : 'Set as primary'}
                  onClick={() => handleSetPrimary(idx)}
                  className={`${styles.actionBtn} ${img.isPrimary ? styles.actionPrimaryActive : ''}`}
                >
                  <Star size={14} fill={img.isPrimary ? 'currentColor' : 'none'} />
                </button>

                <button
                  type="button"
                  title="Move right"
                  disabled={idx === images.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  className={styles.actionBtn}
                >
                  <ArrowDown size={14} className={styles.rotateRight} />
                </button>

                <button
                  type="button"
                  title="Delete image"
                  onClick={() => handleRemove(idx)}
                  className={`${styles.actionBtn} ${styles.actionDelete}`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
