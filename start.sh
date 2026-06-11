#!/bin/bash
# TimeTask 启动脚本
cd "$(dirname "$0")"

# ─── Docker 部署（推荐） ───
# 首次: docker compose up -d
# 更新: docker compose up -d --build
# 停止: docker compose down
# 查看日志: docker compose logs -f

# ─── 本地开发 ───
source .venv/bin/activate
python backend/app.py
