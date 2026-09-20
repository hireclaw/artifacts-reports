---
name: mengto-threejs-sites
description: Meng To's exact workflow for building insane three.js websites in Codex — DiffUI brainstorm → "Copy for agent" → Codex (GPT-6 Astra) with transparent PNG layers, animations, and the MengTo/Skills 3D library. Use when building an awwwards-style 3D marketing site, a playable 3D web experience, or when the owner mentions the MengTo workflow, DiffUI, or Astra.
---

# MengTo Three.js Sites — Exact Workflow

Curated verbatim from Meng To (owner message, Sep 21 2026).

## Source — exact text

I recorded a 41-minute tutorial on how I use Astra to create insane three.js websites in Codex.

I've been using DiffUI to brainstorm UIs before moving into code. It's fast and cheap, generates multiple variants and lets you branch ideas, sections, logos, and other components.

Then I use "Copy for agent" and bring everything into Codex where I add transparent PNG layers, animations, and three.js skills.

Live sites:
- cardgame.mengto.here.now — "The Hunt" card game (faction select, orbiting 3D cards, inspect flow)
- renaissance.mengto.here.now — "The Renaissance Edition" (editorial e-commerce, collection filters, timeline, motion-pause toggle)

3D skills: https://github.com/MengTo/Skills

## Tool map (verified Sep 21 2026)
- **Astra** = GPT-6 Astra, OpenAI's model powering Codex
- **DiffUI** = diffui.ai — diffusion UI generator: multiple design options in parallel, branch variants, "Copy for agent" hand-off
- **MengTo/Skills** = 141 agent skills (MIT) for Codex/Claude/Cursor across 3d/, codex/, game-development/, media/, ui/, web-design/

## Workflow
1. Brainstorm in DiffUI before moving into code: prompt for multiple variants, branch ideas, sections, logos, and other components.
2. Use DiffUI's "Copy for agent" and bring everything into the coding agent (Codex; same hand-off works for Claude/Cursor).
3. In the agent: add transparent PNG layers, animations, and the three.js skills.
4. Load the narrowest matching SKILL.md first (repo convention), follow its steps + linked references, iterate with "change 1–2 things only".

## Skill library pointers
- 3D: 3d-virtual-tour, 3d-sky-rays, 3d-sky-background, 3d-falling-leaves, 3d-four-seasons, 3d-high-resolution-textures, 3d-high-poly-models, 3d-retina-resolution (200% Retina)
- Web/3D: threejs, gsap, matterjs, globe-gl, vantajs, cobejs, unicorn-studio, add-shader-cursor-trail, progressive-blur, animation-on-scroll, css-alpha-masking, build-awwwards-quality-sites, landing-page, tailwindcss
- Local clone (this machine): /home/visionclaw/tools/mengto-skills

## Three.js essentials (distilled from the repo's web-design/threejs SKILL.md)
- Scene + Camera (Perspective/Orthographic) + WebGLRenderer; Mesh = Geometry + Material; lights for non-unlit materials
- Loop: requestAnimationFrame → update time-based animations/controls/mixers → renderer.render(scene, camera)
- renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); handle resize (aspect + updateProjectionMatrix)
- Assets: GLTFLoader / DRACOLoader / TextureLoader
- Cleanup in SPAs: dispose geometry/material/texture/renderer, remove listeners, cancel RAF
- prefers-reduced-motion → render a still frame
- Pitfalls: missing resize handler, high DPR melting mobile GPUs, leaked WebGL resources on route changes, oversized textures, too many lights/shadows

## Guardrails
- Quote Meng To's steps exactly; don't paraphrase when replaying the workflow.
- Skills are operating procedures: when to use, defaults, acceptance checks — not encyclopedias.
- Prompts are assets: store and version them; references beat paragraphs.

## References
- Repo: https://github.com/MengTo/Skills (MIT)
- DiffUI: https://diffui.ai
- Astra: https://openai.com/index/gpt-6-astra/
