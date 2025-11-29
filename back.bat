$env:FRONTEND_ORIGIN='http://192.168.1.3:5173,http://localhost:5173'; 
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload