#!/bin/bash
# TimeTask 启动脚本
cd "$(dirname "$0")"
source .venv/bin/activate
python backend/app.py
