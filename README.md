# TimeTask · 日历任务融合应用

**Deadline 始终可见，完成打 ✅ 不删除。**

## 核心理念

传统日历的问题：任务到期删除后就没记录感了。
传统 Todo 的问题：没有时间线，缺乏紧迫感。

TimeTask 的解法：**日历即 Todo 面板**。每个任务在日历上占据它的截止日期格子，完成后不消失，只是打上 ✅ 标记并显示完成时间。时间线完整保留。

## 功能

- 📅 **月视图日历** — 直观看到每天的任务分布
- ➕ **添加任务** — 标题、日期、时间段、颜色标记、备注
- ✅ **完成标记** — 点击 ✓ 按钮标记完成，任务保留在日历上但显示为已完成（删除线 + ✅）
- 🔄 **取消完成** — 再次点击可取消完成状态
- ✏️ **编辑/删除** — 随时修改任务内容
- 📊 **统计栏** — 显示总计/已完成/待完成数量
- 📱 **PWA 支持** — 手机浏览器可添加到主屏幕，像原生 App 一样使用
- 🔄 **多设备同步** — 手机和电脑连接同一网络即可同步

## 启动方式

```bash
# 1. 首次使用创建虚拟环境
uv venv --python 3.14
source .venv/bin/activate
uv pip install flask flask-cors

# 2. 启动服务
source .venv/bin/activate
python backend/app.py

# 3. 打开浏览器访问
# http://localhost:5000
```

## 手机同步

1. 电脑启动服务后，查看电脑局域网 IP（如 192.168.x.x）
2. 手机连接同一 WiFi
3. 手机浏览器访问 `http://电脑IP:5000`
4. iOS Safari: 分享 → 添加到主屏幕
5. Android Chrome: 菜单 → 添加到主屏幕

## 项目结构

```
time_task/
├── backend/
│   ├── app.py           # Flask 后端 API
│   └── requirements.txt
├── frontend/
│   ├── index.html       # 主页面
│   ├── manifest.json    # PWA 配置
│   ├── sw.js            # Service Worker
│   ├── css/
│   │   └── style.css    # 样式
│   └── js/
│       ├── api.js       # API 封装
│       ├── calendar.js  # 日历渲染
│       └── app.js       # 主逻辑
├── start.sh
└── README.md
```
