import { useState, useEffect, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Motion } from '@capacitor/motion';

// ─── useCamera ───────────────────────────────────────────────
export const useCamera = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<string | null> => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      const dataUrl = image.dataUrl || null;
      setPhoto(dataUrl);
      return dataUrl;
    } catch (e: any) {
      setError(e.message || 'Error al tomar la foto');
      return null;
    }
  };

  return { photo, error, takePhoto };
};

// ─── useGeolocation ──────────────────────────────────────────
export const useGeolocation = () => {
  const getCurrentPosition = async () => {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    };
  };

  const watchPosition = (callback: (pos: { lat: number; lng: number }) => void) => {
    return Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
      if (pos) callback({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return { getCurrentPosition, watchPosition, calculateDistance };
};

// ─── useHaptics ──────────────────────────────────────────────
export const useHaptics = () => {
  const vibrate = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(r => setTimeout(r, 200));
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(r => setTimeout(r, 200));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Haptics not available');
    }
  };

  const notify = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn('Haptics not available');
    }
  };

  return { vibrate, notify };
};

// ─── useAccelerometer ────────────────────────────────────────
export const useAccelerometer = () => {
  const [isMoving, setIsMoving] = useState(false);
  const lastValues = useRef({ x: 0, y: 0, z: 0 });
  const listenerRef = useRef<any>(null);

  const startListening = async (onMoving: (moving: boolean) => void) => {
    listenerRef.current = await Motion.addListener('accel', (event) => {
      const { x, y, z } = event.acceleration;
      const prev = lastValues.current;
      const delta = Math.sqrt(
        Math.pow(x - prev.x, 2) +
        Math.pow(y - prev.y, 2) +
        Math.pow(z - prev.z, 2)
      );
      const moving = delta > 0.5;
      setIsMoving(moving);
      onMoving(moving);
      lastValues.current = { x, y, z };
    });
  };

  const stopListening = () => {
    if (listenerRef.current) {
      listenerRef.current.remove();
      listenerRef.current = null;
    }
  };

  useEffect(() => () => stopListening(), []);

  return { isMoving, startListening, stopListening };
};