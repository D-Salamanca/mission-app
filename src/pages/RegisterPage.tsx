import React, { useState } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleRegister = async () => {
    if (!email || !password || !confirm) return setError('Completa todos los campos');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (password.length < 6) return setError('Mínimo 6 caracteres');
    setLoading(true);
    setError('');
    try {
      await register(email, password);
      history.replace('/home');
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
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
            <h1>Crear cuenta</h1>
            <p>Únete y empieza a ganar puntos</p>
          </div>

          <div className="auth-form">
            <IonItem lines="full" className="auth-item">
              <IonLabel position="floating">Email</IonLabel>
              <IonInput type="email" value={email} onIonChange={e => setEmail(e.detail.value!)} />
            </IonItem>
            <IonItem lines="full" className="auth-item">
              <IonLabel position="floating">Contraseña</IonLabel>
              <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value!)} />
            </IonItem>
            <IonItem lines="full" className="auth-item">
              <IonLabel position="floating">Confirmar contraseña</IonLabel>
              <IonInput type="password" value={confirm} onIonChange={e => setConfirm(e.detail.value!)} />
            </IonItem>

            {error && <IonText color="danger"><p className="auth-error">{error}</p></IonText>}

            <IonButton expand="block" className="auth-btn" onClick={handleRegister} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : 'Registrarse'}
            </IonButton>
            <IonButton expand="block" fill="outline" className="auth-btn-secondary" onClick={() => history.goBack()}>
              Ya tengo cuenta
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
