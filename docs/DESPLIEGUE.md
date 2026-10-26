# 🚀 Guía de despliegue — Dulce Encanto

Del código en esta carpeta a la tienda en línea con tu dominio. Ordenada de la opción más recomendada a la más avanzada.

> **Antes de empezar:** el proyecto usa **SQLite en disco** (`db/dulces.db`) y guarda las fotos subidas desde el admin en `public/uploads/`. Por eso **cualquier destino de producción necesita disco persistente**. Esta es LA restricción que decide todo lo demás.

---

## Paso 0: Subir el repo a GitHub (todas las opciones lo usan)

El proyecto ya está inicializado como repositorio git. Lo único que debes hacer:

1. Crea un repositorio **privado** en [github.com/new](https://github.com/new) (ej: `dulce-encanto`).
2. Desde esta carpeta:

```bash
git remote add origin https://github.com/TU-USUARIO/dulce-encanto.git
git push -u origin main
```

Notas de seguridad (ya resuelto en `.gitignore`): **NO se suben** ni la base de datos (`db/*.db`), ni `.env.local`, ni las fotos subidas por el admin. El código sí incluye `.env.example` como referencia.

⚠️ **Variables con `NEXT_PUBLIC_`**: `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_WHATSAPP_NUMBER` se "hornean" en el build. Configúralas en la plataforma **antes del primer despliegue**.

---

## Opción 1 — Railway (recomendada: la más simple con disco persistente)

Costo: ~$5/mes (incluye horas de uso + volumen de 1GB). Pago con tarjeta (acepta prepagas).

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → elige `dulce-encanto`. Detecta Next.js y hace build solo (usa el `Dockerfile` incluido).
2. En el servicio → **Variables**: añade `NEXT_PUBLIC_SITE_URL` (la URL pública que te da Railway o tu dominio), `ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET`.
3. **Disco persistente** (crítico): servicio → *Settings → Volumes* → monta un volumen en `/app/db` (para la BD) y otro en `/app/public/uploads` (para las fotos).
4. **Dominio**: *Settings → Networking → Generate Domain* (o conecta tu dominio comprado en Namecheap/Porkbun con un CNAME).
5. **Tasa BCV diaria**: en Railway crea un *Cron* (pestaña del servicio) que ejecute `npm run rate:update` una vez al día por la mañana.

Deploy automático: cada `git push` a `main` redespliega solo. Los datos del volumen sobreviven.

## Opción 2 — Google Cloud (si quieres quedarte en Google)

### Aclaración importante sobre Google AI Studio
**Google AI Studio no es una plataforma de hosting para apps propias**: es el estudio de prototipos de Gemini (chatbots, apps de IA que construye él). No puedes importar tu repo full-stack de Next.js con base de datos ahí. Lo que sí existe dentro del ecosistema Google son tres caminos serios:

### 2a. Compute Engine e2-micro (VM gratuita) — la más parecida a un VPS
El nivel gratuito de Google Cloud incluye **1 VM e2-micro al mes gratis** (regiones de EE.UU.). Disco persistente real → SQLite funciona sin cambios.

```bash
# tras crear el proyecto en console.cloud.google.com
gcloud services enable compute.googleapis.com
gcloud compute instances create dulce-encanto \
  --machine-type=e2-micro --zone=us-east1-b \
  --image-family=debian-12 --image-project=debian-cloud \
  --tags=http-server,https-server
gcloud compute firewall-rules create allow-web --allow=tcp:80,tcp:443 --target-tags=http-server,https-server
```

Dentro de la VM (SSH desde el navegador): instala Node 22, clona tu repo de GitHub, `npm ci && npm run build && npm run start` (o usa el Dockerfile con Docker), y pon Nginx con certbot para HTTPS. Es un VPS con otra factura: backups y tasa programada con `crontab`.

### 2b. Cloud Run (contenedor elegante, pero cuidado con SQLite)
Cloud Run despliega el `Dockerfile` directo desde GitHub (Cloud Build). El problema: su disco es **efímero**. Con SQLite tendrías que montar un bucket GCS vía FUSE, y **SQLite sobre GCS FUSE no es seguro** (no garantiza los bloqueos de archivos: riesgo real de corrupción de la BD).

→ Usa Cloud Run **solo si antes migras la BD a Cloud SQL o Supabase** (Postgres). La capa Drizzle es portable, pero requiere tocar `db/` y mover las fotos a un bucket/Storage. No lo hagas sin necesidad.

### 2c. Firebase App Hosting (GitHub → deploy automático de Next.js)
El "Vercel de Google": conectas el repo y cada push despliega. Mismo problema de fondo: **serverless sin disco persistente** → requiere la migración a Postgres + Storage igual que 2b.

### Resumen honesto de Google
| Camino | ¿Funciona con este stack sin cambios? | Esfuerzo |
|---|---|---|
| Compute Engine (VM) | ✅ Sí | Como un VPS |
| Cloud Run | ❌ (SQLite no persiste de forma segura) | Migrar a Postgres |
| Firebase App Hosting | ❌ (igual) | Migrar a Postgres |
| Google AI Studio | ❌ No aplica (no es hosting de apps propias) | — |

## Opción 3 — Fly.io (equilibrio global/disco persistente)
Similar a Railway pero con regiones más amplias (elige `mia` — Miami — para latencia Venezuela): `fly launch` detecta el Dockerfile, `fly volumes create` para `/app/db` y `/app/public/uploads`, `fly secrets set` para las variables.

---

## Checklist post-despliegue (cualquier opción)

- [ ] `NEXT_PUBLIC_SITE_URL` = tu dominio real (afecta OpenGraph, sitemap, JSON-LD)
- [ ] `ADMIN_PASSWORD` y `AUTH_SECRET` nuevos (nada de valores por defecto)
- [ ] WhatsApp real en `/admin/ajustes` → guardar
- [ ] Botón **"Obtener tasa automática"** en `/admin/ajustes` (o cron de `npm run rate:update`)
- [ ] Abrir `/admin` → cambiar stock/disponibilidad del día
- [ ] Probar un pedido completo: agregar al carrito → WhatsApp → mensaje totalizado correcto
- [ ] **Backups**: cron diario que copie `db/dulces.db` + `public/uploads` (Railway: volume snapshot; VPS: script con `sqlite3 .backup`)
- [ ] Link `tudominio.com/bio` en la bio de Instagram + ManyChat configurado (`docs/GUIA_INSTAGRAM.md`)

## ¿Cuándo migrar a Postgres (Supabase)?

Cuando la tienda supere ~50 pedidos/día, quieras backups gestionados automáticos o multi-instancia. El esquema Drizzle es portable; sería tocar `db/` y mover fotos a Supabase Storage/Cloudinary. Hasta entonces, SQLite + volumen es más que suficiente y te ahorra complejidad.
