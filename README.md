# 🔮 Void Vessel: Abyssal Descent

[![Three.js](https://img.shields.io/badge/Three.js-0.174-black?style=flat&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)

**Void Vessel: Abyssal Descent** es un videojuego Roguelike Dungeon Crawler en **3D** desarrollado con **Three.js** y **TypeScript**, con diseño de salas y progresión inspirado en *The Binding of Isaac*, pero diferenciado por un sistema completo de **Magia Arcana y Hechizos Elementales**.

---

## ✨ Características Principales

- 🏰 **Navegación Sala por Sala**: Mazmorra generada proceduralmente (Algoritmo *Random Walker*) con salas de inicio, salas de combate, sala del tesoro y sala del jefe.
- 🚪 **Mecánica de Puertas**: Al entrar a combatir, las rejas de hierro descienden bloqueando las salidas. Al eliminar la última criatura, las puertas se desbloquean y emerge un cofre de recompensa.
- 🔮 **Magia Arcana y Orbes de Maná**: En lugar de lágrimas, canalizas proyectiles mágicos brillantes con estelas de partículas, rebotes cinéticos y estallidos mágicos.
- 🛡️ **Hitboxes y Físicas Precisas**: Sistema de colisión multi-pase contra muros, columnas, rocas, vasijas rompibles, cofres y pedestales con amortiguación de inercia al hacer *Dash*.
- 🏺 **Urnas Destructibles**: Disparar a las vasijas y urnas las destruye con efectos de fragmentos de arcilla y probabilidad de soltar monedas o corazones.
- 📜 **9 Reliquias Sinergéticas**:
  - *Tomo del Tri-Fuego*: Disparo triple de magia en abanico.
  - *Orbe Cinético*: Proyectiles mágicos que rebotan en muros y rocas.
  - *Daga de Fase Espectral*: Hechizos que atraviesan obstáculos sólidos.
  - *Sigilo de Sangre Rúnica*: Doble daño cuando estás a punto de perecer.
  - *Cáliz del Nigromante*: Drenaje de esencia vital mágica.
  - *Botas de Éter*: Mayor velocidad de desplazamiento y dash místico.
  - *Fuego Fatuo Protector*: Escudo orbital que desintegra proyectiles enemigos.
  - *Cráneo del Hechicero*: Aumento brutal de daño a cambio de vitalidad.
  - *Corazón del Titán Rúnico*: +2 contenedores de corazón y regeneración total.
- ☠️ **Jefe de Piso: Malakor, The Weeping Titan**: Coloso con puños flotantes, ataques sísmicos, ondas expansivas en anillo, invocación de esbirros y fase de furia.
- 🗺️ **Minimapa en Vivo (HUD)**: Renderizado en Canvas 2D con niebla de guerra, sala actual resaltada e iconos de calavera (☠) y tesoro (★).
- 🔊 **Audio Procedural (Web Audio API)**: Sin dependencias de archivos externos; efectos de sonido sintetizados y música ambiental oscura en tiempo real.

---

## 🕹️ Controles

| Control | Acción |
| :--- | :--- |
| **W, A, S, D** | Mover al personaje |
| **Flechas (↑, ↓, ←, →)** | Lanzar hechizos en las 4 direcciones cardinales |
| **Click Izquierdo / Mantener Ratón** | Disparo libre twin-stick 360° apuntando al cursor |
| **Espacio** | Dash evasivo con fotogramas de invulnerabilidad |
| **Shift Izquierdo / Q** | Desplegar bomba |

---

## 🚀 Despliegue en Vercel

El proyecto incluye el archivo [`vercel.json`](./vercel.json) listo para producción.

### Opción 1: Despliegue desde GitHub
1. Ve a [vercel.com](https://vercel.com/) e inicia sesión.
2. Haz click en **"Add New Project"** e importa este repositorio: `void-vessel-roguelike`.
3. Vercel detectará Vite automáticamente (`npm run build` y directorio `dist`).
4. Haz click en **"Deploy"**.

### Opción 2: Despliegue desde la CLI
```bash
npx vercel
```

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```
