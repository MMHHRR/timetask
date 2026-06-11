/**
 * TimeTask — 主应用逻辑
 * 日历 + Todo 融合：deadline 始终保留，✅ 完成标记
 */

(function () {
    'use strict';

    // ─── 状态 ───
    let currentYear, currentMonth;
    let allEvents = [];
    let selectedDate = null;
    let editingEvent = null; // 编辑中的事件
    let listViewMode = null; // null=日历, 'total'/'done'/'pending'=列表
    let listSortBy = 'time'; // 'time' | 'category'
    let viewMode = 'month'; // 'month' | 'year'
    let timelineMode = false; // true=显示时间线视图

    // ─── DOM 引用 ───
    const $ = id => document.getElementById(id);
    const monthLabel = $('month-label');
    const btnPrev = $('btn-prev');
    const btnNext = $('btn-next');
    const btnToday = $('btn-today');
    const btnTodayText = $('btn-today-text');
    const btnAdd = $('btn-add');
    const modal = $('event-modal');
    const modalInner = modal ? modal.querySelector('.modal-inner') : null;
    const overlay = $('modal-overlay');
    const modalTitle = $('modal-title');
    const eventForm = $('event-form');
    const eventId = $('event-id');
    const eventTitle = $('event-title');
    const eventDate = $('event-date');
    const eventDateDisplay = $('event-date-display');
    const eventStart = $('event-start');
    const eventStartDisplay = $('event-start-display');
    const eventEnd = $('event-end');
    const eventEndDisplay = $('event-end-display');
    const eventDesc = $('event-desc');
    const btnSave = $('btn-save-event');
    const btnDelete = $('btn-delete-event');
    const btnCloseModal = $('btn-close-modal');
    const detailPanel = $('detail-panel');
    const detailDateTitle = $('detail-date-title');
    const detailEvents = $('detail-events');
    const btnCloseDetail = $('btn-close-detail');
    const statsTotal = $('stats-total');
    const statsDone = $('stats-done');
    const statsPending = $('stats-pending');
    const statsBar = $('stats-bar');
    const listView = $('list-view');
    const listViewTitle = $('list-view-title');
    const listViewEvents = $('list-view-events');
    const btnSortTime = $('btn-sort-time');
    const btnSortCategory = $('btn-sort-category');
    const calendarContainer = document.getElementById('calendar-container');
    const toast = $('toast');
    const eventProject = $('event-project');
    const timelineView = $('timeline-view');
    const timelineEvents = $('timeline-events');
    const statsTimeline = $('stats-timeline');

    // ─── 初始化 ───
    function init() {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth() + 1;
        loadEvents();
        loadProjects();
        bindEvents();
        bindProjectSuggestions();
        initHolidayToggles();
        syncDateDisplay();
        syncTimeDisplay();
        // GSAP 动画
        if (typeof animations !== 'undefined') {
            animations.setupHoverEffects();
        }
    }

    // ─── 加载项目列表 ───
    let allProjects = [];

    async function loadProjects() {
        try {
            allProjects = await api.getProjects();
        } catch (e) {
            // 静默失败
        }
    }

    // ─── 显示项目建议下拉 ───
    function showProjectSuggestions(filter) {
        const list = document.getElementById('project-suggestions');
        const matches = filter
            ? allProjects.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
            : allProjects;
        if (matches.length === 0) {
            list.classList.add('hidden');
            return;
        }
        list.innerHTML = matches.map(p =>
            `<div class="project-suggestion-item" data-project="${p}">${p}</div>`
        ).join('');
        list.classList.remove('hidden');

        // 点击建议项填充
        list.querySelectorAll('.project-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                eventProject.value = item.dataset.project;
                list.classList.add('hidden');
                eventProject.focus();
            });
        });
    }

    // ─── 绑定项目输入建议 ───
    function bindProjectSuggestions() {
        eventProject.addEventListener('input', () => {
            showProjectSuggestions(eventProject.value);
        });
        eventProject.addEventListener('blur', () => {
            setTimeout(() => {
                document.getElementById('project-suggestions').classList.add('hidden');
            }, 200);
        });
        eventProject.addEventListener('focus', () => {
            showProjectSuggestions(eventProject.value);
        });
    }

    // ─── 节假日开关（互斥二选一） ───
    function initHolidayToggles() {
        const toggles = document.querySelectorAll('.holiday-toggle');
        toggles.forEach(btn => {
            btn.addEventListener('click', () => {
                // 点同一个取消选中
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    render();
                    return;
                }
                // 取消其他，选中当前
                toggles.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render();
            });
        });
    }

    // ─── 加载事件 ───
    async function loadEvents() {
        try {
            const events = await api.getAllEvents();
            allEvents = events;
            render();
            // 首次加载完成后播放入场动画
            if (typeof animations !== 'undefined') {
                animations.pageEntrance();
            }
        } catch (e) {
            showToast('<i data-lucide="alert-triangle"></i> 加载失败，请确认后端已启动');
        }
    }

    // ─── 渲染 ───
    function render() {
        if (timelineMode) {
            // ── 时间线模式 ──
            calendarContainer.classList.add('hidden');
            document.getElementById('weekday-header')?.classList.add('hidden');
            document.getElementById('holiday-legend')?.classList.add('hidden');
            detailPanel.classList.add('hidden');
            listView.classList.add('hidden');
            selectedDate = null;
            btnToday.innerHTML = '<i data-lucide="calendar"></i>';
            btnToday.title = '日历视图';
            updateMonthLabel();
            statsBar.classList.remove('clickable');
            renderTimeline();
            timelineView.classList.remove('hidden');
        } else if (listViewMode) {
            // ── Todo 列表模式 ──
            calendarContainer.classList.add('hidden');
            document.getElementById('weekday-header')?.classList.add('hidden');
            document.getElementById('holiday-legend')?.classList.add('hidden');
            detailPanel.classList.add('hidden');
            selectedDate = null;
            btnToday.innerHTML = '<i data-lucide="calendar"></i>';
            btnToday.title = '日历视图';
            updateMonthLabel();
            statsBar.classList.add('clickable');
            renderListView();
            listView.classList.remove('hidden');
            timelineView.classList.add('hidden');
        } else if (viewMode === 'year') {
            // ── 年视图模式 ──
            statsBar.classList.remove('clickable');
            calendarContainer.classList.remove('hidden');
            document.getElementById('weekday-header')?.classList.add('hidden');
            document.getElementById('holiday-legend')?.classList.add('hidden');
            listView.classList.add('hidden');
            timelineView.classList.add('hidden');
            detailPanel.classList.add('hidden');
            btnPrev.style.display = '';
            btnNext.style.display = '';
            btnToday.style.display = '';
            btnToday.innerHTML = '<i data-lucide="list"></i>';
            btnToday.title = '列表视图';
            updateMonthLabel();
            Calendar.renderYear(currentYear, allEvents);
        } else {
            // ── 月视图模式 ──
            statsBar.classList.remove('clickable');
            calendarContainer.classList.remove('hidden');
            document.getElementById('weekday-header')?.classList.remove('hidden');
            document.getElementById('holiday-legend')?.classList.remove('hidden');
            listView.classList.add('hidden');
            timelineView.classList.add('hidden');
            btnPrev.style.display = '';
            btnNext.style.display = '';
            btnToday.style.display = '';
            btnToday.innerHTML = '<i data-lucide="list"></i>';
            btnToday.title = '列表视图';
            updateMonthLabel();
            Calendar.render(currentYear, currentMonth, allEvents, selectedDate);
            if (selectedDate) renderDetail(selectedDate);
        }
        updateStats();
        renderHeatmap();
        // 底部导航按钮状态
        statsTimeline.classList.toggle('active', timelineMode);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function updateMonthLabel() {
        if (viewMode === 'year') {
            monthLabel.textContent = `${currentYear}年`;
            monthLabel.style.cursor = 'pointer';
            monthLabel.title = '点击回到月视图';
        } else {
            monthLabel.textContent = `${currentYear}年 ${currentMonth}月`;
            monthLabel.style.cursor = 'pointer';
            monthLabel.title = '点击查看年视图';
        }
    }

    function updateStats() {
        const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const monthEvents = allEvents.filter(e => e.event_date.startsWith(prefix));
        const total = monthEvents.length;
        const done = monthEvents.filter(e => e.completed).length;
        const pending = total - done;
        statsTotal.innerHTML = `<i data-lucide="clipboard-list"></i> 总计 ${total}`;
        statsDone.innerHTML = `<i data-lucide="check-circle"></i> 已完成 ${done}`;
        statsPending.innerHTML = `<i data-lucide="hourglass"></i> 待完成 ${pending}`;

        // 高亮当前筛选模式
        [statsTotal, statsDone, statsPending].forEach(el => el.classList.remove('active'));
        if (listViewMode === 'total') statsTotal.classList.add('active');
        else if (listViewMode === 'done') statsDone.classList.add('active');
        else if (listViewMode === 'pending') statsPending.classList.add('active');
    }

    // ─── 热力图渲染 ───
    function renderHeatmap(year, month) {
        const container = document.getElementById('heatmap');
        if (!container) return;

        const targetYear = year !== undefined ? year : currentYear;
        const targetMonth = month !== undefined ? month : currentMonth;

        const firstDay = new Date(targetYear, targetMonth - 1, 1);
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const startDow = firstDay.getDay(); // 0=Sun

        // 统计本月每天的事件数
        const prefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        const dayCount = {};
        allEvents.filter(e => e.event_date.startsWith(prefix)).forEach(e => {
            const day = parseInt(e.event_date.split('-')[2]);
            dayCount[day] = (dayCount[day] || 0) + 1;
        });

        // 确定行数
        const totalCells = startDow + daysInMonth;
        const rows = Math.ceil(totalCells / 7);

        container.style.gridTemplateColumns = 'repeat(7, 1fr)';
        container.style.gridTemplateRows = `repeat(${rows}, auto)`;

        let html = '';
        // 月首前的空白格（mask）
        for (let i = 0; i < startDow; i++) {
            html += '<div class="heatmap-cell mask"></div>';
        }
        // 每天
        for (let d = 1; d <= daysInMonth; d++) {
            const count = dayCount[d] || 0;
            let level = 0;
            if (count >= 1) level = 1;
            if (count >= 2) level = 2;
            if (count >= 3) level = 3;
            if (count >= 5) level = 4;
            html += `<div class="heatmap-cell lv${level}" title="${targetYear}-${String(targetMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}: ${count} 项"></div>`;
        }
        // 末尾空白格（mask）
        const remaining = rows * 7 - (startDow + daysInMonth);
        for (let i = 0; i < remaining; i++) {
            html += '<div class="heatmap-cell mask"></div>';
        }
        container.innerHTML = html;
    }

    // ─── 日期显示同步 ───
    function syncTimeDisplay() {
        [
            { input: eventStart, display: eventStartDisplay },
            { input: eventEnd, display: eventEndDisplay }
        ].forEach(({ input, display }) => {
            if (!input || !display) return;
            input.addEventListener('change', () => {
                display.value = input.value || '';
            });
            display.addEventListener('click', () => {
                input.showPicker ? input.showPicker() : input.click();
            });
            display.value = input.value || '';
        });
    }

    function syncDateDisplay() {
        if (!eventDate || !eventDateDisplay) return;
        // 隐藏 date input 变化时更新显示
        eventDate.addEventListener('change', () => {
            if (eventDate.value) {
                const [y, m, d] = eventDate.value.split('-');
                eventDateDisplay.value = `${y}年${m}月${d}日`;
            }
        });
        // 点击显示字段触发隐藏 date picker
        eventDateDisplay.addEventListener('click', () => {
            eventDate.showPicker ? eventDate.showPicker() : eventDate.click();
        });
        // 初始同步
        if (eventDate.value) {
            const [y, m, d] = eventDate.value.split('-');
            eventDateDisplay.value = `${y}年${m}月${d}日`;
        }
    }

    // ─── 渲染列表视图 ───
    function renderListView() {
        const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        let monthEvents = allEvents.filter(e => e.event_date.startsWith(prefix));

        // 筛选
        if (listViewMode === 'done') monthEvents = monthEvents.filter(e => e.completed);
        else if (listViewMode === 'pending') monthEvents = monthEvents.filter(e => !e.completed);

        // 排序
        if (listSortBy === 'category') {
            monthEvents.sort((a, b) => (a.color || '#4A90D9').localeCompare(b.color || '#4A90D9') || a.event_date.localeCompare(b.event_date) || (a.start_time || '').localeCompare(b.start_time || ''));
        } else {
            monthEvents.sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.start_time || '').localeCompare(b.start_time || ''));
        }

        const labels = { total: `本月全部 (${monthEvents.length})`, done: `已完成 (${monthEvents.length})`, pending: `待完成 (${monthEvents.length})` };
        listViewTitle.innerHTML = `<i data-lucide="list"></i> ${labels[listViewMode] || ''}`;

        if (monthEvents.length === 0) {
            listViewEvents.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><i data-lucide="inbox" style="width:48px;height:48px;stroke-width:1.5;color:#CBD5E0;"></i></div>
                    <div>暂无任务</div>
                </div>`;
            return;
        }

        let html = '';
        monthEvents.forEach(ev => {
            const dateLabel = ev.event_date.slice(5);
            const timeLabel = [ev.start_time, ev.end_time].filter(Boolean).join(' - ') || '全天';
            html += `
                <div class="list-event-item${ev.completed ? ' completed' : ''}" data-id="${ev.id}">
                    <button class="list-event-check${ev.completed ? ' checked' : ''}" data-id="${ev.id}">${ev.completed ? '<i data-lucide="check"></i>' : ''}</button>
                    <div class="list-event-info">
                        <div class="list-event-title${ev.completed ? ' completed' : ''}">${ev.title}</div>
                        <div class="list-event-time">${dateLabel} ${timeLabel}</div>
                    </div>
                    <span style="width:10px;height:10px;border-radius:50%;background:${ev.color || '#4A90D9'};flex-shrink:0"></span>
                </div>`;
        });
        listViewEvents.innerHTML = html;

        // 点击列表项文字区域打开编辑
        listViewEvents.querySelectorAll('.list-event-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.list-event-check')) return;
                const id = parseInt(item.dataset.id);
                const ev = allEvents.find(e => e.id === id);
                if (ev) openEditModal(ev);
            });
        });

        // 完成按钮
        listViewEvents.querySelectorAll('.list-event-check').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleComplete(parseInt(btn.dataset.id));
            });
        });
    }

    // ─── 渲染时间线视图（按项目分组） ───
    function renderTimeline() {
        // 从所有事件中提取有项目的事件
        const projectEvents = allEvents.filter(e => e.project);
        if (projectEvents.length === 0) {
            timelineEvents.innerHTML = `
                <div class="timeline-empty">
                    <div style="font-size:40px;margin-bottom:8px;"><i data-lucide="git-branch" style="width:48px;height:48px;stroke-width:1.5;color:#CBD5E0;"></i></div>
                    <div>暂无项目任务</div>
                    <div style="font-size:12px;color:#CCC;margin-top:4px;">创建任务时填写「项目索引」即可归类</div>
                </div>`;
            document.getElementById('timeline-project-count').textContent = '';
            return;
        }

        // 按项目分组
        const groups = {};
        projectEvents.forEach(ev => {
            const p = ev.project;
            if (!groups[p]) groups[p] = [];
            groups[p].push(ev);
        });

        // 每个项目内按日期排序
        Object.values(groups).forEach(evs => {
            evs.sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.start_time || '').localeCompare(b.start_time || ''));
        });

        // 按项目最新事件日期排序
        const sortedProjects = Object.entries(groups).sort((a, b) => {
            const lastA = a[1][a[1].length - 1].event_date;
            const lastB = b[1][b[1].length - 1].event_date;
            return lastB.localeCompare(lastA);
        });

        const totalEvents = projectEvents.length;
        document.getElementById('timeline-project-count').textContent = `${totalEvents} 项任务 · ${sortedProjects.length} 个项目`;

        let html = '';
        sortedProjects.forEach(([project, evs]) => {
            // 取项目中最常用的颜色作为项目色
            const colorCounts = {};
            evs.forEach(ev => {
                const c = ev.color || '#4A90D9';
                colorCounts[c] = (colorCounts[c] || 0) + 1;
            });
            const projectColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];

            html += `<div class="timeline-project-group">`;
            html += `<div class="timeline-project-head">
                <span class="timeline-project-dot" style="background:${projectColor}"></span>
                ${project}
                <span class="timeline-project-count">${evs.length} 项</span>
            </div>`;

            evs.forEach(ev => {
                const dateLabel = ev.event_date.slice(5);
                const timeLabel = [ev.start_time, ev.end_time].filter(Boolean).join(' - ') || '全天';
                const weekday = ['日','一','二','三','四','五','六'][new Date(ev.event_date + 'T12:00:00').getDay()];
                html += `
                    <div class="timeline-event-item${ev.completed ? ' completed' : ''}" data-id="${ev.id}">
                        <div class="timeline-event-date">${dateLabel} 周${weekday}</div>
                        <div class="timeline-event-info">
                            <div class="timeline-event-title${ev.completed ? ' completed' : ''}">
                                <span style="width:8px;height:8px;border-radius:50%;background:${ev.color || projectColor};flex-shrink:0;display:inline-block"></span>
                                ${ev.title}
                            </div>
                            <div class="timeline-event-time">${timeLabel}</div>
                        </div>
                        <button class="timeline-event-check${ev.completed ? ' checked' : ''}" data-id="${ev.id}">${ev.completed ? '<i data-lucide="check"></i>' : ''}</button>
                    </div>`;
            });

            html += `</div>`;
        });
        timelineEvents.innerHTML = html;

        // 点击打开编辑
        timelineEvents.querySelectorAll('.timeline-event-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.timeline-event-check')) return;
                const id = parseInt(item.dataset.id);
                const ev = allEvents.find(e => e.id === id);
                if (ev) openEditModal(ev);
            });
        });

        // 完成按钮
        timelineEvents.querySelectorAll('.timeline-event-check').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleComplete(parseInt(btn.dataset.id));
            });
        });
    }

    // ─── 统计栏点击切换列表视图 ───
    function toggleListView(mode) {
        if (listViewMode === mode) {
            listViewMode = null; // 相同模式切换回日历
        } else {
            listViewMode = mode;
        }
        render();
    }

    // ─── 事件绑定 ───
    function bindEvents() {
        // 导航
        btnPrev.addEventListener('click', () => {
            if (typeof animations !== 'undefined') animations.clickPulse(btnPrev);
            changeMonth(-1);
        });
        btnNext.addEventListener('click', () => {
            if (typeof animations !== 'undefined') animations.clickPulse(btnNext);
            changeMonth(1);
        });
        btnToday.addEventListener('click', () => {
            if (typeof animations !== 'undefined') animations.clickPulse(btnToday);
            const goingToList = !listViewMode;
            if (typeof animations !== 'undefined') {
                animations.modeTransition(goingToList ? 'list' : 'calendar', () => {
                    listViewMode = goingToList ? 'total' : null;
                    render();
                });
            } else {
                listViewMode = goingToList ? 'total' : null;
                render();
            }
        });
        // 今天按钮（文字版）
        btnTodayText.addEventListener('click', () => {
            if (typeof animations !== 'undefined') animations.clickPulse(btnTodayText);
            const now = new Date();
            const todayStr = dateStr(now);
            currentYear = now.getFullYear();
            currentMonth = now.getMonth() + 1;
            selectedDate = todayStr;
            if (timelineMode) {
                // 时间线模式：高亮今天的项
                render();
                document.querySelectorAll('.timeline-event-item').forEach(el => {
                    el.classList.remove('today-highlight');
                });
                timelineEvents.querySelectorAll('.timeline-event-item').forEach(item => {
                    const id = parseInt(item.dataset.id);
                    const ev = allEvents.find(e => e.id === id);
                    if (ev && ev.event_date === todayStr) {
                        item.classList.add('today-highlight');
                    }
                });
                const first = document.querySelector('.timeline-event-item.today-highlight');
                if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (listViewMode) {
                // 列表模式：重新渲染列表，高亮今天的项
                renderListView();
                if (typeof lucide !== 'undefined') lucide.createIcons();
                // 高亮今天的任务行
                document.querySelectorAll('.list-event-item').forEach(el => {
                    el.classList.remove('today-highlight');
                });
                listViewEvents.querySelectorAll('.list-event-item').forEach(item => {
                    const id = parseInt(item.dataset.id);
                    const ev = allEvents.find(e => e.id === id);
                    if (ev && ev.event_date === todayStr) {
                        item.classList.add('today-highlight');
                    }
                });
                // 滚动到第一个高亮项
                const first = document.querySelector('.list-event-item.today-highlight');
                if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                goToday();
            }
        });

        // 添加按钮
        btnAdd.addEventListener('click', () => {
            if (typeof animations !== 'undefined') animations.clickPulse(btnAdd);
            openCreateModal();
        });

        // ─── 时间线切换 ───
        statsTimeline.addEventListener('click', () => {
            const goingToTimeline = !timelineMode;
            if (typeof animations !== 'undefined') {
                animations.timelineTransition(goingToTimeline ? 'timeline' : 'calendar', () => {
                    timelineMode = goingToTimeline;
                    listViewMode = null;
                    viewMode = 'month';
                    render();
                });
            } else {
                timelineMode = goingToTimeline;
                listViewMode = null;
                viewMode = 'month';
                render();
            }
        });

        // ─── 月份/年份标签点击切换 ───
        monthLabel.addEventListener('click', () => {
            // 列表模式下不切换视图
            if (listViewMode) return;
            if (typeof animations !== 'undefined') {
                animations.clickShrink(monthLabel, () => {
                    // 清除标签上的 GSAP 内联样式，避免标签消失
                    if (typeof gsap !== 'undefined') {
                        gsap.set(monthLabel, { clearProps: 'all' });
                    }
                    if (viewMode === 'year') {
                        viewMode = 'month';
                    } else {
                        viewMode = 'year';
                        detailPanel.classList.add('hidden');
                        selectedDate = null;
                        document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
                    }
                    render();
                    setTimeout(() => {
                        const grid = document.getElementById('calendar-grid');
                        if (typeof animations !== 'undefined') animations.viewEntrance(grid);
                    }, 10);
                }, { scale: 0.5, duration: 0.18 });
            } else {
                if (viewMode === 'year') {
                    viewMode = 'month';
                } else {
                    viewMode = 'year';
                    detailPanel.classList.add('hidden');
                    selectedDate = null;
                    document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
                }
                render();
            }
        });

        // 左右滑动切换月份（需在 click 前声明）
        let touchStartX = 0, touchStartY = 0, isSwiping = false;

        // 日历点击（事件委托，滑动时不触发）
        document.getElementById('calendar-grid').addEventListener('click', e => {
            if (isSwiping) return;
            // 年视图：点击月份卡片跳转到该月
            if (viewMode === 'year') {
                const card = e.target.closest('.year-month-card');
                if (card) {
                    if (typeof animations !== 'undefined') {
                        animations.clickShrink(card, () => {
                            const month = parseInt(card.dataset.month);
                            const year = parseInt(card.dataset.year);
                            currentYear = year;
                            currentMonth = month;
                            viewMode = 'month';
                            render();
                            setTimeout(() => {
                                const grid = document.getElementById('calendar-grid');
                                if (typeof animations !== 'undefined') animations.viewEntrance(grid);
                            }, 10);
                        }, { scale: 0.5, duration: 0.18 });
                    } else {
                        const month = parseInt(card.dataset.month);
                        const year = parseInt(card.dataset.year);
                        currentYear = year;
                        currentMonth = month;
                        viewMode = 'month';
                        render();
                    }
                }
                return;
            }
            // 月视图：点击日期选中并显示详情
            const day = e.target.closest('.cal-day');
            if (day) {
                const date = day.dataset.date;
                selectDate(date);
            }
        });

        // 详情面板
        btnCloseDetail.addEventListener('click', () => {
            if (typeof animations !== 'undefined') {
                animations.hideDetail(detailPanel, () => {
                    selectedDate = null;
                    document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
                });
            } else {
                detailPanel.classList.add('hidden');
                selectedDate = null;
                document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
            }
        });

        // 统计栏点击切换筛选（仅在列表页可用）
        statsTotal.addEventListener('click', () => { if (listViewMode) { listViewMode = 'total'; render(); } });
        statsDone.addEventListener('click', () => { if (listViewMode) { listViewMode = 'done'; render(); } });
        statsPending.addEventListener('click', () => { if (listViewMode) { listViewMode = 'pending'; render(); } });

        // 排序切换
        function setSortBy(mode) {
            if (listSortBy === mode) return;
            listSortBy = mode;
            btnSortTime.classList.toggle('active', mode === 'time');
            btnSortCategory.classList.toggle('active', mode === 'category');
            if (listViewMode) renderListView();
        }
        btnSortTime.addEventListener('click', () => setSortBy('time'));
        btnSortCategory.addEventListener('click', () => setSortBy('category'));

        // 颜色选择器点击
        document.getElementById('color-picker').addEventListener('click', e => {
            const span = e.target.closest('span');
            if (span) {
                const radio = span.previousElementSibling;
                if (radio && radio.type === 'radio') radio.checked = true;
            }
        });

        // 模态框
        btnCloseModal.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        // 表单提交
        eventForm.addEventListener('submit', handleFormSubmit);

        // 删除
        btnDelete.addEventListener('click', handleDelete);

        // 键盘
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        const grid = document.getElementById('calendar-grid');
        grid.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isSwiping = false;
        }, { passive: true });
        grid.addEventListener('touchmove', e => {
            const dx = Math.abs(e.changedTouches[0].screenX - touchStartX);
            const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
            if (dx > 20 || dy > 20) isSwiping = true;
        }, { passive: true });
        grid.addEventListener('touchend', e => {
            if (!isSwiping) return;
            const dx = touchStartX - e.changedTouches[0].screenX;
            const dy = Math.abs(e.changedTouches[0].screenY - touchStartY);
            if (Math.abs(dx) > 50 && dx > dy) {
                changeMonth(dx > 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    // ─── 月份/年份切换 ───
    function changeMonth(delta) {
        if (viewMode === 'year') {
            // 年视图下切换年份
            currentYear += delta;
            render();
        } else {
            currentMonth += delta;
            if (currentMonth > 12) { currentMonth = 1; currentYear++; }
            if (currentMonth < 1) { currentMonth = 12; currentYear--; }
            // 月份切换动画：先滑出旧网格 → render → 滑入新网格
            if (typeof animations !== 'undefined') {
                animations.monthChange(delta, () => {
                    render();
                });
            } else {
                render();
            }
        }
    }

    function goToday() {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth() + 1;
        if (viewMode === 'year') {
            // 年视图下只切年份
            render();
        } else {
            selectedDate = dateStr(now);
            render();
        }
    }

    // ─── 选中日期 ───
    function selectDate(dateStr) {
        selectedDate = dateStr;
        // 清除之前的选中
        document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
        const dayEl = document.querySelector(`.cal-day[data-date="${dateStr}"]`);
        if (dayEl) dayEl.classList.add('selected');
        renderDetail(dateStr);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ─── 渲染详情面板 ───
    function renderDetail(dateStr) {
        const events = allEvents.filter(e => e.event_date === dateStr);
        const d = new Date(dateStr + 'T12:00:00');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const dateHolidaysList = getHolidays(dateStr);
        const lunarFull = getLunarFull(dateStr);

        // 层次化标题
        const y = dateStr.slice(0, 4), md = dateStr.slice(5);
        const weekday = weekdays[d.getDay()];
        let html = `<div class="detail-title-row">
            <span class="detail-title-date">${md} 周${weekday}</span>
            <span class="detail-title-count">${events.length} 项</span>
        </div>`;
        html += `<div class="detail-title-meta">${y} · 农历${lunarFull || '—'}`;
        if (dateHolidaysList.length) {
            dateHolidaysList.forEach(h => {
                const flagMap = { cn: '🇨🇳', hk: '🇭🇰', mo: '🇲🇴' };
                html += ` <span class="tag-${h.region}">${flagMap[h.region] || '🇭🇰'} ${h.name}</span>`;
            });
        }
        html += `</div>`;
        detailDateTitle.innerHTML = html;

        detailEvents.innerHTML = '';

        if (events.length === 0) {
            detailEvents.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><i data-lucide="inbox" style="width:48px;height:48px;stroke-width:1.5;color:#CBD5E0;"></i></div>
                    <div>这天没有任务</div>
                    <button class="btn btn-primary" style="margin-top:12px" onclick="appOpenCreateForDate('${dateStr}')"><i data-lucide="plus"></i> 添加任务</button>
                </div>
            `;
        } else {
            // 按时间排序
            const sorted = [...events].sort((a, b) => {
                return (a.start_time || '').localeCompare(b.start_time || '');
            });

            sorted.forEach(ev => {
                const item = document.createElement('div');
                item.className = 'detail-event-item' + (ev.completed ? ' completed' : '');

                const dot = document.createElement('div');
                dot.className = 'detail-color-dot';
                dot.style.background = ev.color || '#4A90D9';

                const info = document.createElement('div');
                info.className = 'detail-event-info';

                const title = document.createElement('div');
                title.className = 'detail-event-title' + (ev.completed ? ' completed' : '');
                title.textContent = ev.title;

                const time = document.createElement('div');
                time.className = 'detail-event-time';
                const timeRange = [];
                if (ev.start_time) timeRange.push(ev.start_time.slice(0, 5));
                if (ev.end_time) timeRange.push(ev.end_time.slice(0, 5));
                time.textContent = timeRange.length ? timeRange.join(' - ') : '全天';
                if (ev.completed && ev.completed_at) {
                    time.textContent += ` · 完成于 ${ev.completed_at.slice(0, 16)}`;
                }

                info.appendChild(title);
                info.appendChild(time);

                // 项目标签
                if (ev.project) {
                    const proj = document.createElement('div');
                    proj.className = 'detail-event-project';
                    proj.innerHTML = `<i data-lucide="git-branch"></i> ${ev.project}`;
                    info.appendChild(proj);
                }

                if (ev.description) {
                    const desc = document.createElement('div');
                    desc.className = 'detail-event-desc';
                    desc.textContent = ev.description;
                    info.appendChild(desc);
                }

                const actions = document.createElement('div');
                actions.className = 'detail-event-actions';

                // ✅ 完成按钮
                const checkBtn = document.createElement('button');
                checkBtn.className = 'btn-check' + (ev.completed ? ' checked' : '');
                checkBtn.dataset.eventId = ev.id;
                if (ev.completed) checkBtn.innerHTML = '<i data-lucide="check"></i>';
                checkBtn.title = ev.completed ? '标记未完成' : '标记完成 ✅';
                checkBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    toggleComplete(ev.id);
                });

                // 点击任务名称区域打开编辑
                info.style.cursor = 'pointer';
                info.addEventListener('click', e => {
                    e.stopPropagation();
                    openEditModal(ev);
                });

                actions.appendChild(checkBtn);

                item.appendChild(dot);
                item.appendChild(info);
                item.appendChild(actions);
                detailEvents.appendChild(item);
            });

            // ── 底部添加按钮 ──
            const addFooter = document.createElement('div');
            addFooter.style.cssText = 'padding: 12px 16px; border-top: 1px solid var(--border); text-align: center;';
            const addBtn = document.createElement('button');
            addBtn.className = 'btn btn-primary';
            addBtn.innerHTML = '<i data-lucide="plus"></i> 添加任务';
            addBtn.style.width = '100%';
            addBtn.addEventListener('click', () => appOpenCreateForDate(dateStr));
            addFooter.appendChild(addBtn);
            detailEvents.appendChild(addFooter);
        }

        // GSAP 入场动画
        if (typeof animations !== 'undefined') {
            animations.showDetail(detailPanel);
        } else {
            detailPanel.classList.remove('hidden');
        }
    }

    // ─── ✅ 切换完成状态 ───
    async function toggleComplete(id) {
        try {
            const updated = await api.toggleComplete(id);
            // 更新本地数据
            const idx = allEvents.findIndex(e => e.id === id);
            if (idx !== -1) allEvents[idx] = updated;
            render();
            // 完成按钮动画
            if (typeof animations !== 'undefined') {
                const btn = document.querySelector(`.btn-check[data-event-id="${id}"]`);
                if (btn && updated.completed) animations.completeToggle(btn);
            }
            showToast(updated.completed ? '<i data-lucide="check-circle"></i> 标记为已完成！' : '<i data-lucide="rotate-ccw"></i> 已取消完成');
        } catch (e) {
            showToast('<i data-lucide="alert-triangle"></i> 操作失败');
        }
    }

    // ─── 模态框：创建 ───
    function openCreateModal(forDate) {
        editingEvent = null;
        modalTitle.innerHTML = '<i data-lucide="edit-3"></i> 新建任务';
        eventForm.reset();
        eventId.value = '';
        btnDelete.classList.add('hidden');

        // 默认日期
        if (forDate) {
            eventDate.value = forDate;
        } else if (selectedDate) {
            eventDate.value = selectedDate;
        } else {
            eventDate.value = dateStr(new Date());
        }
        // 同步日期显示
        if (eventDate.value) {
            const [y, m, d] = eventDate.value.split('-');
            eventDateDisplay.value = `${y}年${m}月${d}日`;
        }

        // 清空项目字段
        eventProject.value = '';

        // 默认时间：当前时间取整到 :00/:30，结束时间为半小时后
        const now = new Date();
        eventStart.value = roundToHalfHour(now);
        eventEnd.value = roundToHalfHour(new Date(now.getTime() + 30 * 60 * 1000));
        eventStartDisplay.value = eventStart.value;
        eventEndDisplay.value = eventEnd.value;

        openModal();
        setTimeout(() => eventTitle.focus(), 300);
    }

    // ─── 模态框：编辑 ───
    function openEditModal(ev) {
        editingEvent = ev;
        modalTitle.innerHTML = '<i data-lucide="edit"></i> 编辑任务';
        eventId.value = ev.id;
        eventTitle.value = ev.title;
        eventDate.value = ev.event_date;
        if (ev.event_date) {
            const [y, m, d] = ev.event_date.split('-');
            eventDateDisplay.value = `${y}年${m}月${d}日`;
        }
        if (ev.start_time) {
            eventStart.value = ev.start_time;
        } else {
            const now = new Date();
            eventStart.value = roundToHalfHour(now);
        }
        eventStartDisplay.value = eventStart.value;
        if (ev.end_time) {
            eventEnd.value = ev.end_time;
        } else {
            const now = new Date();
            eventEnd.value = roundToHalfHour(new Date(now.getTime() + 30 * 60 * 1000));
        }
        eventEndDisplay.value = eventEnd.value;
        eventDesc.value = ev.description || '';
        eventProject.value = ev.project || '';

        // 颜色
        const colorRadios = document.querySelectorAll('input[name="color"]');
        colorRadios.forEach(r => {
            r.checked = r.value === (ev.color || '#4A90D9');
        });

        btnDelete.classList.remove('hidden');
        openModal();
        setTimeout(() => eventTitle.focus(), 300);
    }

    function openModal() {
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // 遮罩淡入
            gsap.set(overlay, { autoAlpha: 0 });
            gsap.to(overlay, { autoAlpha: 1, duration: 0.2, ease: 'power2.out' });

            // 模态框弹性弹出
            gsap.set(modalInner, {
                scale: 0.7,
                autoAlpha: 0,
                y: 20,
            });
            gsap.to(modalInner, {
                scale: 1,
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                ease: 'back.out(1.7)',
            });
        }
    }

    function closeModal() {
        document.body.style.overflow = '';

        if (typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.timeline()
                .to(modalInner, {
                    scale: 0.8,
                    autoAlpha: 0,
                    y: 10,
                    duration: 0.15,
                    ease: 'power2.in',
                }, 0)
                .to(overlay, {
                    autoAlpha: 0,
                    duration: 0.12,
                    ease: 'power2.in',
                }, 0)
                .call(() => {
                    modal.classList.add('hidden');
                    overlay.classList.add('hidden');
                    gsap.set([modalInner, overlay], { clearProps: 'all' });
                });
        } else {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
        }
    }

    // ─── 表单提交 ───
    async function handleFormSubmit(e) {
        e.preventDefault();

        const data = {
            title: eventTitle.value.trim(),
            event_date: eventDate.value,
            start_time: eventStart.value,
            end_time: eventEnd.value,
            description: eventDesc.value.trim(),
            color: document.querySelector('input[name="color"]:checked')?.value || '#4A90D9',
            project: eventProject.value.trim(),
        };

        if (!data.title) {
            showToast('<i data-lucide="alert-triangle"></i> 请输入任务名称');
            return;
        }

        try {
            if (editingEvent) {
                // 更新
                const updated = await api.updateEvent(editingEvent.id, data);
                const idx = allEvents.findIndex(e => e.id === editingEvent.id);
                if (idx !== -1) allEvents[idx] = updated;
                showToast('<i data-lucide="check-circle"></i> 已更新');
            } else {
                // 创建
                const created = await api.createEvent(data);
                allEvents.push(created);
                showToast('<i data-lucide="check-circle"></i> 任务已添加');
            }
            closeModal();
            render();
        } catch (e) {
            showToast('<i data-lucide="alert-triangle"></i> 保存失败');
        }
    }

    // ─── 删除 ───
    async function handleDelete() {
        if (!editingEvent) return;
        if (!confirm(`确定删除「${editingEvent.title}」？`)) return;

        try {
            await api.deleteEvent(editingEvent.id);
            allEvents = allEvents.filter(e => e.id !== editingEvent.id);
            showToast('<i data-lucide="trash-2"></i> 已删除');
            closeModal();
            render();
        } catch (e) {
            showToast('<i data-lucide="alert-triangle"></i> 删除失败');
        }
    }

    // ─── Toast ───
    let toastTimer = null;

    function showToast(msg) {
        if (typeof animations !== 'undefined') {
            animations.showToast(toast, msg);
            clearTimeout(toastTimer);
            toastTimer = null;
        } else {
            toast.innerHTML = msg;
            toast.classList.remove('hidden');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.classList.add('hidden');
            }, 2000);
        }
    }

    // ─── 暴露给全局（给内联 onclick 用） ───
    window.appOpenCreateForDate = function (dateStr) {
        openCreateModal(dateStr);
    };



    // ─── 时间格式化辅助 ───
    /** Date → HH:MM */
    function timeStr(d) {
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    /** 取最近的 :00 或 :30 */
    function roundToHalfHour(d) {
        const h = d.getHours();
        const m = d.getMinutes();
        if (m < 15) return `${String(h).padStart(2, '0')}:00`;
        if (m < 45) return `${String(h).padStart(2, '0')}:30`;
        return `${String(h + 1).padStart(2, '0')}:00`;
    }

    // ─── 启动 ───
    document.addEventListener('DOMContentLoaded', init);

})();
