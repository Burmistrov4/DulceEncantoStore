# 📸 Guía estratégica: Instagram + Tienda (Dulce Encanto, Valencia)

Esta guía conecta tu tienda online con Instagram para **capturar comentarios y convertirlos en pedidos por WhatsApp**, con la menor fricción posible.

---

## 1. Preparar el perfil

1. **Un solo link en la bio**: `https://TU-DOMINIO/bio`
   - La vista `/bio` fue diseñada para cargar en menos de un segundo: menú, WhatsApp directo, Instagram y ubicación. Es tu "Linktree" propio, gratis y sin marca de terceros.
2. **Bio sugerida** (usa `npm run ig -- bio --link https://TU-DOMINIO/bio`):
   ```
   🍰 Postres artesanales con leche 100% fresca
   🥛 Yogur griego · 🍮 Quesillo · 🍞 Torta de pan
   📍 Valencia, Carabobo — Delivery el mismo día ⬇️
   🔗 https://TU-DOMINIO/bio
   ```
3. **Destacadas (Highlights)** con portadas del mismo color de marca:
   - 🧁 **Menú** (capturas del catálogo con precios)
   - 💬 **Opiniones** (capturas de chats de clientes felices)
   - 🚗 **Entregas** (fotos de entregas felices por sector)
   - ❓ **Cómo pedir** (3 pasos: eliges → WhatsApp → recibes)

---

## 2. Respuesta automática a comentarios con ManyChat (paso a paso)

El flujo estrella: alguien comenta **"PRECIO"**, **"QUIERO"** o **"INFO"** en tu post → el bot le manda el menú **por DM automáticamente**.

1. Crea cuenta gratis en [manychat.com](https://manychat.com) (el plan Free incluye la automatización de comentarios de IG).
2. Conecta tu **Instagram Business** (requiere cuenta comercial vinculada a una página de Facebook en Meta Business Suite).
3. En ManyChat ve a **Automation → New Automation → Start from scratch**.
4. **Trigger**: elige *Instagram → User comments on your Post or Reel*.
   - Condition: **Message contains** → `precio` (agrega variantes: `PRECIO`, `precio?`, `cuanto`, `quiero`, `info`, `menu` — ManyChat no distingue mayúsculas).
   - Activa **"Public reply to comment"** con: `¡Te lo envío por DM! 📩✨` (esto dispara más comentarios → más alcance).
5. **Acción del flujo**: bloque *Send Message* (DM) con la plantilla:
   > ¡Hola! 👋 Aquí tienes nuestro menú del día con fotos reales y precios actualizados en $ y Bs: `https://TU-DOMINIO`
   > Cualquier cosa me escribes por WhatsApp 📲 y coordinamos retiro o delivery. 🧡
6. **Importante**: activa la opción *Trigger for future posts* para que aplique a todas tus publicaciones futuras automáticamente.
7. Publica un post que invite a comentar: *"Comenta PRECIO y te mando el menú por DM 📩"*. Instagram premia los posts con muchos comentarios → más alcance gratis.

### Alternativa sin ManyChat (Meta Business Suite)
Si prefieres no usar terceros: **Meta Business Suite → Bandeja de entrada → Respuestas guardadas/Automatizaciones**. Crea respuestas rápidas para `PRECIO` y `QUIERO` con el mismo texto (el envío es manual, pero en 2 clics).

---

## 3. Plantillas de copy listas

Genera copys con el script local (sin dependencias):

```bash
npm run ig -- copy --producto "Quesillo 1kg" --precio "$9" --tipo urgencia
npm run ig -- copy --producto "Yogur Griego de Fresa 500g" --precio "$5" --tipo promo
npm run ig -- calendario   # plan de contenido de 7 días
npm run ig -- dm           # plantillas de DM para ManyChat
```

### Estructura de un copy que vende (fórmula A.I.D.A.)
1. **Atención**: pregunta o foto macro del postre (“¿Antojo de algo cremoso?”)
2. **Interés**: ingrediente estrella (“leche 100% fresca, sin conservantes”)
3. **Deseo**: prueba social o escasez (“quedan 4”, “así llegó a La Isabelica”)
4. **Acción**: un solo CTA por post → *Comenta “PRECIO”* **o** *link en la bio*.

### Hashtags (mezcla 3 locales + 4 de nicho por post)
- Locales: `#ValenciaCarabobo` `#PostresValencia` `#YogurtGriegoValencia` `#FlorAmarillo` `#DeliveryValencia`
- Nicho: `#PostresArtesanales` `#DulcesCaseros` `#QuesilloVenezolano` `#TortaDePan` `#HechoEnVenezuela` `#SinConservantes`

---

## 4. Rutina semanal recomendada (30 min/día)

| Día | Contenido | Objetivo del embudo |
|-----|-----------|---------------------|
| Lunes | Promo yogur natural + granola | Atracción (TOFU) |
| Martes | Captura de chat de cliente feliz | Prueba social (MOFU) |
| Miércoles | Foto macro quesillo + precio | Deseo (MOFU) |
| Jueves | Story: encuesta de sabores + cuenta regresiva | Engagement |
| Viernes | Lanzamiento Combo Fin de Semana | Conversión (BOFU) |
| Sábado | Story "quedan N" + foto de entrega | Urgencia (BOFU) |
| Domingo | Torta de pan familiar para el desayuno | Conversión |

**Horarios con mejor respuesta en Venezuela**: 11:00–13:00 y 18:00–21:00.

---

## 5. Tips de crecimiento local

- **Geolocaliza** cada post en Valencia / Flor Amarillo.
- **Responde todos los comentarios** en la primera hora (señal fuerte para el algoritmo).
- **Reels de 7–10 s** con: caramelo cayendo sobre el quesillo, el colado del yogur, el empaque para delivery. Son el formato con más alcance orgánico.
- **Colaboraciones** (post colaborativo) con cuentas de comida de Valencia: compartes audiencia.
- En **Stories**, usa el sticker de enlace al `/bio` (requiere +10k seguidores) o el sticker de **mención de producto** si activas tienda en IG.

---

## 6. Medición

- En la tienda: `/admin/metricas` muestra visitas, agregados al carrito y **clics a WhatsApp** por día.
- Publica un post → espera 24 h → revisa si subieron las visitas y los clics. Repite lo que funciona.
- Cambia la oferta/CTA si un post genera visitas pero pocos clics: suele faltar urgencia o precio visible.

---

## 7. Reseñas como prueba social

La landing tiene una sección de **reseñas de clientes** reales (no capturas editadas): eso vende más que cualquier copy.

1. Después de una entrega feliz, escríbele por DM: *"¡Qué alegría que te encantó! 🧡 ¿Me dejas una reseñita? Toma 1 minuto: https://TU-DOMINIO → botón ⭐ Dejar mi reseña"*.
2. En cuanto la envíe, **respóndele agradeciendo** por el mismo DM (y de paso el chat queda abierto para el próximo pedido).
3. Ve a `/admin/resenas`, **aprueba** las reseñas buenas (se publican al instante en la landing) y rechaza o elimina las que no sirvan.
4. Aprovecha las reseñas aprobadas como contenido: capturas para Stories y para tu Highlight de 💬 **Opiniones**, y cópialas en tus posts (paso *Deseo* de la fórmula A.I.D.A.).
