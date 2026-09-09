---
version: alpha
name: "Nathan's Revision Grove"
description: 'A GCSE study workspace with a low-poly progress tree and quiet account controls.'
colors:
  primary: '#f2a368'
  background: '#120f0d'
  foreground: '#fff1df'
  card: '#211a16'
  danger: '#ffac9d'
typography:
  sans:
    fontFamily: 'ui-sans-serif, system-ui, Segoe UI, sans-serif'
  mono:
    fontFamily: 'monospace'
rounded:
  DEFAULT: '0.35rem'
spacing:
  sidebar: '224px'
components:
  button: {}
  card: {}
  dialog: {}
---

# Revision Grove Design System

## Overview

The accepted identity is a warm brown study workspace with copper accents and green foliage, a growing Three.js tree and practical study controls. Product register: UK GCSE students planning revision on phones and school/home computers. Locale is en-GB. Account and admin pages extend the existing timetable dialogs; they do not introduce a new visual theme. Avoid marketing heroes, competitive rankings and decorative motion around security decisions.

## Colors

The existing app/globals.css :root variables are canonical runtime tokens. This document mirrors them: primary → --primary; background → --background; foreground → --foreground; card → --card; danger → --destructive. pages/styles.css is generated from that stylesheet and is never independently edited. Shared UI components consume the same Tailwind-mapped CSS variables.

## Typography

The static build uses the operating system UI font for display and body text, differentiated by size and weight, with monospace for maths and numerical information. This keeps the workspace crisp without remote font requests. New prose uses at least 14px with comfortable line height; headings use a tighter, practical hierarchy. Account forms and practice actions use sentence case and explicit verbs.

## Layout

The public homepage follows the user's two supplied ORYZO video references: near-black stage, warm copper-lit central 3D geometry, oversized cream lettering and compact rectangular controls. It uses concrete revision copy and 5px buttons. The photograph was removed at the user's request. Motion is confined to the homepage: a short entrance, controllable geometry rotation and an opt-in Remotion walkthrough. No scroll reveals, purple gradients, testimonials, invented metrics or generated photographs. Public tokens live in pages/public.css, with copper accent #f2a368 and background #120f0d. The revision workspace uses the same brown surfaces and copper accents. Green is reserved for confidence ratings and tree foliage. Social imagery is a deterministic typeset card in scripts/build-public-assets.mjs.

224px desktop sidebar; document scrolling; mobile drawer below 768px. Account and legal content has a 900px maximum width. Use natural page height and bounded horizontal overflow only inside data tables. Keep model/grid children min-width:0. Buttons wrap rather than overflow.

The Practice route uses a visible four-step task path, a large question surface and a narrower progress/resource rail. At tablet widths the rail moves below the question; on phones every control becomes a single-column target.

## Elevation & Depth

Panel backgrounds and subtle borders separate content. Base UI portals own modal depth and focus management. No new floating modal implementation.

## Shapes

The --radius of 0.35rem is the control reference. Existing panels and model cards keep their established shape. Use Lucide icons with labels for unfamiliar actions.

## Components

Public Home, Privacy, Cookies, Credits, Terms and Thank you use components/public-site.tsx without loading account services. The existing workspace moves to dashboard/ and retains its data keys. Homepage FAQ uses native details/summary, and breadcrumbs reuse the shared owner. Account links enter the existing authenticated workflow.
Input, Dialog, Select, Switch, Sidebar and Breadcrumb are canonical owners under components/ui. AccountField variants compose Input and a labelled password-visibility button. Dialog's initialFocus targets Cancel for destructive and role changes. Successful mutations wait for remote acknowledgement. Errors remain inline and entered values survive retry. Account cloud status comes only from authenticated state and confirmed database reads/writes.

RAG controls use text labels as well as colour. Red means relearn, amber means practise again and green means independent confidence. A rating updates the next review date but does not invent a completed session or add tree XP. First Class Maths booklets always open from their official URLs; the site does not embed or reproduce them.

## Motion

Respect prefers-reduced-motion. Animation is confined to the homepage. The revision workspace always uses quiet mode with manual tree rotation available. Account and privacy pages have no decorative animation.

## Do's and Don'ts

- Keep the tree as the distinctive visual element and account controls familiar.
- Keep guest, cloud, loading and failed-save labels explicit.
- Do not use role visibility as an authorization boundary.
- Do not change the global palette to match a Codex desktop theme.
