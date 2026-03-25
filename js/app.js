// js/app.js - 生产管理中心核心逻辑控制
const App = {
    currentUser: null,
    // 【白名单】定义已开发模块
    developedModules: ['plan_dailyReport', 'personnel_list', 'stats_overview'],

    init: function() {
        // --- 1. 账号自动初始化/重置逻辑 ---
        const defaultAdmin = [{ id: 'admin', password: '123456', name: '管理员' }];
        
        // 强制重置：确保系统只有这一个初始化账号
        localStorage.setItem('userAccounts', JSON.stringify(defaultAdmin));
        // 清除可能残留的旧账号数据
        localStorage.removeItem('personnelData'); 

        const userStr = localStorage.getItem('currentUserData');
        const pathname = window.location.pathname;
        const isLoginPage = pathname.includes('index.html') || pathname.endsWith('/') || pathname.endsWith('\\');

        // 2. 登录拦截逻辑
        if (!userStr && !isLoginPage) { 
            window.location.href = 'index.html'; 
            return; 
        }
        
        if (userStr && isLoginPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        if (isLoginPage) return;

        // 3. 控制台（Dashboard）初始化逻辑
        try {
            this.currentUser = JSON.parse(userStr);
            // 权限控制：显示管理员菜单
            if (this.currentUser && this.currentUser.id === 'admin') {
                const group = document.getElementById('menuPersonnelGroup');
                if(group) group.style.display = 'block';
            }
            
            // 默认展开“核心指标”并进入概览
            const firstGroup = document.querySelector('.menu-group');
            if(firstGroup) firstGroup.classList.add('open');
            
            this.switchModule('stats', 'overview');
        } catch(e) {
            console.error("Session解析失败", e);
            localStorage.removeItem('currentUserData');
            window.location.href = 'index.html';
        }
    },

    // 登录验证逻辑
    login: function() {
        // 获取输入框的值
        const userInp = document.getElementById('username').value.trim();
        const passInp = document.getElementById('password').value.trim();

        if (!userInp || !passInp) {
            alert("请输入工号和密码");
            return;
        }

        // 验证：匹配 admin / 123456
        if (userInp === 'admin' && passInp === '123456') {
            const userData = { id: 'admin', name: '管理员' };
            // 保存登录状态
            localStorage.setItem('currentUserData', JSON.stringify(userData));
            
            console.log("验证通过，正在跳转..."); 
            window.location.href = 'dashboard.html';
        } else {
            alert("工号或密码错误！\n提示：admin / 123456");
        }
    },

    handleMenuClick: function(element, moduleKey) {
        const group = element.parentElement;
        group.classList.toggle('open');
    },

   // 模块切换逻辑（修复版）
    switchModule: function(parentKey, childKey) {
        const moduleID = `${parentKey}_${childKey}`;
        
        // 1. 检查是否在开发名单中
        if (!this.developedModules.includes(moduleID)) {
            this.showToast("该功能正在开发，请稍等。");
            return;
        }

        // 2. 切换内容区域显示
        const targetSectionId = {
            'plan_dailyReport': 'planSection',
            'personnel_list': 'personnelSection',
            'stats_overview': 'statsSection'
        }[moduleID];

        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            // 执行对应模块的初始化
            if (moduleID === 'plan_dailyReport' && typeof DailyReportModule !== 'undefined') DailyReportModule.init();
            if (moduleID === 'personnel_list' && typeof PersonnelModule !== 'undefined') PersonnelModule.render();
            if (moduleID === 'stats_overview' && typeof StatsModule !== 'undefined') StatsModule.init();
        }

        // 3. 处理侧边栏高亮（核心修复点）
        document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
        
        // 只有当存在明确的点击事件，且点击的是子菜单项时才设置 active
        if (window.event && window.event.type === 'click') {
            const target = window.event.currentTarget;
            if (target && target.classList && target.classList.contains('sub-item')) {
                target.classList.add('active');
            }
        } else {
            // 如果是初始化加载，可以根据 ID 手动寻找并高亮（可选）
            const defaultItem = document.querySelector(`[onclick*="'${parentKey}', '${childKey}'"]`);
            if (defaultItem) defaultItem.classList.add('active');
        }
    },

    showToast: function(msg) {
        const toast = document.getElementById('toastMessage');
        if(!toast) return;
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    },

    logout: function() {
        if(confirm("确定要退出吗？")) {
            localStorage.removeItem('currentUserData');
            window.location.href = 'index.html';
        }
    }
};

window.onload = () => App.init();