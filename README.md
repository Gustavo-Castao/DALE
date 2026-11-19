# DALE!! Focus — Pomodoro, Reproductor Lo-Fi & Organizador Diario

Aplicación web de productividad 100% del lado del cliente que combina:

1. **Temporizador Pomodoro (estilo Pomofocus)**: Modos Enfoque, Descanso corto y Descanso largo, barra de progreso, estimación de hora de finalización, conteo de ciclos y sincronización directa con tus prioridades del día.
2. **Reproductor de solo audio (Lo-Fi & Ondas Alfa)**:
   - Precargado sin video con la pista solicitada *Study Music Alpha Waves* (`WPni755-Krg`) y dos sugerencias curadas (*Lofi Girl* y *Chillhop Radio*), con control de reproducción, volumen y opción de auto-play al iniciar el enfoque.
3. **Organizador diario DALE!!**:
   - **Hoy (Máximo 5)** con contador `0 / 5`, tachado rápido y limpieza de completadas.
   - **Fechas Clave / Agenda** ordenadas cronológicamente con resaltado de eventos de hoy y notificaciones del navegador.
   - **Cajón de Pendientes** para capturar ideas y pasarlas a Hoy cuando liberes espacio.
   - Conserva las claves originales de `localStorage` (`dale_today`, `dale_events`, `dale_backlog`).

## Cómo alojarlo en tu cuenta de GitHub (GitHub Pages)

El compilador genera un único archivo autocontenido (`docs/index.html` y `dist/index.html`) con todo el HTML, CSS y JavaScript empaquetado adentro:

- **Opción A (un solo archivo, sin compilar en GitHub)**: Sube únicamente `docs/index.html` renombrado como `index.html` a la raíz de tu repositorio (o sube la carpeta `docs/`) y en **Settings → Pages** selecciona **Deploy from a branch** (`main` / `/(root)` o `/docs`).
- **Opción B (repositorio completo automático)**: Sube todo el proyecto y en **Settings → Pages → Source** selecciona **GitHub Actions** (usa `.github/workflows/deploy.yml`).

## Desarrollo local

```bash
npm install
npm run dev
```

Compilación para producción:

```bash
npm run build
```
