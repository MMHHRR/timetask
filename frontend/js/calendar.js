/**
 * TimeTask 日历渲染引擎
 * 纯函数式：给定年月和事件列表，渲染日历网格
 */

const Calendar = {
    /**
     * 渲染月视图
     * @param {number} year
     * @param {number} month  (1-12)
     * @param {Array} events
     * @param {string|null} selectedDate  YYYY-MM-DD
     */
    render(year, month, events, selectedDate = null) {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        grid.className = ''; // 清除年视图样式

        const today = new Date();
        const todayStr = dateStr(today);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startPad = firstDay.getDay(); // 0=Sun

        // 上月补充
        const prevMonthLast = new Date(year, month - 1, 0);
        const prevDays = startPad;

        // 总格子数：补齐到完整周
        const totalDays = prevDays + lastDay.getDate();
        const endPad = (7 - (totalDays % 7)) % 7;
        const totalCells = totalDays + endPad;

        // 建立日期→事件的映射
        const eventMap = {};
        events.forEach(ev => {
            const d = ev.event_date;
            if (!eventMap[d]) eventMap[d] = [];
            eventMap[d].push(ev);
        });

        // 获取当前显示的节假日（互斥：香港 / 澳门）
        const showRegionHK = document.getElementById('toggle-hk')?.classList.contains('active') !== false;
        const showRegionMO = document.getElementById('toggle-mo')?.classList.contains('active') !== false;
        const monthHolidays = getMonthHolidays(year, month);

        const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

        for (let i = 0; i < totalCells; i++) {
            let cellDate, isOtherMonth = false;

            if (i < prevDays) {
                // 上个月
                const d = prevMonthLast.getDate() - prevDays + 1 + i;
                cellDate = new Date(year, month - 2, d);
                isOtherMonth = true;
            } else if (i < prevDays + lastDay.getDate()) {
                const d = i - prevDays + 1;
                cellDate = new Date(year, month - 1, d);
            } else {
                const d = i - prevDays - lastDay.getDate() + 1;
                cellDate = new Date(year, month, d);
                isOtherMonth = true;
            }

            const cellDateStr = dateStr(cellDate);
            let dayEvents = eventMap[cellDateStr] || [];
            // 按时间排序（无时间的排最后）
            dayEvents = [...dayEvents].sort((a, b) => {
                const ta = a.start_time || '99:99';
                const tb = b.start_time || '99:99';
                return ta.localeCompare(tb);
            });
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedDate;

            const cell = document.createElement('div');
            cell.className = 'cal-day';
            if (isOtherMonth) cell.classList.add('other-month');
            if (isToday) cell.classList.add('today');
            if (isSelected) cell.classList.add('selected');
            cell.dataset.date = cellDateStr;

            // 节假日标记
            const cellHolidays = monthHolidays[cellDateStr] || [];

            // 日期号 + 阴历日
            const dayTop = document.createElement('div');
            dayTop.className = 'day-top';

            const numDiv = document.createElement('div');
            numDiv.className = 'day-number';
            numDiv.textContent = cellDate.getDate();
            dayTop.appendChild(numDiv);

            // 阴历日（灰色小字，每天自动计算）
            const lunarDay = getLunarDay(cellDateStr);
            if (lunarDay) {
                const lunarEl = document.createElement('span');
                lunarEl.className = 'day-lunar';
                lunarEl.textContent = lunarDay;
                dayTop.appendChild(lunarEl);
            }

            cell.appendChild(dayTop);

            // 节假日文字（灰色显示在日期下面）
            if (cellHolidays.length > 0) {
                const holidayBar = document.createElement('div');
                holidayBar.className = 'day-holiday-bar';
                cellHolidays.forEach(h => {
                    // CN 节日始终显示；HK 和 MO 互斥显示
                    if (h.region === 'cn') { /* always show */ }
                    else if (h.region === 'hk' && !showRegionHK) return;
                    else if (h.region === 'mo' && !showRegionMO) return;
                    const tag = document.createElement('span');
                    tag.className = 'holiday-text';
                    tag.textContent = h.name;
                    holidayBar.appendChild(tag);
                });
                if (holidayBar.children.length > 0) {
                    cell.appendChild(holidayBar);
                }
            }

            // 事件列表
            const eventsDiv = document.createElement('div');
            eventsDiv.className = 'day-events';

            // 有节假日时只显示 2 个，且整体下移
            const hasHoliday = cellHolidays.some(h =>
                h.region === 'cn' || (h.region === 'hk' && showRegionHK) || (h.region === 'mo' && showRegionMO)
            );
            if (hasHoliday) eventsDiv.style.paddingTop = '12px';
            const maxShow = hasHoliday ? 2 : 3;
            const showEvents = dayEvents.slice(0, maxShow);
            const moreCount = dayEvents.length - maxShow;

            showEvents.forEach(ev => {
                const dot = document.createElement('div');
                dot.className = 'day-event';
                if (ev.completed) dot.classList.add('completed');
                dot.style.background = ev.color || '#4A90D9';
                dot.title = ev.title + (ev.completed ? ' ✅ 已完成' : ' ⏳ 待完成') + (ev.project ? ` [${ev.project}]` : '');
                dot.dataset.eventId = ev.id;

                // 标题文字（溢出省略）
                const timeStr = ev.start_time ? ev.start_time.slice(0, 5) + ' ' : '';
                const titleSpan = document.createElement('span');
                titleSpan.className = 'day-event-title';
                titleSpan.textContent = timeStr + ev.title;
                dot.appendChild(titleSpan);

                // 项目标签（在右侧，只显示第一个字）
                if (ev.project) {
                    const projTag = document.createElement('span');
                    projTag.className = 'event-project-tag';
                    projTag.textContent = ev.project.charAt(0);
                    dot.appendChild(projTag);
                }

                eventsDiv.appendChild(dot);
            });

            if (moreCount > 0) {
                const more = document.createElement('div');
                more.className = 'day-event-more';
                more.textContent = `+${moreCount} 更多`;
                eventsDiv.appendChild(more);
            }

            cell.appendChild(eventsDiv);
            grid.appendChild(cell);
        }
    },

    /**
     * 渲染年视图 — 4×3 网格显示全年 12 个月
     * @param {number} year
     * @param {Array} events
     */
    renderYear(year, events) {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        grid.className = 'year-view-grid';

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        // 统计各月事件数
        const monthCounts = {};
        const monthDoneCounts = {};
        events.forEach(ev => {
            const parts = ev.event_date.split('-');
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            if (y === year) {
                monthCounts[m] = (monthCounts[m] || 0) + 1;
                if (ev.completed) {
                    monthDoneCounts[m] = (monthDoneCounts[m] || 0) + 1;
                }
            }
        });

        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                           '7月', '8月', '9月', '10月', '11月', '12月'];

        for (let m = 1; m <= 12; m++) {
            const card = document.createElement('div');
            card.className = 'year-month-card';
            if (year === currentYear && m === currentMonth) {
                card.classList.add('current');
            }
            card.dataset.month = m;
            card.dataset.year = year;

            // 月份名
            const nameEl = document.createElement('div');
            nameEl.className = 'year-month-name';
            nameEl.textContent = monthNames[m - 1];

            // 事件统计
            const count = monthCounts[m] || 0;
            const done = monthDoneCounts[m] || 0;
            const statEl = document.createElement('div');
            statEl.className = 'year-month-stat';
            if (count > 0) {
                statEl.innerHTML = `<span class="stat-done">${done}✓</span> / ${count} 项`;
            } else {
                statEl.textContent = '暂无任务';
                statEl.classList.add('empty');
            }

            // 当月首日信息（显示星期）
            const firstDay = new Date(year, m - 1, 1);
            const lastDay = new Date(year, m, 0);
            const daysInMonth = lastDay.getDate();
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

            // 迷你日历：7 格 × 行数
            const miniGrid = document.createElement('div');
            miniGrid.className = 'year-month-mini';

            // 星期头
            weekdays.forEach(wd => {
                const wh = document.createElement('span');
                wh.className = 'mini-wd';
                wh.textContent = wd;
                miniGrid.appendChild(wh);
            });

            // 月首前空白
            const startPad = firstDay.getDay();
            for (let p = 0; p < startPad; p++) {
                const blank = document.createElement('span');
                blank.className = 'mini-day blank';
                miniGrid.appendChild(blank);
            }

            // 日期格子
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dayEl = document.createElement('span');
                dayEl.className = 'mini-day';
                if (year === currentYear && m === currentMonth && d === today.getDate()) {
                    dayEl.classList.add('today');
                }
                // 有事件的日子
                if (monthCounts[m] && events.some(e => e.event_date === dateStr)) {
                    dayEl.classList.add('has-event');
                }
                dayEl.textContent = d;
                miniGrid.appendChild(dayEl);
            }

            card.appendChild(nameEl);
            card.appendChild(statEl);
            card.appendChild(miniGrid);
            grid.appendChild(card);
        }
    },
};

/** 日期转 YYYY-MM-DD */
function dateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
