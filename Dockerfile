# ─── TimeTask Docker ────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir gunicorn && \
    pip install --no-cache-dir -r requirements.txt

# 复制后端
COPY backend/ ./backend/

# 复制前端
COPY frontend/ ./frontend/

# 暴露端口
EXPOSE 5000

# 启动：gunicorn 生产模式
WORKDIR /app/backend
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --access-logfile - app:app"]
