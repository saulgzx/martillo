# Frontend Brand Alignment - Martillo

Fecha: 2026-02-13

## Estado

- Estado actual: `DONE`.
- Fuente de verdad incorporada: `docs/manual-de-marca.docx`.
- Alcance ejecutado en esta iteracion:
  - Se centralizaron tokens tecnicos en `apps/frontend/lib/brand-tokens.ts`.
  - Se alinearon variables base de color en `apps/frontend/app/globals.css`.
  - Se agregaron colores de marca y tipografia base en `apps/frontend/tailwind.config.ts`.
  - Se definieron componentes base reutilizables:
    - `apps/frontend/components/ui/card.tsx`
    - `apps/frontend/components/ui/typography.tsx`
  - Se actualizaron ejemplos de UI en `apps/frontend/app/page.tsx`.
- Assets oficiales incorporados:
  - `apps/frontend/public/brand/martillo_icon.svg`
  - `apps/frontend/public/brand/martillo_icon_black.svg`
  - `apps/frontend/public/brand/martillo_icon_white.svg`

## Fuente de verdad requerida

Manual presente:

- `docs/manual-de-marca.docx`

`docs/brand-tokens.json` deberia incluir al menos:

- Paleta primaria/secundaria/acento (HEX o HSL)
- Tipografia (familias, pesos, escalas)
- Espaciado base y grilla
- Radios y sombras
- Reglas de uso del logo (tamano minimo y area de seguridad)
- Ejemplos de uso correcto/incorrecto

## Valores de marca aplicados (extraidos del manual)

- Navy principal: `#1A3C5E`
- Gris carbon: `#64748B`
- Azul medio: `#3B82C4`
- Azul claro: `#DBEAFE`
- Texto principal: `#0F172A`
- Fondo principal: `#F8FAFC`
- Tipografia principal: `Inter`
- Alternativas: `Geist Sans` (headings), `Geist Mono` (codigo/datos)

## Do / Don't (provisional, hasta manual oficial)

### Do

- Usar tokens desde variables CSS y/o `brand-tokens.ts`.
- Reutilizar componentes base (`Button`, `Card`, `Typography`) sin estilos inline.
- Mantener consistencia en estados `hover/focus/disabled`.

### Don't

- Introducir colores ad-hoc sin token.
- Cambiar tipografia global sin especificacion del manual.
- Alterar logo o proporciones sin guia oficial.

## Checklist para cerrar P0.3

- [x] Manual de marca agregado al repo.
- [x] Tokens finales aplicados en `globals.css` y `tailwind.config.ts`.
- [x] Logo y variantes implementados con reglas de area de seguridad.
- [x] Componentes base alineados a reglas visuales finales.
- [x] Validacion en responsive (mobile/tablet/desktop).
- [x] `npm run lint -w apps/frontend` en verde.
- [x] `npm run build -w apps/frontend` en verde.
