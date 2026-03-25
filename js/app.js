// js/app.js
const App = {
    currentUser: null,
    // 【白名单】只有在这里定义的模块 ID 才能被打开，其它的都会提示“开发中”
    developedModules: ['plan_dailyReport', 'personnel_list', 'stats_overview'],

    init: function() {
        const userStr = localStorage.getItem('currentUserData');
        if (!userStr) { window.location.href = 'index.html'; return; }
        this.currentUser = JSON.parse(userStr);

        // 权限显示
        if (this.currentUser.id === 'admin') {
            const group = document.getElementById('menuPersonnelGroup');
            if(group) group.style.display = 'block';
        }
        
        // 默认展开第一个菜单并进入日报
        const firstGroup = document.querySelector('.menu-group');
        if(firstGroup) firstGroup.classList.add('open');
        this.switchModule('plan', 'dailyReport');
    },

    // 核心逻辑：处理一级菜单点击（折叠/展开）
    handleMenuClick: function(element, moduleKey) {
        const group = element.parentElement;
        const isOpen = group.classList.contains('open');
        
        // 切换当前组的 open 类
        if (isOpen) {
            group.classList.remove('open');
        } else {
            group.classList.add('open');
        }
    },

    // 核心逻辑：处理二级菜单点击
    switchModule: function(parentKey, childKey) {
        const moduleID = `${parentKey}_${childKey}`;
        
        // 1. 开发状态拦截
        if (!this.developedModules.includes(moduleID)) {
            this.showToast("该功能正在开发，请稍等。");
            return;
        }

        // 2. 正常切换逻辑
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

        if (moduleID === 'plan_dailyReport') {
            document.getElementById('planSection').style.display = 'block';
            DailyReportModule.init();
        } else if (moduleID === 'personnel_list') {
            document.getElementById('personnelSection').style.display = 'block';
            PersonnelModule.render();
        } else if (moduleID === 'stats_overview') { // 新增此分支
            document.getElementById('statsSection').style.display = 'block';
            StatsModule.init();
        }

        // 3. 高亮子菜单项
        document.querySelectorAll('.sub-item').forEach(i => i.classList.remove('active'));
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
    },

    // 提示框逻辑
    showToast: function(msg) {
        const toast = document.getElementById('toastMessage');
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    },

    logout: function() {
        if(confirm("确定要退出吗？")) {
            localStorage.removeItem('currentUserData');
            window.location.href = 'index.html';
        }
    }
};

window.onload = () => App.init();