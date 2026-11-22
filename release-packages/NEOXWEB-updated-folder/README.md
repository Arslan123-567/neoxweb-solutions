# NEOXWEB Updated Source Package

This folder contains the current NEOXWEB website frontend, PHP backend, and realtime server.
The source is packaged without installed dependencies, runtime uploads, logs, or private credentials.

## Folder layout

- `project/` — static website, Netlify configuration, SEO files, and frontend scripts.
- `backend/` — PHP API, admin panel, database installer, and `.env.example`.
- `realtime/` — Socket.io server and npm manifests.
- `index.html` — opens the website from the package root.
- `netlify.toml` — Git-based Netlify configuration; the frontend publish folder is `project/`.

## View or deploy the website

- Open `project/index.html` through a local web server for local preview.
- For a manual Netlify upload, use the contents of `project/` (or `NEOXWEB-frontend.zip`), not this whole full-stack folder.
- The website contact form uses Netlify Forms when no PHP API URL is configured.
- The PHP API and admin inbox require a separate PHP/MySQL host. See `backend/INSTALL.md`.

## Before starting the backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set database credentials and replace the example JWT and token-encryption keys.
3. Configure the production API URL in the frontend when connecting it to the PHP backend.
4. Change any initial admin password during setup.

The private `.env`, provider configuration files, client credential file, and generated uploads are intentionally not included.
Create dependencies locally with `npm install` in `realtime/` before running the realtime server.
