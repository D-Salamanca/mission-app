import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonProgressBar, IonText, IonSpinner
} from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useMissions } from '../context/MissionContext';
import { useCamera } from '../hooks/sensors';
import { useGeolocation } from '../hooks/sensors';
import { useHaptics } from '../hooks/sensors';
import { useAccelerometer } from '../hooks/sensors';
import './MissionDetailPage.css';

const MissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const missionId = parseInt(id);
  const { missions, completeMission } = useMissions();
  const mission = missions.find(m => m.id === missionId);
  const history = useHistory();

  // Mission 1 - Camera
  const { photo, takePhoto } = useCamera();
  const [photoTaken, setPhotoTaken] = useState(false);

  // Mission 2 - Geolocation
  const { getCurrentPosition, watchPosition, calculateDistance } = useGeolocation();
  const [currentDist, setCurrentDist] = useState(0);
  const [geoWatchId, setGeoWatchId] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [locating, setLocating] = useState(false);
  const TARGET_DIST = 50;

  // Mission 3 - Stillness + Haptics + Accelerometer
  const { vibrate } = useHaptics();
  const { startListening, stopListening } = useAccelerometer();
  const [stillSeconds, setStillSeconds] = useState(0);
  const [isStill, setIsStill] = useState(false);
  const [mission3Active, setMission3Active] = useState(false);
  const stillTimer = useRef<any>(null);
  const stillCount = useRef(0);
  const movingDebounce = useRef<any>(null);
  const STILL_TARGET = 10;

  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  // Mission 2: Start tracking location
  const startTracking = async () => {
    try {
      setLocating(true);
      const pos = await getCurrentPosition();
      setTracking(true);
      const watchId = await watchPosition((newPos) => {
        const dist = calculateDistance(pos.lat, pos.lng, newPos.lat, newPos.lng);
        setCurrentDist(Math.round(dist));
      });
      setGeoWatchId(watchId as any);
    } catch (e: any) {
      alert(e.message || 'No se pudo obtener la ubicación');
    } finally {
      setLocating(false);
    }
  };

  // Monitor distance for mission 2
  useEffect(() => {
    if (missionId === 2 && currentDist >= TARGET_DIST && !done) {
      handleComplete();
    }
  }, [currentDist]);

  // Mission 3: start stillness monitoring
  const startMission3 = async () => {
    setMission3Active(true);
    stillCount.current = 0;
    setStillSeconds(0);

    await startListening((moving: boolean) => {
      if (moving) {
        // Reset timer when moving
        clearInterval(stillTimer.current);
        stillCount.current = 0;
        setStillSeconds(0);
        setIsStill(false);
      } else {
        setIsStill(true);
        if (!stillTimer.current) {
          stillTimer.current = setInterval(() => {
            stillCount.current += 1;
            setStillSeconds(stillCount.current);
            if (stillCount.current >= STILL_TARGET) {
              clearInterval(stillTimer.current);
              stillTimer.current = null;
              stopListening();
              triggerMission3Complete();
            }
          }, 1000);
        }
      }
    });
  };

  const triggerMission3Complete = async () => {
    await vibrate();
    handleComplete();
  };

  const handleComplete = async () => {
    if (done || completing) return;
    setCompleting(true);
    await completeMission(missionId);
    setDone(true);
    setCompleting(false);
    setTimeout(() => history.replace('/home'), 1500);
  };

  const handlePhoto = async () => {
    const result = await takePhoto();
    if (result) {
      setPhotoTaken(true);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(stillTimer.current);
      stopListening();
    };
  }, []);

  if (!mission) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="detail-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{mission.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="detail-content">
        {done ? (
          <div className="success-screen">
            <div className="success-icon">✅</div>
            <h2>¡Misión completada!</h2>
            <p>+{mission.points} puntos ganados</p>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <div className="mission-detail">
            <div className="mission-header-card">
              <span className="mission-big-icon">{mission.icon}</span>
              <h2>{mission.title}</h2>
              <p>{mission.description}</p>
              <div className="points-pill">+{mission.points} pts</div>
            </div>

            {/* MISSION 1: CAMERA */}
            {missionId === 1 && (
              <div className="mission-body">
                <h3>Toma tu evidencia</h3>
                {photo && (
                  <div className="photo-preview">
                    <img src={photo} alt="Evidencia" />
                  </div>
                )}
                {!photoTaken ? (
                  <IonButton expand="block" className="action-btn" onClick={handlePhoto}>
                    📸 Abrir cámara
                  </IonButton>
                ) : (
                  <div>
                    <p className="hint-text">✅ Foto tomada. ¿Guardar como evidencia?</p>
                    <IonButton expand="block" color="success" className="action-btn" onClick={handleComplete} disabled={completing}>
                      {completing ? <IonSpinner /> : '✅ Completar misión'}
                    </IonButton>
                  </div>
                )}
              </div>
            )}

            {/* MISSION 2: MOVEMENT */}
            {missionId === 2 && (
              <div className="mission-body">
                <h3>Detectar movimiento</h3>
                <div className="distance-display">
                  <span className="distance-number">{currentDist}</span>
                  <span className="distance-unit">m</span>
                </div>
                <IonProgressBar value={Math.min(currentDist / TARGET_DIST, 1)} color="primary" className="dist-bar" />
                <p className="hint-text">Meta: {TARGET_DIST} metros | Actual: {currentDist}m</p>

                {!tracking ? (
                  <IonButton expand="block" className="action-btn" onClick={startTracking} disabled={locating}>
                    {locating ? <><IonSpinner name="crescent" />&nbsp;Obteniendo GPS...</> : '🎯 Iniciar seguimiento'}
                  </IonButton>
                ) : (
                  <div className="tracking-indicator">
                    <IonSpinner name="dots" />
                    <p>Rastreando tu posición...</p>
                    <p className="hint-text">Camina más de {TARGET_DIST}m desde tu posición inicial</p>
                  </div>
                )}
              </div>
            )}

            {/* MISSION 3: STILLNESS */}
            {missionId === 3 && (
              <div className="mission-body">
                <h3>Quédate quieto 10 segundos</h3>
                <div className="timer-display">
                  <span className="timer-number">{stillSeconds}</span>
                  <span className="timer-unit">/ {STILL_TARGET}s</span>
                </div>
                <IonProgressBar value={stillSeconds / STILL_TARGET} color={isStill ? 'success' : 'warning'} className="dist-bar" />

                {!mission3Active ? (
                  <IonButton expand="block" className="action-btn" onClick={startMission3}>
                    ⏱️ Comenzar
                  </IonButton>
                ) : (
                  <div className="tracking-indicator">
                    <div className={`still-indicator ${isStill ? 'still' : 'moving'}`}>
                      {isStill ? '😌 Quieto' : '🏃 Moviéndote'}
                    </div>
                    <p className="hint-text">
                      {isStill
                        ? `Mantente quieto ${STILL_TARGET - stillSeconds}s más...`
                        : 'Para de moverte para iniciar el contador'}
                    </p>
                    <p className="hint-text small">El teléfono vibrará al completar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MissionDetailPage;
