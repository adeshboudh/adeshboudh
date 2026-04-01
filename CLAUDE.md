# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is **Adesh Boudh's GitHub profile + portfolio repository** (`adeshboudh/adeshboudh`). The goal is to host a personal portfolio site via **GitHub Pages** at `https://adeshboudh.github.io/adeshboudh/`.

The portfolio is for an **AI/ML Engineer** specializing in production-grade RAG pipelines, LLM integration, and scalable AI backend systems. Key skills: Python, PyTorch, Hugging Face, LangGraph, FastAPI, Docker, GCP, AWS, pgvector, Neo4j, MongoDB.

## Current Status

As of 2026-04-01, the portfolio site (`index.html`) is built and active. It is a static HTML/CSS/JavaScript application deployed via GitHub Pages showcasing Adesh Boudh's work as an AI/ML Engineer.

## GitHub Pages Setup

- GitHub Pages is served from the `main` branch. The entry point must be `index.html` at the repo root.
- No build pipeline required — static HTML/CSS/JS files deploy automatically on push.
- The PDF resume (`adesh_boudh_6.0.pdf`) is already in the repo root and should be linked from the portfolio.

## Local Preview

```bash
python -m http.server 8080
# Open http://localhost:8080
```

## Architecture

Static site — plain HTML, CSS, and JavaScript with no build step, so GitHub Pages can serve it directly.

Key files:
- `index.html` — main portfolio page
- `adesh_boudh.pdf` — resume (link from index.html)
- `adesh_boudh_master_career_doc.md` — full career document (source of truth for profile content)

## Owner Info

- **Email:** adeshboudh16@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/adeshboudh/
- **GitHub:** https://github.com/adeshboudh
- **HuggingFace:** https://huggingface.co/adesh01