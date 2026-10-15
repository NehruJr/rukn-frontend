import React, { useState } from 'react';
import { Plus, Trash2, Link, Save, Eye, Sparkles, Sliders, Check } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { tourService } from '@/services/tourService';
import { calculatePanoData, getImageDimensions } from '@/utils/panorama';
import TourViewer from './TourViewer';
import styles from './TourEditor.module.css';

export const TourEditor = ({ propertyId, existingTour = null, onSaved }) => {
  const [tour, setTour] = useState(
    existingTour || {
      property: propertyId,
      title: '360° Virtual Walkthrough',
      description: 'Explore this property in immersive 360°',
      status: 'published',
      scenes: []
    }
  );

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const activeScene = tour.scenes[activeSceneIndex] || null;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const localUrl = URL.createObjectURL(file);
        const dimensions = await getImageDimensions(localUrl);

        // Upload to Cloudinary
        const uploadResult = await mediaService.uploadToCloudinary(file);

        const isLikelyFullSphere = Math.abs(dimensions.width / dimensions.height - 2) < 0.2;
        const initialPanoData = calculatePanoData({
          imageWidth: dimensions.width,
          imageHeight: dimensions.height,
          horizontalCoverageDegrees: isLikelyFullSphere ? 360 : 180
        });

        const sceneId = `scene_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const sceneName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        const newScene = {
          id: sceneId,
          name: sceneName.charAt(0).toUpperCase() + sceneName.slice(1),
          roomType: 'other',
          panoramaUrl: uploadResult.url,
          publicId: uploadResult.public_id,
          projection: isLikelyFullSphere ? 'full' : 'partial',
          panoData: initialPanoData,
          isInitial: tour.scenes.length === 0,
          initialView: { pitch: 0, yaw: 0, zoom: 50 },
          hotspots: []
        };

        setTour((prev) => ({
          ...prev,
          scenes: [...prev.scenes, newScene]
        }));
      }
    } catch (err) {
      console.error('Failed to upload panorama:', err);
      alert('Error uploading panorama image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSceneFieldChange = (field, value) => {
    if (activeSceneIndex < 0 || activeSceneIndex >= tour.scenes.length) return;
    setTour((prev) => {
      const updatedScenes = [...prev.scenes];
      updatedScenes[activeSceneIndex] = {
        ...updatedScenes[activeSceneIndex],
        [field]: value
      };
      return { ...prev, scenes: updatedScenes };
    });
  };

  const handleSetInitial = (index) => {
    setTour((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s, i) => ({
        ...s,
        isInitial: i === index
      }))
    }));
  };

  const handleDeleteScene = (index) => {
    setTour((prev) => {
      const updated = prev.scenes.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((s) => s.isInitial)) {
        updated[0].isInitial = true;
      }
      return { ...prev, scenes: updated };
    });
    if (activeSceneIndex >= index && activeSceneIndex > 0) {
      setActiveSceneIndex(activeSceneIndex - 1);
    }
  };

  const handleAddHotspot = (targetSceneId) => {
    if (!activeScene || !targetSceneId) return;

    const targetScene = tour.scenes.find((s) => s.id === targetSceneId);
    const newHotspot = {
      targetSceneId,
      pitch: 0,
      yaw: 0,
      text: `Go to ${targetScene?.name || 'Room'}`
    };

    setTour((prev) => {
      const updatedScenes = [...prev.scenes];
      updatedScenes[activeSceneIndex] = {
        ...activeScene,
        hotspots: [...(activeScene.hotspots || []), newHotspot]
      };
      return { ...prev, scenes: updatedScenes };
    });
  };

  const handleRemoveHotspot = (hotspotIndex) => {
    setTour((prev) => {
      const updatedScenes = [...prev.scenes];
      updatedScenes[activeSceneIndex] = {
        ...activeScene,
        hotspots: activeScene.hotspots.filter((_, idx) => idx !== hotspotIndex)
      };
      return { ...prev, scenes: updatedScenes };
    });
  };

  const handleCoverageSlider = (coverage) => {
    if (!activeScene) return;
    const panoData = calculatePanoData({
      imageWidth: activeScene.panoData?.croppedWidth || 4000,
      imageHeight: activeScene.panoData?.croppedHeight || 2000,
      horizontalCoverageDegrees: Number(coverage)
    });

    handleSceneFieldChange('panoData', panoData);
    handleSceneFieldChange('projection', coverage >= 350 ? 'full' : 'partial');
  };

  const handleSaveTour = async () => {
    if (!tour.title.trim()) {
      alert('Please enter a tour title.');
      return;
    }
    if (tour.scenes.length === 0) {
      alert('Please upload at least one 360° panorama scene.');
      return;
    }

    setSaving(true);
    try {
      let savedResult;
      if (tour._id) {
        savedResult = await tourService.updateTour(tour._id, tour);
      } else {
        savedResult = await tourService.createTour({ ...tour, property: propertyId });
      }

      setTour(savedResult.data);
      if (onSaved) onSaved(savedResult.data);
      alert('360° Virtual Tour saved successfully!');
    } catch (err) {
      console.error('Error saving tour:', err);
      alert('Failed to save 360° tour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header & Mode Switcher */}
      <div className={styles.header}>
        <div>
          <h2>360° Virtual Tour Studio</h2>
          <p>Create room-by-room walkthroughs from phone panoramas or 360 camera photos.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`${styles.btn} ${previewMode ? styles.btnActive : styles.btnSecondary}`}
          >
            <Eye size={16} />
            <span>{previewMode ? 'Exit Preview' : 'Interactive Preview'}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveTour}
            disabled={saving || tour.scenes.length === 0}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Publish Tour'}</span>
          </button>
        </div>
      </div>

      {/* Tour Title & Status */}
      <div className={styles.tourSettings}>
        <div className={styles.formGroup}>
          <label>Tour Title</label>
          <input
            type="text"
            value={tour.title}
            onChange={(e) => setTour((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Modern Duplex Virtual Tour"
          />
        </div>
      </div>

      {/* Live Preview Mode */}
      {previewMode && (
        <div className={styles.previewContainer}>
          <TourViewer tour={tour} height="550px" />
        </div>
      )}

      {/* Editor Main Grid */}
      {!previewMode && (
        <div className={styles.editorGrid}>
          {/* Scenes Sidebar */}
          <div className={styles.scenesSidebar}>
            <div className={styles.sidebarHeader}>
              <h3>Scenes ({tour.scenes.length})</h3>
              <label className={styles.uploadLabel}>
                <Plus size={16} />
                <span>Add Panoramas</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {uploading && <div className={styles.uploadingNotice}>Uploading panoramas...</div>}

            <div className={styles.scenesList}>
              {tour.scenes.map((scene, idx) => (
                <div
                  key={scene.id || idx}
                  className={`${styles.sceneCard} ${activeSceneIndex === idx ? styles.activeSceneCard : ''}`}
                  onClick={() => setActiveSceneIndex(idx)}
                >
                  <img src={scene.panoramaUrl} alt={scene.name} className={styles.sceneThumb} />
                  <div className={styles.sceneCardInfo}>
                    <span className={styles.sceneCardName}>{scene.name}</span>
                    <span className={styles.sceneCardType}>
                      {scene.isInitial ? '★ Starting Scene' : `${scene.hotspots?.length || 0} links`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Scene Settings */}
          {activeScene ? (
            <div className={styles.sceneDetail}>
              <div className={styles.sceneDetailHeader}>
                <h3>Editing Scene: {activeScene.name}</h3>
                <div className={styles.sceneDetailActions}>
                  <button
                    type="button"
                    onClick={() => handleSetInitial(activeSceneIndex)}
                    className={`${styles.btnSmall} ${activeScene.isInitial ? styles.btnInitialActive : ''}`}
                  >
                    ★ Set as First Scene
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteScene(activeSceneIndex)}
                    className={`${styles.btnSmall} ${styles.btnDanger}`}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              <div className={styles.sceneInputs}>
                <div className={styles.formGroup}>
                  <label>Room Name</label>
                  <input
                    type="text"
                    value={activeScene.name}
                    onChange={(e) => handleSceneFieldChange('name', e.target.value)}
                  />
                </div>

                {/* Partial Panorama Horizontal Coverage Slider */}
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <label>
                      <Sliders size={14} /> Panorama Horizontal Coverage
                    </label>
                    <span>
                      {activeScene.panoData?.isPartial ? 'Partial (~180°-270°)' : '360° Equirectangular'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="360"
                    step="10"
                    defaultValue={activeScene.panoData?.isPartial ? 180 : 360}
                    onChange={(e) => handleCoverageSlider(e.target.value)}
                  />
                  <p className={styles.helpText}>
                    If you took a wide panorama on an iPhone or Android phone, adjust this until straight walls look natural.
                  </p>
                </div>

                {/* Hotspot Room-to-Room Connections */}
                <div className={styles.hotspotsSection}>
                  <div className={styles.hotspotsHeader}>
                    <h4>
                      <Link size={16} /> Room Connections (Doors / Hallways)
                    </h4>
                  </div>

                  {tour.scenes.length > 1 ? (
                    <div className={styles.addHotspotRow}>
                      <select id="targetSceneSelect" className={styles.select}>
                        <option value="">Select a room to link to...</option>
                        {tour.scenes
                          .filter((s) => s.id !== activeScene.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('targetSceneSelect');
                          if (el && el.value) {
                            handleAddHotspot(el.value);
                            el.value = '';
                          }
                        }}
                        className={styles.btnAddLink}
                      >
                        + Add Door Link
                      </button>
                    </div>
                  ) : (
                    <p className={styles.helpText}>Add at least two rooms to connect them with navigation hotspots.</p>
                  )}

                  {activeScene.hotspots?.length > 0 && (
                    <div className={styles.hotspotsList}>
                      {activeScene.hotspots.map((h, hIdx) => {
                        const target = tour.scenes.find((s) => s.id === h.targetSceneId);
                        return (
                          <div key={hIdx} className={styles.hotspotItem}>
                            <span>Links to: <strong>{target?.name || 'Unknown Room'}</strong></span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHotspot(hIdx)}
                              className={styles.btnIcon}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyDetail}>
              <p>Upload panoramic photos to start building your 360° walkthrough.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TourEditor;
