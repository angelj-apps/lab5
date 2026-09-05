@echo off
cd /d "%~dp0"
set PORT=8765
echo.
echo Lab 5 — starting server on http://127.0.0.1:%PORT%
echo Leave this window open while you use the app.
echo Press Ctrl+C to stop.
echo.
start "" "http://127.0.0.1:%PORT%/?v=6"
python serve.py %PORT%
