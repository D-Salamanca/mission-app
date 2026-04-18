import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Mission {
  id: number;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  icon: string;
}

interface MissionContextType {
  missions: Mission[];
  points: number;
  completeMission: (id: number) => Promise<void>;
  resetMissions: () => void;
  saveToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
}

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Evidencia fotográfica',
    description: 'Toma una foto con la cámara para completar esta misión.',
    points: 30,
    completed: false,
    icon: '📸'
  },
  {
    id: 2,
    title: 'Movimiento real',
    description: 'Desplázate más de 50 metros desde tu posición inicial.',
    points: 50,
    completed: false,
    icon: '🚶'
  },
  {
    id: 3,
    title: 'Permanencia activa',
    description: 'Luego de moverte, quédate quieto 10 segundos y sentirás vibración.',
    points: 40,
    completed: false,
    icon: '⏱️'
  }
];

const LOCAL_KEY = 'mission_progress';

const MissionContext = createContext<MissionContextType | null>(null);

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [points, setPoints] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setPoints(data.points || 0);
      setMissions(prev => prev.map(m => ({
        ...m,
        completed: data.missions?.find((dm: any) => dm.id === m.id)?.completed || false
      })));
    }
  }, []);

  // Load from Firebase when user changes
  useEffect(() => {
    if (user) loadFromFirebase();
  }, [user]);

  const saveLocal = (newMissions: Mission[], newPoints: number) => {
    const data = {
      points: newPoints,
      missions: newMissions.map(m => ({ id: m.id, completed: m.completed }))
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  };

  const completeMission = async (id: number) => {
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    const newMissions = missions.map(m =>
      m.id === id ? { ...m, completed: true } : m
    );
    const newPoints = points + mission.points;

    setMissions(newMissions);
    setPoints(newPoints);
    saveLocal(newMissions, newPoints);

    // Notificaciones locales
    await LocalNotifications.requestPermissions();
    const remaining = newMissions.filter(m => !m.completed).length;

    if (remaining === 0) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 100,
          title: '🏆 ¡Misiones completas!',
          body: `¡Has completado todas las misiones con ${newPoints} puntos!`,
          schedule: { at: new Date(Date.now() + 500) }
        }]
      });
    } else {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: id,
            title: '✅ Misión completada',
            body: `"${mission.title}" completada. +${mission.points} pts`,
            schedule: { at: new Date(Date.now() + 500) }
          },
          ...(remaining === 1 ? [{
            id: 200,
            title: '🔥 ¡Ya casi!',
            body: 'Te falta 1 misión para completar.',
            schedule: { at: new Date(Date.now() + 2000) }
          }] : [])
        ]
      });
    }

    if (user) {
      await saveToFirebaseWithData(newMissions, newPoints);
    }
  };

  const saveToFirebaseWithData = async (newMissions: Mission[], newPoints: number) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, {
      points: newPoints,
      missions: newMissions.map(m => ({ id: m.id, completed: m.completed })),
      email: user.email,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const saveToFirebase = async () => {
    await saveToFirebaseWithData(missions, points);
  };

  const loadFromFirebase = async () => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setPoints(data.points || 0);
        setMissions(prev => prev.map(m => ({
          ...m,
          completed: data.missions?.find((dm: any) => dm.id === m.id)?.completed || false
        })));
        saveLocal(missions, data.points || 0);
      }
    } catch (e) {
      console.error('Error loading from Firebase:', e);
    }
  };

  const resetMissions = () => {
    setMissions(INITIAL_MISSIONS);
    setPoints(0);
    localStorage.removeItem(LOCAL_KEY);
  };

  return (
    <MissionContext.Provider value={{
      missions, points, completeMission, resetMissions, saveToFirebase, loadFromFirebase
    }}>
      {children}
    </MissionContext.Provider>
  );
};

export const useMissions = () => {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissions must be inside MissionProvider');
  return ctx;
};
