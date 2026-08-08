---
name: Architectural Scholar
colors:
  surface: '#f3fbf6'
  surface-dim: '#d3dcd7'
  surface-bright: '#f3fbf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf6f0'
  surface-container: '#e7f0eb'
  surface-container-high: '#e2eae5'
  surface-container-highest: '#dce5df'
  on-surface: '#151d1a'
  on-surface-variant: '#454742'
  inverse-surface: '#2a322f'
  inverse-on-surface: '#eaf3ee'
  outline: '#767872'
  outline-variant: '#c6c7c0'
  surface-tint: '#5e5e5c'
  primary: '#5e5e5c'
  on-primary: '#ffffff'
  primary-container: '#fdfbf7'
  on-primary-container: '#747471'
  inverse-primary: '#c8c6c3'
  secondary: '#745a3a'
  on-secondary: '#ffffff'
  secondary-container: '#fed9b1'
  on-secondary-container: '#795e3e'
  tertiary: '#00677e'
  on-tertiary: '#ffffff'
  tertiary-container: '#f7fcff'
  on-tertiary-container: '#007e9a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e2de'
  primary-fixed-dim: '#c8c6c3'
  on-primary-fixed: '#1b1c1a'
  on-primary-fixed-variant: '#474744'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#e4c19a'
  on-secondary-fixed: '#2a1801'
  on-secondary-fixed-variant: '#5a4224'
  tertiary-fixed: '#b5ebff'
  tertiary-fixed-dim: '#58d5fb'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e60'
  background: '#f3fbf6'
  on-background: '#151d1a'
  surface-variant: '#dce5df'
  alabaster-surface: '#FDFBF7'
  birch-accent: '#D4B28C'
  ink-charcoal: '#1C2421'
  electric-cyan: '#00A8CC'
typography:
  display-xl:
    fontFamily: anybody
    fontSize: 120px
    fontWeight: '900'
    lineHeight: 110px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: anybody
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: anybody
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: anybody
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  body-lg:
    fontFamily: manrope
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: spaceMono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  quote-editorial:
    fontFamily: manrope
    fontSize: 28px
    fontWeight: '300'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 32px
  margin-edge: 64px
  bento-gap: 16px
---

## Brand & Style

The design system is built upon the concept of **Tactile Editorial Fluidity**. It targets a premium demographic of students and professionals who seek a "sanctuary" for deep work. The emotional response should be one of immediate calm followed by intense focus—evoking the feeling of stepping into a high-end, modern architectural library.

The design style is a hybrid of **Minimalism** and **Tactile Skeuomorphism**. We leverage heavy whitespace and a restricted palette (Minimalism) while introducing physical metaphors like paper textures and wood finishes (Tactile). The "Heavy Impact" comes from aggressive, oversized typography that anchors the fluid layout, creating a rhythmic, editorial experience similar to a premium broadsheet or an architectural monograph.

## Colors

This design system utilizes a high-contrast, warm-neutral palette. 

- **Alabaster Milk White** is the foundation for all surfaces. Avoid pure `#FFFFFF` to prevent eye strain during long reading sessions.
- **Slate Charcoal Ink** provides the "Heavy Impact" for typography. It is preferred over pure black to maintain a sophisticated, ink-on-paper feel.
- **Natural Birch Wood** is used for structural accents, dividers, and decorative "squircle" containers to ground the UI in physical reality.
- **Vibrant Cyan** is the surgical strike of color. It is reserved exclusively for digital-first interactions, call-to-actions, and interactive states to differentiate "the building" from "the service."

## Typography

The typographic hierarchy is the primary visual engine of this design system. 

**Anybody** is used for headlines. Its variable nature allows for a heavy, architectural presence that feels custom-built. Use the boldest weights for section headers to create "Heavy Impact."

**Manrope** serves as the body face. It bridges the gap between a technical grotesque and a warm humanist sans, ensuring long-form legibility for membership terms or library rules.

**Space Mono** is used for metadata, labels, and GPS coordinates in the footer. This adds a layer of modern precision and "archival" feel to the scholarly aesthetic.

## Layout & Spacing

The layout utilizes a **12-column Bento Grid** system. Content is organized into modular "cells" of varying sizes, reflecting the compartmentalized focus of a study hall.

- **Fluidity:** On desktop, use generous horizontal margins (64px) to center the content, creating a focused reading path.
- **Bento Logic:** Feature sections (Facilities, Gallery) should use a strict grid with consistent 16px gaps. Elements should span 3, 6, or 9 columns to maintain a rhythmic but asymmetrical balance.
- **Wave Masks:** The Hero section and large-scale transitions utilize "Fluid" wave masks to break the rigid geometry of the grid, suggesting the flow of thought and focus.

## Elevation & Depth

This system avoids traditional drop shadows in favor of **Tonal Layering and Physical Textures**.

- **Surfaces:** Use a subtle "Paper Grain" SVG overlay on the Alabaster background.
- **Tactile Depth:** Instead of shadows, use "Inner Wood Strokes"—1px borders in Natural Birch (#D4B28C) with a very slight inner glow to simulate the depth of carved wood.
- **Glassmorphism:** Reserved for the "Noiric Cafe" navigation elements. Use a high-blur (20px) backdrop filter with 40% opacity Alabaster to simulate a frosted glass window looking into a warm cafe.

## Shapes

The primary shape language is the **Squircle**. Unlike standard rounded rectangles, squircles use continuous curvature (G2 continuity) to feel more organic and "architectural."

- **Cards & Bento Cells:** Apply `rounded-lg` (1rem/16px) using squircle math.
- **CTAs & Buttons:** Use `rounded-xl` (1.5rem/24px) for a soft, tactile feel that invites touch.
- **QR Codes:** The QR container must be a rigid squircle with a birch wood border.

## Components

### Navigation
The header is a fixed, minimalist bar. To the right, include a distinct "Noiric Cafe" link styled as a semi-transparent glass button, visually separating the "social/fuel" space from the "silent" library space.

### Bento Feature Cards
Each card uses an Alabaster surface with a subtle paper texture. Headlines inside cards should use `headline-md` (Anybody) for immediate impact. Use Natural Birch for icons or small decorative "inlay" details.

### Hero Section
The hero features a massive `display-xl` headline. The bottom of the hero container is clipped with a custom "Focus Wave" mask that flows into the first content section.

### Membership Tables
Avoid standard borders. Use alternating "Birch" and "Alabaster" horizontal bands. Prices should be set in `display-xl` or `headline-lg` to exert the "Heavy Impact" philosophy.

### QR Interaction
QR codes for check-ins are housed in "Tactile Frames"—a birch wood squircle container that appears slightly inset into the page surface using an inner shadow.

### Footer
The footer is Slate Charcoal with Alabaster text. Address and GPS coordinates must be set in `label-caps` (Space Mono) to emphasize the "Sanctuary" as a specific, physical destination.