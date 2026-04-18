import React from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonProgressBar,
  IonCard, IonCardContent, IonBadge, IonText
} from '@ionic/react';
import { logOutOutline, trophyOutline, refreshOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMissions } from '../context/MissionContext';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { missions, points, resetMissions } = useMissions();
  const history = useHistory();

  const completedCount = missions.filter(m => m.completed).length;
  const progress = completedCount / missions.length;
  const totalPossible = missions.reduce((acc, m) => acc + m.points, 0);

  const handleReset = () => {
    if (window.confirm('¿Restablecer todo el progreso? Esta acción no se puede deshacer.')) {
      resetMissions();
    }
  };

  const handleLogout = async () => {
    await logout();
    history.replace('/login');
  };

  const isMissionUnlocked = (id: number) => {
    if (id === 1) return true;
    return missions.find(m => m.id === id - 1)?.completed || false;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="home-toolbar">
          <IonTitle>🎯 Misiones</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/results')}>
              <IonIcon icon={trophyOutline} />
            </IonButton>
            <IonButton onClick={handleReset}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
            <IonButton onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content">
        {/* Header Stats */}
        <div className="stats-header">
          <div className="user-greeting">
            <p className="greeting-text">Bienvenido,</p>
            <p className="user-email">{user?.email?.split('@')[0]}</p>
          </div>

          <div className="points-badge">
            <span className="points-number">{points}</span>
            <span className="points-label">pts</span>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Progreso general</span>
            <span>{completedCount}/{missions.length} misiones</span>
          </div>
          <IonProgressBar
            value={progress}
            className="main-progress"
            color={completedCount === missions.length ? 'success' : 'primary'}
          />
          <p className="progress-percent">{Math.round(progress * 100)}% completado</p>
        </div>

        {/* Mission Cards */}
        <div className="missions-list">
          <h2 className="section-title">Misiones disponibles</h2>

          {missions.map((mission) => {
            const unlocked = isMissionUnlocked(mission.id);
            return (
              <IonCard
                key={mission.id}
                className={`mission-card ${mission.completed ? 'completed' : ''} ${!unlocked ? 'locked' : ''}`}
                onClick={() => unlocked && !mission.completed && history.push(`/mission/${mission.id}`)}
                button={unlocked && !mission.completed}
              >
                <IonCardContent className="mission-content">
                  <div className="mission-left">
                    <div className={`mission-icon-wrap ${mission.completed ? 'done' : !unlocked ? 'locked-icon' : ''}`}>
                      <span className="mission-icon">
                        {mission.completed ? '✅' : !unlocked ? '🔒' : mission.icon}
                      </span>
                    </div>
                    <div className="mission-info">
                      <h3 className="mission-title">{mission.title}</h3>
                      <p className="mission-desc">{mission.description}</p>
                    </div>
                  </div>
                  <div className="mission-right">
                    <IonBadge
                      color={mission.completed ? 'success' : !unlocked ? 'medium' : 'primary'}
                      className="points-badge-sm"
                    >
                      +{mission.points}
                    </IonBadge>
                    <span className={`mission-status ${mission.completed ? 'status-done' : !unlocked ? 'status-locked' : 'status-pending'}`}>
                      {mission.completed ? 'Completada' : !unlocked ? 'Bloqueada' : 'Pendiente'}
                    </span>
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })}
        </div>

        {/* Total possible */}
        <div className="total-section">
          <p>Puntos posibles: <strong>{totalPossible}</strong></p>
          {completedCount === missions.length && (
            <IonButton expand="block" color="success" onClick={() => history.push('/results')}>
              🏆 Ver resultados finales
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
