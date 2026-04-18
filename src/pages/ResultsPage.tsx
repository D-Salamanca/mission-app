import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton
} from '@ionic/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useMissions } from '../context/MissionContext';
import './ResultsPage.css';

interface RankingEntry {
  email: string;
  points: number;
  uid?: string;
  isFake?: boolean;
}

// Fake players for ranking
const FAKE_PLAYERS: RankingEntry[] = [
  { email: 'carlos.m@missions.io', points: 120, isFake: true },
  { email: 'valeria.t@missions.io', points: 95, isFake: true },
  { email: 'andres.r@missions.io', points: 80, isFake: true },
  { email: 'sofia.v@missions.io', points: 60, isFake: true },
];

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const { missions, points, saveToFirebase } = useMissions();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const completedCount = missions.filter(m => m.completed).length;
  const totalPossible = missions.reduce((acc, m) => acc + m.points, 0);

  useEffect(() => {
    loadRanking();
    saveToFirebase();
  }, []);

  const loadRanking = async () => {
    try {
      // Get real users from Firebase
      const snap = await getDocs(collection(db, 'users'));
      const realUsers: RankingEntry[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        realUsers.push({
          email: data.email || 'user@app.io',
          points: data.points || 0,
          uid: doc.id
        });
      });

      // Merge real + fake, sort by points
      const merged = [...realUsers, ...FAKE_PLAYERS];
      merged.sort((a, b) => b.points - a.points);

      // Take top 5
      setRanking(merged.slice(0, 5));
    } catch (e) {
      // If firebase fails, show fake + current user
      const userEntry: RankingEntry = {
        email: user?.email || 'tu@correo.com',
        points,
        uid: user?.uid
      };
      const merged = [...FAKE_PLAYERS, userEntry];
      merged.sort((a, b) => b.points - a.points);
      setRanking(merged.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getStatusText = () => {
    if (completedCount === missions.length) return '🏆 ¡Todas las misiones completadas!';
    if (completedCount === 0) return '🚀 ¡Empieza tu primera misión!';
    return `⚡ ${completedCount} de ${missions.length} misiones completadas`;
  };

  const shortEmail = (email: string) => {
    const name = email.split('@')[0];
    return name.length > 12 ? name.substring(0, 12) + '...' : name;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="results-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>🏆 Resultados</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="results-content">
        {/* My Stats */}
        <div className="my-results-header">
          <div className="avatar-large">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <p className="my-email">{user?.email}</p>

          <div className="big-points">
            <span className="big-number">{points}</span>
            <span className="big-label">puntos</span>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-val">{completedCount}</span>
              <span className="stat-lbl">completadas</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">{missions.length - completedCount}</span>
              <span className="stat-lbl">pendientes</span>
            </div>
            <div className="stat-box">
              <span className="stat-val">{Math.round((points / totalPossible) * 100)}%</span>
              <span className="stat-lbl">del máximo</span>
            </div>
          </div>

          <div className="status-badge">
            {getStatusText()}
          </div>
        </div>

        {/* Mission Summary */}
        <div className="results-section">
          <h3 className="section-title">Resumen de misiones</h3>
          {missions.map(m => (
            <div key={m.id} className={`result-row ${m.completed ? 'completed' : ''}`}>
              <span className="result-icon">{m.completed ? '✅' : '⭕'}</span>
              <span className="result-name">{m.title}</span>
              <span className={`result-pts ${m.completed ? 'earned' : ''}`}>
                {m.completed ? `+${m.points}` : `${m.points} pts`}
              </span>
            </div>
          ))}
        </div>

        {/* Ranking */}
        <div className="results-section">
          <h3 className="section-title">🏅 Ranking Top 5</h3>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Cargando ranking...</p>
          ) : (
            ranking.map((entry, i) => {
              const isMe = entry.uid === user?.uid;
              return (
                <div key={i} className={`ranking-row ${isMe ? 'is-me' : ''}`}>
                  <span className="rank-medal">{getMedal(i)}</span>
                  <span className="rank-email">{shortEmail(entry.email)}</span>
                  {isMe && <span className="you-badge">TÚ</span>}
                  <span className="rank-pts">{entry.points} pts</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ height: '2rem' }} />
      </IonContent>
    </IonPage>
  );
};

export default ResultsPage;
