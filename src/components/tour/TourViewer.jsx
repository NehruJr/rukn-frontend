import React, { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import { StereoPlugin } from '@photo-sphere-viewer/stereo-plugin';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import '@photo-sphere-viewer/gallery-plugin/index.css';

import { Compass, Eye, Maximize, RotateCw, Sparkles, Navigation } from 'lucide-react';
import styles from './TourViewer.module.css';

export const TourViewer = ({ tour, initialSceneId = null, height = '500px', onSceneChange }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !tour?.scenes || tour.scenes.length === 0) return;

    // Convert tour scenes into Photo Sphere Viewer nodes
    const nodes = tour.scenes.map((scene) => {
      const node = {
        id: scene.id,
        panorama: scene.panoramaUrl,
        name: scene.name,
        caption: scene.name,
        links: (scene.hotspots || []).map((h) => ({
          nodeId: h.targetSceneId,
          position: { yaw: h.yaw, pitch: h.pitch },
          tooltip: h.text || 'Go to next room'
        }))
      };

      // Add panoData for partial panoramas if specified
      if (scene.panoData && scene.panoData.isPartial) {
        node.panoData = {
          fullWidth: scene.panoData.fullWidth,
          fullHeight: scene.panoData.fullHeight,
          croppedWidth: scene.panoData.croppedWidth,
          croppedHeight: scene.panoData.croppedHeight,
          croppedX: scene.panoData.croppedX,
          croppedY: scene.panoData.croppedY
        };
      }

      return node;
    });

    const startNodeId = initialSceneId || tour.scenes.find((s) => s.isInitial)?.id || tour.scenes[0]?.id;

    // Destroy existing viewer instance if re-initializing
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying viewer:', e);
      }
    }

    const viewer = new Viewer({
      container: containerRef.current,
      loadingImg: null,
      navbar: [
        'autorotate',
        'zoom',
        'move',
        'gallery',
        'fullscreen'
      ],
      plugins: [
        [VirtualTourPlugin, {
          dataMode: 'client',
          nodes,
          startNodeId,
          transition: 1500
        }],
        [GalleryPlugin, {
          visibleOnLoad: false
        }],
        GyroscopePlugin,
        StereoPlugin
      ]
    });

    viewerRef.current = viewer;

    const virtualTour = viewer.getPlugin(VirtualTourPlugin);
    virtualTour.addEventListener('node-changed', ({ node }) => {
      const sceneData = tour.scenes.find((s) => s.id === node.id);
      setCurrentScene(sceneData || node);
      if (onSceneChange) onSceneChange(sceneData || node);
    });

    // Set initial scene
    const initialScene = tour.scenes.find((s) => s.id === startNodeId) || tour.scenes[0];
    setCurrentScene(initialScene);

    return () => {
      try {
        viewer.destroy();
      } catch (e) {
        // cleanup safe
      }
      viewerRef.current = null;
    };
  }, [tour, initialSceneId]);

  const toggleGyroscope = async () => {
    if (!viewerRef.current) return;
    try {
      const gyro = viewerRef.current.getPlugin(GyroscopePlugin);
      if (gyro) {
        if (isGyroActive) {
          gyro.stop();
          setIsGyroActive(false);
        } else {
          await gyro.start();
          setIsGyroActive(true);
        }
      }
    } catch (err) {
      console.warn('Gyroscope could not be started:', err);
      alert('Gyroscope requires HTTPS and device motion permission.');
    }
  };

  const toggleStereo = () => {
    if (!viewerRef.current) return;
    const stereo = viewerRef.current.getPlugin(StereoPlugin);
    if (stereo) {
      stereo.toggle();
    }
  };

  const toggleAutoRotate = () => {
    if (!viewerRef.current) return;
    if (isAutoRotating) {
      viewerRef.current.stopAutorotate();
      setIsAutoRotating(false);
    } else {
      viewerRef.current.startAutorotate();
      setIsAutoRotating(true);
    }
  };

  const switchScene = (sceneId) => {
    if (!viewerRef.current) return;
    const virtualTour = viewerRef.current.getPlugin(VirtualTourPlugin);
    if (virtualTour) {
      virtualTour.setCurrentNode(sceneId);
    }
  };

  if (!tour?.scenes || tour.scenes.length === 0) {
    return (
      <div className={styles.emptyContainer} style={{ height }}>
        <p>No 360° scenes uploaded for this property yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.viewerWrapper} style={{ height }}>
      <div ref={containerRef} className={styles.container} />

      {/* Header Info Overlay */}
      <div className={styles.topBar}>
        <div className={styles.sceneTitle}>
          <Sparkles size={16} className={styles.sparkleIcon} />
          <span>{currentScene?.name || tour.title}</span>
        </div>

        {/* Scene Navigation Dropdown */}
        {tour.scenes.length > 1 && (
          <div className={styles.sceneSelector}>
            <select
              value={currentScene?.id || ''}
              onChange={(e) => switchScene(e.target.value)}
              className={styles.select}
            >
              {tour.scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Floating Action Controls */}
      <div className={styles.floatingControls}>
        <button
          type="button"
          onClick={toggleGyroscope}
          className={`${styles.ctrlBtn} ${isGyroActive ? styles.ctrlActive : ''}`}
          title="Toggle Gyroscope Look-Around"
        >
          <Compass size={18} />
          <span>Look Around</span>
        </button>

        <button
          type="button"
          onClick={toggleStereo}
          className={styles.ctrlBtn}
          title="VR Headset / Cardboard Mode"
        >
          <Eye size={18} />
          <span>VR Mode</span>
        </button>

        <button
          type="button"
          onClick={toggleAutoRotate}
          className={`${styles.ctrlBtn} ${isAutoRotating ? styles.ctrlActive : ''}`}
          title="Toggle Auto-Rotation"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default TourViewer;
