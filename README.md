# LLM MCP Sandbox - Docker Setup

Lokale Sandbox-Umgebung für LLM-Dokumentenverarbeitung mit Model Context Protocol (MCP).

## Features

- 📄 PDF-Textextraktion mit PyPDF2
- 📝 Office-Dokumente (DOCX, XLSX, PPTX)
- 🤖 Claude API Integration
- 🐳 Vollständig containerisiert
- 🔒 Lokale Verarbeitung

## Voraussetzungen

- Docker Desktop für macOS
- Anthropic API Key

## Installation

1. **Projekt-Struktur erstellen:**

```bash
mkdir llm-mcp-sandbox
cd llm-mcp-sandbox

# Verzeichnisse erstellen
mkdir -p frontend/src frontend/public backend uploads
```

2. **Dateien erstellen:**

Kopiere die bereitgestellten Dateien in die entsprechenden Verzeichnisse:
- `docker-compose.yml` im Root
- `frontend/Dockerfile`
- `frontend/package.json`
- `frontend/public/index.html`
- `backend/Dockerfile`
- `backend/requirements.txt`
- `backend/main.py`

3. **Environment-Datei:**

```bash
cp .env.example .env
```

Bearbeite `.env` und füge deinen Anthropic API Key ein:
```
ANTHROPIC_API_KEY=sk-ant-...
```

4. **Frontend App erstellen:**

Erstelle `frontend/src/index.js`:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

Erstelle `frontend/src/App.js` mit dem React-Code (siehe Artifact oben).

## Starten

```bash
# Container bauen und starten
docker-compose up --build

# Im Hintergrund starten
docker-compose up -d
```

Die Anwendung ist verfügbar unter:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Verwendung

1. Öffne http://localhost:3000
2. Lade Dokumente hoch (PDF, DOCX, XLSX, PPTX, TXT)
3. Stelle Fragen zu deinen Dokumenten
4. Der Assistent antwortet basierend auf dem Kontext

## Stoppen

```bash
docker-compose down

# Mit Volumes löschen
docker-compose down -v
```

## Logs anzeigen

```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

## Troubleshooting

**API Key nicht gesetzt:**
```bash
docker-compose restart backend
```

**Port bereits belegt:**
Ändere die Ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend
  - "8001:8000"  # Backend
```

**Container neu bauen:**
```bash
docker-compose build --no-cache
docker-compose up
```

## Architektur

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │────────>│   Frontend  │────────>│   Backend   │
│             │         │   (React)   │         │  (FastAPI)  │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        v
                                                 ┌─────────────┐
                                                 │  Claude API │
                                                 └─────────────┘
```

## Unterstützte Dateiformate

- PDF (`.pdf`)
- Word (`.docx`)
- Excel (`.xlsx`, `.xls`)
- PowerPoint (`.pptx`)
- Text (`.txt`)

## Sicherheit

- Alle Daten bleiben lokal
- Nur extrahierte Texte werden an Claude API gesendet
- Originaldateien verbleiben im Upload-Verzeichnis
- API Key nur im Backend Container

## Entwicklung

Frontend Code ändern:
```bash
# Änderungen werden automatisch geladen (Hot Reload)
# Dateien im frontend/src/ Verzeichnis bearbeiten
```

Backend Code ändern:
```bash
# FastAPI mit --reload läuft automatisch neu
# Dateien im backend/ Verzeichnis bearbeiten
```
