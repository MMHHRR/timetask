/**
 * TimeTask API 层
 * 封装所有与后端的通信
 */

const API_BASE = window.location.origin;

const api = {
    /**
     * 获取某月的事件
     */
    async getEvents(year, month) {
        const params = new URLSearchParams({ year, month });
        const res = await fetch(`${API_BASE}/api/events?${params}`);
        if (!res.ok) throw new Error('获取事件失败');
        return res.json();
    },

    /**
     * 获取所有事件
     */
    async getAllEvents() {
        const res = await fetch(`${API_BASE}/api/events`);
        if (!res.ok) throw new Error('获取事件失败');
        return res.json();
    },

    /**
     * 创建事件
     */
    async createEvent(data) {
        const res = await fetch(`${API_BASE}/api/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('创建事件失败');
        return res.json();
    },

    /**
     * 更新事件
     */
    async updateEvent(id, data) {
        const res = await fetch(`${API_BASE}/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('更新事件失败');
        return res.json();
    },

    /**
     * ✅ 切换完成状态
     */
    async toggleComplete(id) {
        const res = await fetch(`${API_BASE}/api/events/${id}/toggle`, {
            method: 'PATCH',
        });
        if (!res.ok) throw new Error('切换状态失败');
        return res.json();
    },

    /**
     * 获取所有项目列表
     */
    async getProjects() {
        const res = await fetch(`${API_BASE}/api/projects`);
        if (!res.ok) throw new Error('获取项目列表失败');
        return res.json();
    },

    /**
     * 删除事件
     */
    async deleteEvent(id) {
        const res = await fetch(`${API_BASE}/api/events/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('删除事件失败');
        return res.json();
    },
};
