import React, { useState } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) return setError('Completa todos los campos');
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      history.replace('/home');
    } catch (e: any) {
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">🎯</div>
            <h1>MissionApp</h1>
            <p>Completa misiones, gana puntos</p>
          </div>

          <div className="auth-form">
            <IonItem lines="full" className="auth-item">
              <IonLabel position="floating">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
              />
            </IonItem>

            <IonItem lines="full" className="auth-item">
              <IonLabel position="floating">Contraseña</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={e => setPassword(e.detail.value!)}
              />
            </IonItem>

            {error && (
              <IonText color="danger">
                <p className="auth-error">{error}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              className="auth-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <IonSpinner name="crescent" /> : 'Iniciar Sesión'}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              className="auth-btn-secondary"
              onClick={() => history.push('/register')}
            >
              Crear cuenta
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
