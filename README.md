# College 3D Complex

Interactive WebGL 3D architectural viewer for a 4-building college complex.

## Requirements
- Modern web browser with WebGL support
- HTTP server or local browser file access

## Running
Serve files locally using any static file server:
```bash
python -m http.server 8000
```
Or open `index.html` directly in a browser.

## Project Structure
- `index.html`: Entry point and UI overlay
- `css/style.css`: UI stylesheets
- `js/`: Application logic, Three.js orchestration, building modules
- `planing_zip/`: Architectural floor plans
