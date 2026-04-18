# MissionApp - Parcial 2

App de misiones con Ionic + React + Capacitor + Firebase.

## Stack
- Ionic React
- Capacitor (Camera, Geolocation, Haptics, Motion, Local Notifications)
- Firebase (Auth + Firestore)
- React Context (estado global)

## Setup rápido

### 1. Crear proyecto Ionic
```bash
ionic start mission-app blank --type=react
cd mission-app
```

### 2. Instalar dependencias
```bash
npm install firebase
npm install @capacitor/camera @capacitor/geolocation @capacitor/haptics
npm install @capacitor/motion @capacitor/local-notifications
npx cap sync
```

### 3. Configurar Firebase
1. Ir a console.firebase.google.com
2. Crear proyecto
3. Activar Authentication (Email/Password)
4. Crear Firestore database
5. Copiar config en `src/firebase/config.ts`

### 4. Copiar los archivos de este proyecto a src/

### 5. Permisos Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 6. Ejecutar
```bash
ionic build
npx cap add android
npx cap sync
npx cap open android
```

## Estructura de archivos

```
src/
├── App.tsx                    # Router principal
├── firebase/
│   └── config.ts              # ← CONFIGURAR CON TUS KEYS
├── context/
│   ├── AuthContext.tsx         # Auth (login/register/logout)
│   └── MissionContext.tsx      # Misiones + puntos + persistencia
├── hooks/
│   └── sensors.ts             # useCamera, useGeolocation, useHaptics, useAccelerometer
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx            # Lista de misiones + progreso
│   ├── MissionDetailPage.tsx   # Lógica de cada misión
│   └── ResultsPage.tsx         # Puntos + ranking
└── components/
    └── ProtectedRoute.tsx
```

## Misiones

| Misión | Sensor | Condición | Puntos |
|--------|--------|-----------|--------|
| 1 - Evidencia | Camera | Tomar foto | 30 |
| 2 - Movimiento | Geolocation | >50m desde origen | 50 |
| 3 - Permanencia | Accelerometer + Haptics | Quieto 10s → vibrar | 40 |

**Total posible: 120 puntos**

## Persistencia
- `localStorage`: guarda `{ points, missions[] }` localmente
- `Firestore`: doc `users/{uid}` con puntos y misiones
- Sincronización automática al completar cada misión

## Notificaciones locales
- "✅ Misión completada" al terminar cada misión
- "🔥 ¡Ya casi! Te falta 1 misión" cuando queda 1
- "🏆 ¡Misiones completas!" al terminar todas

## Ranking
- Mezcla usuarios reales de Firestore + 4 jugadores fake
- Ordena por puntos descendente
- Marca al usuario actual con badge "TÚ"

##Imagenes prueba

<div align="center">

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/156cfa85-25bc-49e0-b013-441a11ec8f33" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/eddfbddc-38c1-4cd9-b27c-3a27b6a19502" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/79d1ae3d-857e-4d78-a988-4030662cb5f7" width="100%"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/51b6e17b-7ecc-4190-acd1-37d38453b6ac" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/19b32fbb-13f9-40bb-b5d5-9b957f2c2073" width="100%"></td>
    <td><img src="https://github.com/user-attachments/assets/796b65a1-93ae-4734-8920-a42af3defe5c" width="100%"></td>
  </tr>
  <tr>
    <td colspan="3" align="center">
      <img src="https://github.com/user-attachments/assets/2693210b-e06c-493d-8d16-3f1f8eb91427" width="33%">
    </td>
  </tr>
</table>

</div>
