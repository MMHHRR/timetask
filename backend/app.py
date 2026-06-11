"""
TimeTask - 日历与 Todo 融合应用
Deadline 始终保留在日历上，完成时打 ✅ 标记
"""

import os
import sqlite3
from datetime import datetime, date
from flask import Flask, g, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=None)

# ── 数据库 ──────────────────────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), "timetask.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


def close_db( exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL,
            description TEXT    DEFAULT '',
            event_date  TEXT    NOT NULL,   -- YYYY-MM-DD
            start_time  TEXT    DEFAULT '',  -- HH:MM
            end_time    TEXT    DEFAULT '',  -- HH:MM
            color       TEXT    DEFAULT '#4A90D9',
            project     TEXT    DEFAULT '',
            completed   INTEGER DEFAULT 0,  -- 0=未完成, 1=已完成
            completed_at TEXT   DEFAULT NULL,
            created_at  TEXT    DEFAULT (datetime('now','localtime')),
            updated_at  TEXT    DEFAULT (datetime('now','localtime'))
        );
    """)
    # 兼容旧数据库：尝试添加 project 列（已存在则忽略）
    try:
        db.execute("ALTER TABLE events ADD COLUMN project TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass
    db.commit()
    db.close()


# ── API ──────────────────────────────────────────────────

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    return response


# ---- 获取事件列表 ----
@app.route("/api/events", methods=["GET"])
def get_events():
    year = request.args.get("year")
    month = request.args.get("month")
    db = get_db()
    query = "SELECT * FROM events"
    params = []
    if year and month:
        query += " WHERE strftime('%Y', event_date) = ? AND strftime('%m', event_date) = ?"
        params = [year, f"{int(month):02d}"]
    query += " ORDER BY event_date, start_time"
    rows = db.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])


# ---- 创建事件 ----
@app.route("/api/events", methods=["POST"])
def create_event():
    data = request.json
    db = get_db()
    cur = db.execute(
        """INSERT INTO events (title, description, event_date, start_time, end_time, color, project)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            data["title"],
            data.get("description", ""),
            data["event_date"],
            data.get("start_time", ""),
            data.get("end_time", ""),
            data.get("color", "#4A90D9"),
            data.get("project", ""),
        ),
    )
    db.commit()
    event_id = cur.lastrowid
    row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return jsonify(dict(row)), 201


# ---- 更新事件 ----
@app.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.json
    db = get_db()
    fields = []
    values = []
    for key in ("title", "description", "event_date", "start_time", "end_time", "color", "project"):
        if key in data:
            fields.append(f"{key} = ?")
            values.append(data[key])
    if fields:
        fields.append("updated_at = datetime('now','localtime')")
        values.append(event_id)
        db.execute(
            f"UPDATE events SET {', '.join(fields)} WHERE id = ?",
            values,
        )
        db.commit()
    row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return jsonify(dict(row))


# ---- ✅ 标记完成 / 取消完成 ----
@app.route("/api/events/<int:event_id>/toggle", methods=["PATCH"])
def toggle_complete(event_id):
    db = get_db()
    row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not row:
        return jsonify({"error": "Event not found"}), 404
    current = row["completed"]
    new_val = 0 if current else 1
    db.execute(
        """UPDATE events SET completed = ?, completed_at = CASE WHEN ? THEN datetime('now','localtime') ELSE NULL END,
           updated_at = datetime('now','localtime') WHERE id = ?""",
        (new_val, new_val, event_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    return jsonify(dict(row))


# ---- 删除事件 ----
@app.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    db = get_db()
    db.execute("DELETE FROM events WHERE id = ?", (event_id,))
    db.commit()
    return jsonify({"ok": True})


# ---- 获取所有项目列表 ----
@app.route("/api/projects", methods=["GET"])
def get_projects():
    db = get_db()
    rows = db.execute(
        "SELECT DISTINCT project FROM events WHERE project != '' ORDER BY project"
    ).fetchall()
    return jsonify([r["project"] for r in rows])


# ── 前端静态文件 ────────────────────────────────────────

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# ── 启动 ──────────────────────────────────────────────────

# gunicorn 启动时也初始化数据库
with app.app_context():
    init_db()

if __name__ == "__main__":
    print("🚀 TimeTask 启动: http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
