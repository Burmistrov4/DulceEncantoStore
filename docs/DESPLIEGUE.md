# 🚀 Guía de despliegue — Dulce Encanto

Del código en esta carpeta a la tienda en línea. **Opción recomendada: Vercel + Turso** (gratis para empezar).

> **Arquitectura actual:** la base de datos es **libSQL** (el sucesor de SQLite). En desarrollo usa el archivo local `db/dulces.db`; en producción se conecta a una base **Turso** remota con dos variables de entorno. Ya no se necesita disco persistente en el host.

---

## Opción 0 — Vercel + Turso (recomendada)

### 1) Crea tu base de datos en Turso (gratis)

1. Instala el CLI o regístrate en [turso.tech](https://turso.tech) con GitHub:
   ```bash
   # con el CLI (opcional, puedes hacerlo todo desde el dashboard)
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create dulces        # crea la base
   turso db show dulces --url    # → TURSO_DATABASE_URL
   turso db tokens create dulces # → TURSO_AUTH_TOKEN
   ```
2. Copia los dos valores; los usarás en Vercel.

### 2) Sube el repo a GitHub y conéctalo a Vercel

1. `git push` a un repo privado de GitHub (ver Paso 0 abajo).
2. En [vercel.com/new](https://vercel.com/new) importa el repo (framework detectado: Next.js, sin ajustes de build).

### 3) Variables de entorno en Vercel (Settings → Environment Variables)

| Variable | Valor |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://dulces-...turso.io` |
| `TURSO_AUTH_TOKEN` | el token de Turso |
| `ADMIN_USER` / `ADMIN_PASSWORD` | credenciales del panel `/admin` |
| `AUTH_SECRET` | cadena larga aleatoria (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` (o tu dominio) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `58...` |

> Al primer arranque, la app crea las tablas solas (DDL idempotente) y siembra productos de ejemplo si la base está vacía. Para partir con tu data local, exporta con `turso db shell dulces < dump.sql` o usa los CRUDs del admin.

### 4) Tasa Euro BCV automática

- Botón **“Actualizar tasa”** en `/admin/ajustes` (fuentes: ve.dolarapi.com → Euro oficial BCV, con respaldo pydolarve).
- Automático diario: crea un cron externo (ej. [cron-job.org](https://cron-job.org) o GitHub Action) que haga `POST` diario ejecutando `npm run rate:update` con las variables de Turso configuradas, o llama a una ruta interna autenticada.

### Notas

### 5) Fotos del admin en Vercel Blob (ya integrado)

Las fotos que subas desde el admin se guardan en **Vercel Blob** (almacenamiento permanente). Activación:

1. En Vercel: pestaña **Storage → Create Database → Blob** y conéctalo al proyecto (Vercel inyecta `BLOB_READ_WRITE_TOKEN` automáticamente).
2. Redespliega. Desde ese momento, `/api/admin/upload` sube a Blob y guarda la URL pública en la BD.

Sin token (desarrollo local), las fotos siguen guardándose en `public/uploads/` como siempre — cero cambios en tu flujo.

> Las fotos por defecto (`public/products/`) se despliegan con el código y no requieren Blob.
- **ISR**: la landing se revalida cada 15 s; los CRUDs del admin llaman `revalidatePath` para efecto inmediato.

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

### 2a. Compute Engine e2-micro (VM) — guía completa paso a paso

El nivel gratuito de Google Cloud incluye la VM e2-micro gratis (regiones `us-west1`, `us-central1`, `us-east1`) con 30GB de disco. **Costo real: ~$0–4/mes** — la VM y el disco son gratis, pero desde 2024 Google factura la IP pública en uso (~$3.5/mes) en la mayoría de los casos. Si quieres $0 estricto, mira la alternativa de Oracle más abajo (los pasos del servidor son idénticos).

**1) Crear la VM** — activa Cloud Shell (ícono de terminal en console.cloud.google.com) y ejecuta:

```bash
gcloud services enable compute.googleapis.com
gcloud compute instances create dulce-encanto \
  --machine-type=e2-micro --zone=us-central1-a \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=30GB --tags=http-server,https-server
```

**2) DNS**: en tu proveedor de dominio crea un registro **A** que apunte a la IP externa de la VM (Consola → Compute Engine → la verás en la lista). Sin dominio también funciona con la IP directa (`NEXT_PUBLIC_SITE_URL=http://TU-IP`), solo pierdes los previews bonitos al compartir.

**3) Dentro de la VM** (botón SSH de la consola):

```bash
# Node 22 + Caddy (HTTPS automático) + git
sudo apt update && sudo apt install -y curl git caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Swap: la VM tiene 1GB de RAM y el build de Next necesita más
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Código desde tu repo de GitHub
sudo mkdir -p /opt/dulces && sudo chown $USER /opt/dulces
git clone https://github.com/Burmistrov4/DulceEncantoStore.git /opt/dulces/app
cd /opt/dulces/app

# Variables de producción (¡nada de valores por defecto!)
cat > .env.local <<'EOF'
NEXT_PUBLIC_SITE_URL=https://tudominio.com
ADMIN_USER=tu-usuario
ADMIN_PASSWORD=clave-larga-y-fuerte
AUTH_SECRET=otro-secreto-largo-aleatorio-generalo-con-openssl-rand-hex-32
EOF

npm ci && npm run build
```

**4) Servicio que arranca solo y se reinicia si cae:**

```bash
sudo tee /etc/systemd/system/dulces.service <<'EOF'
[Unit]
Description=Dulce Encanto tienda
After=network.target

[Service]
WorkingDirectory=/opt/dulces/app
ExecStart=/usr/bin/npm run start
Restart=always
Environment=PORT=3000
User=USUARIO-DE-LA-VM

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now dulces
```

**5) HTTPS automático con Caddy** — edita `/etc/caddy/Caddyfile` y deja solo:

```
tudominio.com {
    reverse_proxy localhost:3000
}
```

`sudo systemctl reload caddy` → Caddy emite el certificado de Let's Encrypt solo.

**6) Tasa BCV diaria**: `sudo crontab -e` y añade `0 8 * * * cd /opt/dulces/app && /usr/bin/npm run rate:update >> /var/log/rate.log 2>&1`

**7) Actualizar la tienda en el futuro**: `cd /opt/dulces/app && git pull && npm ci && npm run build && sudo systemctl restart dulces`

### 2a-bis. Oracle Cloud "Always Free" — la alternativa verdaderamente $0
Oracle regala para siempre una VM ARM mucho más potente que la de Google (hasta 4 OCPU / 24GB RAM / 200GB disco, IP incluida) — suficiente para la tienda con margen de sobra. Registro en [oracle.com/cloud/free](https://www.oracle.com/cloud/free/) (pide tarjeta para verificar; no cobra en el plan Always Free). Elige imagen **Ubuntu** y aplica **exactamente los mismos pasos 3–7** de arriba. Único detalle: a veces no hay capacidad ARM disponible en la región que eliges (reintenta creando la instancia en horarios tranquilos o prueba otra región).

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
