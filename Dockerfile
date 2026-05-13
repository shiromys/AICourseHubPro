# ---- Stage 1: Build the React frontend ----
FROM node:20-slim AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Run the Flask backend ----
FROM python:3.11-slim

WORKDIR /app

# Copy backend files
COPY backend/ .

# Copy built frontend dist from stage 1
# Flask static_folder="../frontend/dist" resolves to /frontend/dist
COPY --from=frontend-builder /build/frontend/dist /frontend/dist

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=8080
EXPOSE 8080

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "app:app"]