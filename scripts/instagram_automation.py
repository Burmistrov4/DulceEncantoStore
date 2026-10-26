#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automatización de contenido para Instagram — Dulce Encanto (Valencia, Carabobo)
Genera copys persuasivos, calendario semanal, plantillas de DM y bio optimizada.

Uso:
  python scripts/instagram_automation.py copy --producto "Quesillo 1kg" --precio "$9" --tipo promo
  python scripts/instagram_automation.py copy --producto "Yogur Griego de Fresa" --precio "$5" --tipo urgencia
  python scripts/instagram_automation.py calendario
  python scripts/instagram_automation.py dm
  python scripts/instagram_automation.py bio --link https://tutienda.ve/bio

Solo usa la librería estándar de Python (sin dependencias).
"""

import argparse
import random
import sys
from datetime import date, timedelta

TIENDA = "Dulce Encanto"
CIUDAD = "Valencia, Carabobo"

# Hashtags locales + de nicho. Mezcla siempre 3 locales con 4 de nicho.
HASHTAGS_LOCALES = [
    "#ValenciaCarabobo",
    "#PostresValencia",
    "#YogurtGriegoValencia",
    "#FlorAmarillo",
    "#DeliveryValencia",
]
HASHTAGS_NICHO = [
    "#PostresArtesanales",
    "#DulcesCaseros",
    "#QuesilloVenezolano",
    "#TortaDePan",
    "#HechoEnVenezuela",
    "#AntojoDulce",
    "#SinConservantes",
    "#LecheFresca",
]

CTA_COMENTA = '👇 Comenta "PRECIO" y te envío el menú del día por DM con fotos reales.'
CTA_LINK = "🔗 Link en la bio para ver menú, precios en $ y Bs, y pedir por WhatsApp."

TEMPLATES = {
    "promo": [
        (
            "✨ {producto} — recién hecho con leche 100% fresca ✨\n\n"
            "Sin conservantes, sin colorantes, solo antojo bueno. 🥛\n"
            "Hoy: {precio} (también en Bs al BCV del día).\n\n"
            "{cta}"
        ),
        (
            "¿Merienda dulce hoy? 🤤\n\n"
            "{producto} de {tienda}, horneado/preparado esta mañana en {ciudad}.\n"
            "Precio: {precio} · Delivery en Valencia 🚗\n\n"
            "{cta}"
        ),
        (
            "🥛 Así de cremoso se ve nuestro {producto}.\n\n"
            "Leche fresca de la zona, receta artesanal y cero químicos.\n"
            "Llévalo hoy por {precio}.\n\n"
            "{cta}"
        ),
    ],
    "urgencia": [
        (
            "🔥 ÚLTIMAS UNIDADES de hoy 🔥\n\n"
            "Quedan pocas de {producto} ({precio}). Cuando se agota… se agota de verdad "
            "(así de honestos somos con lo fresco).\n\n"
            "{cta}"
        ),
        (
            "⏰ Lote fresco salió hoy de la nevera y ya queda poco:\n\n"
            "▸ {producto} — {precio}\n\n"
            "Primero comenta, primero se lo lleva. 🏃\n\n"
            "{cta}"
        ),
    ],
    "prueba_social": [
        (
            "💬 “¿{producto}? No dura ni un día en mi casa” — cliente de La Isabelica.\n\n"
            "Gracias a Valencia por tanto cariño. ⭐⭐⭐⭐⭐\n"
            "Pide el tuyo hoy: {precio}.\n\n"
            "{cta}"
        ),
        (
            "📍 Así llega la felicidad a domicilio en {ciudad}. 🚗🧡\n\n"
            "{producto} — {precio} — delivery el mismo día.\n"
            "Más de 100 pedidos felices no mienten.\n\n"
            "{cta}"
        ),
    ],
    "combo": [
        (
            "🎁 COMBO FIN DE SEMANA 🎁\n\n"
            "{producto} por solo {precio} (antes más caro por separado).\n"
            "Solo viernes a domingo. Ideal para compartir… o no. 😏\n\n"
            "{cta}"
        ),
    ],
    "story": [
        (
            "Encuesta: ¿Fresa 🍓 o Mora 🫐? de nuestro yogur griego artesanal.\n"
            "Vota y te muestro el ganador en la próxima story. 👀\n"
            "(Pide el tuyo: {precio} → link en la bio)"
        ),
        (
            "⏳ Cuenta regresiva: quedan X horas para pedir {producto} hoy.\n"
            "Comenta PRECIO y te envío el menú por DM 📩"
        ),
    ],
}

DM_PLANTILLAS = {
    "precio": (
        "¡Hola! 👋 Aquí tienes nuestro menú del día con fotos reales y precios "
        "actualizados en $ y Bs: {link}\n\n"
        "Cualquier cosa me escribes por WhatsApp 📲 y coordinamos retiro o delivery. 🧡"
    ),
    "quiero": (
        "¡Hola! 😍 ¡Qué buen gusto! Aquí está el menú completo con precios de hoy: {link}\n\n"
        "Para asegurarte el tuyo, confirma por WhatsApp 📲 (el link tiene el botón directo)."
    ),
    "menu": (
        "¡Hola! 🧡 Este es nuestro menú de hoy: {link}\n"
        "Precios en dólares y bolívares (tasa BCV), retiro en Flor Amarillo o delivery en Valencia."
    ),
}

CALLES_TIPO = [
    ("Lunes", "promo", "Arranca la semana dulce: yogur griego natural + granola."),
    ("Martes", "prueba_social", "Reseña real de cliente de Valencia (captura de chat)."),
    ("Miércoles", "promo", "Quesillo individual: el antojo de medio día."),
    ("Jueves", "story", "Encuesta de sabores + cuenta regresiva del combo."),
    ("Viernes", "combo", "Lanza el Combo Fin de Semana (solo vie-dom)."),
    ("Sábado", "urgencia", "Últimas unidades del lote de hoy + foto de entrega feliz."),
    ("Domingo", "prueba_social", "Torta de pan familiar para el desayuno dominical."),
]


def hashtags(n_locales: int = 3, n_nicho: int = 4) -> str:
    loc = random.sample(HASHTAGS_LOCALES, min(n_locales, len(HASHTAGS_LOCALES)))
    nic = random.sample(HASHTAGS_NICHO, min(n_nicho, len(HASHTAGS_NICHO)))
    return " ".join(loc + nic)


def cmd_copy(args: argparse.Namespace) -> None:
    tipo = args.tipo if args.tipo in TEMPLATES else "promo"
    plantilla = random.choice(TEMPLATES[tipo])
    cta = CTA_COMENTA if random.random() < 0.5 else CTA_LINK
    texto = plantilla.format(
        producto=args.producto or "nuestro postre artesanal",
        precio=args.precio or "precio de hoy",
        tienda=TIENDA,
        ciudad=CIUDAD,
        cta=cta,
    )
    print(texto)
    print()
    print(hashtags())
    print()
    print("─" * 50)
    print("Tips: publica entre 11:00–13:00 o 18:00–21:00 (hora Venezuela).")
    print("Responde TODOS los comentarios en la primera hora (empuja el alcance).")


def cmd_calendario(_: argparse.Namespace) -> None:
    hoy = date.today()
    print(f"📅 Calendario semanal de contenido — semana del {hoy.strftime('%d/%m/%Y')}\n")
    for i, (dia, tipo, idea) in enumerate(CALLES_TIPO):
        d = hoy + timedelta(days=i)
        print(f"{dia} {d.strftime('%d/%m')} — [{tipo.upper()}]")
        print(f"   Idea: {idea}")
        print(f"   Hashtags sugeridos: {hashtags(3, 3)}\n")


def cmd_dm(_: argparse.Namespace) -> None:
    print("🤖 Plantillas de respuesta automática por DM (ManyChat / Meta Business Suite)\n")
    for clave, plantilla in DM_PLANTILLAS.items():
        print(f"Palabra clave: «{clave.upper()}»")
        print("  " + plantilla.replace("\n", "\n  "))
        print()
    print("Configura estas plantillas en ManyChat → ver docs/GUIA_INSTAGRAM.md para el paso a paso.")


def cmd_bio(args: argparse.Namespace) -> None:
    link = args.link or "https://TU-DOMINIO/bio"
    print("📝 Bio sugerida para Instagram (máx. 150 caracteres por línea)\n")
    print("🍰 Postres artesanales con leche 100% fresca")
    print("🥛 Yogur griego · 🍮 Quesillo · 🍞 Torta de pan")
    print(f"📍 {CIUDAD} — Delivery el mismo día ⬇️")
    print(f"🔗 {link}")
    print("\nNota: en el perfil deja UN solo link (el /bio). Ahí está el menú y el WhatsApp directo.")


def main() -> int:
    parser = argparse.ArgumentParser(description=f"Automatización de contenido IG — {TIENDA}")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_copy = sub.add_parser("copy", help="Genera un copy persuasivo para una publicación")
    p_copy.add_argument("--producto", default="", help="Nombre del producto")
    p_copy.add_argument("--precio", default="", help='Precio, ej: "$5"')
    p_copy.add_argument("--tipo", default="promo", choices=sorted(TEMPLATES.keys()), help="Tipo de copy")
    p_copy.set_defaults(func=cmd_copy)

    p_cal = sub.add_parser("calendario", help="Imprime un calendario semanal de contenido")
    p_cal.set_defaults(func=cmd_calendario)

    p_dm = sub.add_parser("dm", help="Plantillas de respuesta automática por DM")
    p_dm.set_defaults(func=cmd_dm)

    p_bio = sub.add_parser("bio", help="Bio optimizada para el perfil")
    p_bio.add_argument("--link", default="", help="URL pública de tu /bio")
    p_bio.set_defaults(func=cmd_bio)

    args = parser.parse_args()
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
