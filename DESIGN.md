---
version: alpha
name: "Nathan's Revision Grove"
description: "A GCSE study workspace with a low-poly progress tree and quiet account controls."
colors:
  primary: "#d2f59b"
  background: "#101411"
  foreground: "#f2f4ec"
  card: "#191e1a"
  danger: "#ffac9d"
typography:
  sans:
    fontFamily: "Arial, sans-serif"
  mono:
    fontFamily: "monospace"
rounded:
  DEFAULT: "0.8rem"
spacing:
  sidebar: "224px"
components:
  button: {}
  card: {}
  dialog: {}
---

# Revision Grove Design System

## Overview
The accepted identity is a dark garden with lime foliage, a growing Three.js tree and practical study controls. Product register: UK GCSE students planning revision on phones and school/home computers. Locale is en-GB. Account and admin pages extend the existing timetable dialogs; they do not introduce a new visual theme. Avoid marketing heroes, competitive rankings and decorative motion around security decisions.

## Colors
The existing app/globals.css :root variables are canonical runtime tokens. This document mirrors them: primary → --primary; background → --background; foreground → --foreground; card → --card; danger → --destructive. pages/styles.css is generated from that stylesheet and is never independently edited. Shared UI components consume the same Tailwind-mapped CSS variables.

## Typography
The static build uses Arial for display and body text, differentiated by size and weight, with monospace for maths and numerical information. This preserves the approved design without remote font requests. New prose uses 15px and 1.75 line height; headings 24px. Account forms use sentence case and explicit action verbs.

## Layout
224px desktop sidebar; document scrolling; mobile drawer below 768px. Account and legal content has a 900px maximum width. Use natural page height and bounded horizontal overflow only inside data tables. Keep model/grid children min-width:0. Buttons wrap rather than overflow.

## Elevation & Depth
Panel backgrounds and subtle borders separate content. Base UI portals own modal depth and focus management. No new floating modal implementation.

## Shapes
The existing --radius of 0.8rem remains the control reference. Existing panels and model cards keep their established shape. Use Lucide icons with labels for unfamiliar actions.

## Components
Input, Dialog, Select, Switch, Sidebar and Breadcrumb are canonical owners under components/ui. AccountField variants compose Input and a labelled password-visibility button. Dialog's initialFocus targets Cancel for destructive and role changes. Successful mutations wait for remote acknowledgement. Errors remain inline and entered values survive retry. Account cloud status comes only from authenticated state and confirmed database reads/writes.

## Motion
Respect prefers-reduced-motion and the existing Calm motion control. Account and privacy pages need no decorative animation. Retain manual tree rotation when calm mode is active.

## Do's and Don'ts
- Keep the tree as the distinctive visual element and account controls familiar.
- Keep guest, cloud, loading and failed-save labels explicit.
- Do not use role visibility as an authorization boundary.
- Do not change the global palette to match a Codex desktop theme.
