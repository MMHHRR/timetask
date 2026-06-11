/**
 * TimeTask — GSAP 动画模块
 * 为所有 UI 元素提供流畅的 GSAP 动画
 * 依赖：GSAP (CDN) — https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js
 *
 * 所有动画均遵循 prefers-reduced-motion 无障碍规范
 */

// 检查用户是否偏好减少动画
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animations = {

    /**
     * 页面载入入场动画 — 图标按钮交错飞入
     */
    pageEntrance() {
        if (typeof gsap === 'undefined' || prefersReduced()) return;

        const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out' } });

        // 顶部按钮交错入场（弹性弹出）
        tl.from('.icon-btn', {
            y: -20,
            autoAlpha: 0,
            scale: 0.6,
            stagger: 0.08,
            ease: 'back.out(1.4)',
        }, 0)
        // 月份标题淡入
        .from('#month-label', {
            autoAlpha: 0,
            y: -10,
            duration: 0.3,
        }, 0.15)
        // 统计栏交错淡入
        .from('#stats-bar > span', {
            autoAlpha: 0,
            y: 12,
            stagger: 0.06,
            ease: 'power1.out',
        }, 0.2)
        // 节假日图例淡入
        .from('#holiday-legend', {
            autoAlpha: 0,
            y: 8,
            duration: 0.25,
        }, 0.3)
        // 日历网格逐行淡入
        .from('.cal-day', {
            autoAlpha: 0,
            y: 10,
            stagger: {
                each: 0.02,
                from: 'start',
                grid: 'auto',
            },
            duration: 0.2,
            ease: 'power1.out',
        }, 0.35);
    },

    /**
     * 月份切换动画 — 先滑出旧网格，再渲染新网格并滑入
     * @param {number} direction - 正数=下月，负数=上月
     * @param {Function} onAfterOut - 旧网格滑出后的回调（执行 render）
     */
    monthChange(direction, onAfterOut) {
        if (typeof gsap === 'undefined' || prefersReduced()) {
            if (onAfterOut) onAfterOut();
            return;
        }

        const grid = document.getElementById('calendar-grid');
        if (!grid) {
            if (onAfterOut) onAfterOut();
            return;
        }

        const d = direction > 0 ? 1 : -1;

        // 先滑出旧网格
        gsap.to(grid, {
            x: d * -40,
            autoAlpha: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                // 执行渲染（生成新网格）
                if (onAfterOut) onAfterOut();
                // 新网格从另一侧滑入
                gsap.set(grid, { x: d * 40, autoAlpha: 0 });
                gsap.to(grid, {
                    x: 0,
                    autoAlpha: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            },
        });
    },

    /**
     * 按钮点击反馈 — 弹性脉冲
     * @param {Element} el
     */
    clickPulse(el) {
        if (typeof gsap === 'undefined' || prefersReduced() || !el) return;

        gsap.fromTo(el, { scale: 1 }, {
            scale: 0.85,
            duration: 0.12,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(el, {
                    scale: 1,
                    duration: 0.4,
                    ease: 'elastic.out(1, 0.6)',
                    overwrite: 'auto',
                });
            },
        });
    },

    /**
     * 点击向内缩小消失效果 — 用于视图切换
     * @param {Element} el - 被点击的元素
     * @param {Function} onComplete - 动画完成后的回调
     * @param {Object} [options] - 可选参数
     * @param {number} [options.scale=0.6] - 缩小目标比例
     * @param {number} [options.duration=0.2] - 动画时长（秒）
     */
    clickShrink(el, onComplete, options = {}) {
        if (typeof gsap === 'undefined' || prefersReduced() || !el) {
            if (onComplete) onComplete();
            return;
        }

        const { scale = 0.6, duration = 0.2 } = options;

        gsap.to(el, {
            scale: scale,
            autoAlpha: 0,
            duration: duration,
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete,
        });
    },

    /**
     * 视图切换后的放大入场效果
     * @param {Element} el - 容器元素
     */
    viewEntrance(el) {
        if (typeof gsap === 'undefined' || prefersReduced() || !el) return;

        gsap.set(el, { scale: 0.8, autoAlpha: 0 });
        gsap.to(el, {
            scale: 1,
            autoAlpha: 1,
            duration: 0.25,
            ease: 'power2.out',
        });
    },

    /**
     * 设置所有 icon 按钮的 GSAP hover 效果
     */
    setupHoverEffects() {
        if (typeof gsap === 'undefined' || prefersReduced()) return;

        // 顶部图标按钮
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.12,
                    duration: 0.2,
                    ease: 'back.out(2)',
                    overwrite: 'auto',
                });
            }, { passive: true });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            }, { passive: true });
        });

        // 节假日切换按钮
        document.querySelectorAll('.holiday-toggle').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.08,
                    duration: 0.2,
                    ease: 'back.out(1.5)',
                    overwrite: 'auto',
                });
            }, { passive: true });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            }, { passive: true });
        });
    },

    /**
     * 详情面板入场 — 滑入 + 淡入
     * @param {Element} panel - #detail-panel
     */
    showDetail(panel) {
        if (typeof gsap === 'undefined' || !panel) return;

        panel.classList.remove('hidden');

        if (prefersReduced()) return;

        // 从下方滑入
        gsap.set(panel, { y: 24, autoAlpha: 0 });
        gsap.to(panel, {
            y: 0,
            autoAlpha: 1,
            duration: 0.35,
            ease: 'power2.out',
        });

        // 事件项依次滑入
        const items = panel.querySelectorAll('.detail-event-item');
        if (items.length) {
            gsap.fromTo(items, {
                autoAlpha: 0,
                x: -15,
            }, {
                autoAlpha: 1,
                x: 0,
                stagger: 0.05,
                duration: 0.25,
                ease: 'power1.out',
                delay: 0.1,
            });
        }

        // 空状态图标弹入
        const emptyIcon = panel.querySelector('.empty-state .icon');
        if (emptyIcon) {
            gsap.fromTo(emptyIcon, {
                scale: 0,
                rotation: -20,
            }, {
                scale: 1,
                rotation: 0,
                duration: 0.4,
                ease: 'back.out(2)',
                delay: 0.15,
            });
        }
    },

    /**
     * 隐藏详情面板动画
     * @param {Element} panel
     * @param {Function} callback
     */
    hideDetail(panel, callback) {
        if (typeof gsap === 'undefined' || !panel) {
            if (callback) callback();
            return;
        }

        if (prefersReduced()) {
            panel.classList.add('hidden');
            if (callback) callback();
            return;
        }

        gsap.to(panel, {
            y: 20,
            autoAlpha: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                panel.classList.add('hidden');
                gsap.set(panel, { clearProps: 'all' });
                if (callback) callback();
            },
        });
    },

    /**
     * Toast 通知 — 从顶部滑入/滑出
     * @param {HTMLElement} el - toast 元素
     * @param {string} msg - 消息文本
     * @param {number} duration - 显示时长 (ms)
     */
    showToast(el, msg, duration = 2000) {
        if (typeof gsap === 'undefined' || !el) return;

        el.innerHTML = msg;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        gsap.killTweensOf(el);

        if (prefersReduced()) {
            el.classList.remove('hidden');
            el.style.opacity = '1';
            setTimeout(() => {
                el.classList.add('hidden');
                el.style.opacity = '';
            }, duration);
            return;
        }

        // 重置位置并显示
        gsap.set(el, { y: -30, autoAlpha: 0 });
        el.classList.remove('hidden');

        gsap.timeline()
            .to(el, {
                y: 0,
                autoAlpha: 1,
                duration: 0.3,
                ease: 'back.out(1.7)',
            })
            .to(el, {
                y: 0,
                duration: duration / 1000,
            })
            .to(el, {
                y: -20,
                autoAlpha: 0,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    el.classList.add('hidden');
                    gsap.set(el, { clearProps: 'all' });
                },
            });
    },

    /**
     * ✅ 完成标记动画 — 旋转 + 弹性
     * @param {Element} btn - 完成按钮
     */
    completeToggle(btn) {
        if (typeof gsap === 'undefined' || prefersReduced() || !btn) return;

        gsap.timeline()
            .to(btn, {
                scale: 1.3,
                duration: 0.1,
                ease: 'power2.in',
            })
            .to(btn, {
                scale: 1,
                rotation: 360,
                duration: 0.35,
                ease: 'elastic.out(1, 0.4)',
                clearProps: 'rotation',
            });
    },

    /**
     * 统计数字更新 — 轻微放大脉冲
     * @param {Element} el
     */
    statsUpdate(el) {
        if (typeof gsap === 'undefined' || prefersReduced() || !el) return;

        gsap.fromTo(el, { scale: 1 }, {
            scale: 1.15,
            duration: 0.12,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
        });
    },

    /**
     * 今天日期脉冲（呼吸光效）
     * @param {Element} dayNumber - 今天格子的日期数字
     */
    todayPulse(dayNumber) {
        if (typeof gsap === 'undefined' || prefersReduced() || !dayNumber) return;

        gsap.to(dayNumber, {
            scale: 1.08,
            duration: 0.8,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
        });
    },

    /**
     * 日历↔列表视图切换动画
     * @param {'list'|'calendar'} toMode - 目标模式
     * @param {Function} onReady - 旧视图动画完成后回调（应执行 render）
     */
    modeTransition(toMode, onReady) {
        if (typeof gsap === 'undefined' || prefersReduced()) {
            if (onReady) onReady();
            return;
        }

        if (toMode === 'list') {
            // ── 日历 → 列表：日历元素向左滑出 ──
            const calEls = [
                document.getElementById('calendar-grid'),
                document.getElementById('weekday-header'),
                document.getElementById('holiday-legend'),
            ].filter(Boolean);

            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(calEls, { clearProps: 'all' });
                    if (onReady) onReady();
                    // 列表项入场
                    requestAnimationFrame(() => {
                        const items = document.querySelectorAll('.list-event-item');
                        if (items.length) {
                            gsap.fromTo(items, { autoAlpha: 0, x: 20 }, {
                                autoAlpha: 1, x: 0, stagger: 0.03,
                                duration: 0.25, ease: 'power1.out',
                            });
                        }
                        const title = document.getElementById('list-view-title');
                        if (title) gsap.fromTo(title, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: 0.2 });
                    });
                },
            });
            tl.to(calEls, { autoAlpha: 0, x: -25, duration: 0.15, ease: 'power2.in' }, 0);

        } else {
            // ── 列表 → 日历：列表向右滑出 ──
            const listView = document.getElementById('list-view');

            gsap.to(listView, {
                autoAlpha: 0, x: 30, duration: 0.35, ease: 'power2.in',
                onComplete: () => {
                    gsap.set(listView, { clearProps: 'all' });
                    if (onReady) onReady();
                    // 日历网格整体入场
                    requestAnimationFrame(() => {
                        const grid = document.getElementById('calendar-grid');
                        if (grid) {
                            gsap.fromTo(grid, { autoAlpha: 0, y: 30 }, {
                                autoAlpha: 1, y: 0,
                                duration: 0.6, ease: 'power2.out',
                                onComplete: () => {
                                    gsap.set(grid, { clearProps: 'opacity' });
                                    // 恢复 other-month 的 CSS opacity
                                    document.querySelectorAll('.cal-day.other-month').forEach(el => {
                                        gsap.set(el, { clearProps: 'opacity' });
                                    });
                                },
                            });
                        }
                    });
                },
            });
        }
    },

    /**
     * 时间线切换动画 — 滑入淡出
     * @param {string} toMode - 'timeline' 或 'calendar'
     * @param {Function} onReady - 动画完成后执行切换
     */
    timelineTransition(toMode, onReady) {
        if (typeof gsap === 'undefined' || prefersReduced()) {
            if (onReady) onReady();
            return;
        }

        const grid = document.getElementById('calendar-grid');
        const heatmap = document.getElementById('heatmap');
        const wdHeader = document.getElementById('weekday-header');
        const hLegend = document.getElementById('holiday-legend');
        const timelineView = document.getElementById('timeline-view');

        if (toMode === 'timeline') {
            // 日历元素向左滑出
            const calEls = [grid, heatmap, wdHeader, hLegend].filter(Boolean);
            gsap.to(calEls, {
                autoAlpha: 0, x: -20, duration: 0.15, ease: 'power2.in',
                onComplete: () => {
                    gsap.set(calEls, { clearProps: 'transform,opacity,visibility' });
                    if (onReady) onReady();
                    // 时间线入场
                    requestAnimationFrame(() => {
                        if (timelineView) {
                            gsap.fromTo(timelineView, { autoAlpha: 0, y: 20 }, {
                                autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out',
                            });
                        }
                        const items = document.querySelectorAll('.timeline-event-item');
                        if (items.length) {
                            gsap.fromTo(items, { autoAlpha: 0, x: 20 }, {
                                autoAlpha: 1, x: 0, stagger: 0.04,
                                duration: 0.25, ease: 'power1.out',
                            });
                        }
                    });
                },
            });
        } else {
            // 时间线向右滑出
            gsap.to(timelineView, {
                autoAlpha: 0, x: 30, duration: 0.2, ease: 'power2.in',
                onComplete: () => {
                    gsap.set(timelineView, { clearProps: 'all' });
                    if (onReady) onReady();
                    // 日历入场
                    requestAnimationFrame(() => {
                        const els = [grid, heatmap, wdHeader, hLegend].filter(Boolean);
                        gsap.fromTo(els, { autoAlpha: 0, x: 20 }, {
                            autoAlpha: 1, x: 0, duration: 0.25, ease: 'power2.out',
                            onComplete: () => gsap.set(els, { clearProps: 'transform,opacity,visibility' }),
                        });
                    });
                },
            });
        }
    },
};
