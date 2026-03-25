// js/modules/dailyReport.js

// 修改前：
// workshops: ["大力缆", "中力缆", "小力缆", "中压", "信号", "网络"],

// 修改后（请用这段替换）：
const DAILY_CONFIG = {
    workshops: ["大力缆", "中力缆", "小力缆", "中压", "特缆", "防火", "信号", "网络", "橡缆"],
    signalProcesses: ["云母带绕包", "绝缘", "单芯绕包", "信号电缆星绞", "信号电缆屏蔽", "成缆", "编织", "内护", "铠装", "钢丝铠装", "外护", "1kV架空线", "10kV架空线"]
};

const DailyReportModule = {
    // 模块状态 (State)
    currentWS: "大力缆",
    allRecords: [],

    // 模块启动总开关
    init: function() {
        console.log("生产日报模块已挂载...");
        // 每次启动时，从本地存储拉取最新数据
        this.allRecords = JSON.parse(localStorage.getItem('allDailyReports') || '[]');
        
        this.renderLayout();      // 第一步：画出框架和弹窗
        this.renderWorkshopBar(); // 第二步：生成车间按钮
        this.refreshTable();      // 第三步：加载并过滤数据
    },

    // 1. 动态生成界面骨架 (覆盖原有的静态HTML)
    renderLayout: function() {
        const container = document.getElementById('planSection');
        
        container.innerHTML = `
            <div class="workshop-bar" id="workshopBar" style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap; background:white; padding:15px; border-radius:10px;"></div>
            <h3 id="currentWorkshopName">当前查看：${this.currentWS}</h3>
            
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button class="btn btn-primary" onclick="DailyReportModule.openModal()">📝 进入填写端口</button>
                <button class="btn" style="border:1px solid #ddd; background:#fff;" onclick="DailyReportModule.exportExcel()">📤 导出汇总 Excel</button>
            </div>

            <div class="table-container" style="background:white; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.05); overflow:hidden;">
                <table class="data-table" style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead style="background:#f8f9fa;">
                        <tr><th style="padding:12px;">日期</th><th>工序</th><th>新增计划</th><th>实际产量</th><th>外协</th><th style="color:#007AFF">剩余在手</th><th>产能</th><th>周期</th></tr>
                    </thead>
                    <tbody id="summaryTbody"></tbody>
                </table>
            </div>

            <div id="inputModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
                <div style="background:white; padding:30px; border-radius:15px; width:500px; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                    <h3 style="color:#007AFF; margin-top:0;">日报数据记录</h3>
                    <div style="display:grid; gap:12px;">
                        <div><label style="font-size:12px; color:#666;">日期</label><input type="date" id="formDate" readonly style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;"></div>
                        <div><label style="font-size:12px; color:#666;">工序</label><div id="processContainer"></div></div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <input type="number" id="formAdd" placeholder="当日新增计划" oninput="DailyReportModule.calc()" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                            <input type="number" id="formActual" placeholder="当日实际产量" oninput="DailyReportModule.calc()" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                            <input type="number" id="formOut" placeholder="外协计划" oninput="DailyReportModule.calc()" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                            <input type="number" id="formRemain" placeholder="剩余在手" readonly style="padding:8px; background:#f9f9f9; color:#007AFF; font-weight:bold; border:1px solid #ddd; border-radius:4px;">
                        </div>
                        <input type="text" id="formCapacity" placeholder="预期产能" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                        <input type="text" id="formCycle" placeholder="生产周期" style="padding:8px; border:1px solid #ddd; border-radius:4px;">
                    </div>
                    <div style="margin-top:20px; display:flex; gap:10px;">
                        <button class="btn" style="background:#eee; border:none; padding:10px; border-radius:6px; cursor:pointer;" onclick="DailyReportModule.closeModal()">取消</button>
                        <button class="btn btn-primary" style="flex:1; border:none; padding:10px; border-radius:6px; cursor:pointer;" onclick="DailyReportModule.uploadData()">🚀 提交并上传</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 2. 渲染顶部车间导航按钮
    renderWorkshopBar: function() {
        const bar = document.getElementById('workshopBar');
        bar.innerHTML = ""; 
        DAILY_CONFIG.workshops.forEach(ws => {
            const btn = document.createElement('button');
            // 简单的按钮样式，当前选中的高亮
            btn.style.cssText = `padding:6px 15px; border-radius:20px; border:1px solid #ddd; background:${ws === this.currentWS ? '#007AFF' : '#fff'}; color:${ws === this.currentWS ? '#fff' : '#333'}; cursor:pointer; font-size:13px;`;
            btn.innerText = ws;
            btn.onclick = () => this.switchWorkshop(ws);
            bar.appendChild(btn);
        });
    },

    // 3. 切换车间逻辑
    switchWorkshop: function(wsName) {
        this.currentWS = wsName;
        document.getElementById('currentWorkshopName').innerText = "当前查看：" + wsName;
        this.renderWorkshopBar(); // 重新渲染按钮以更新高亮状态
        this.refreshTable();      // 刷新下方表格
    },

    // 4. 刷新数据表格 (包含部门权限过滤)
    refreshTable: function() {
        const tbody = document.getElementById('summaryTbody');
        // App.currentUser 是在 app.js 里定义好的全局变量
        const user = App.currentUser; 
        
        // 权限判断逻辑
        const isAdmin = (user.id === 'admin');
        const isManager = (user.dept === "生产管理中心");
        const isOwnWorkshop = (user.dept === this.currentWS);

        if (!isAdmin && !isManager && !isOwnWorkshop) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#FF3B30; padding:40px; background:#fff5f5;">⚠️ 您所属部门为 [${user.dept}]，无权查看 [${this.currentWS}] 的数据</td></tr>`;
            return;
        }

        // 过滤并渲染当前车间数据
        const filtered = this.allRecords.filter(r => r.workshop === this.currentWS);
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#999; padding:40px;">[${this.currentWS}] 暂无记录</td></tr>`;
        } else {
            tbody.innerHTML = filtered.map(r => `
                <tr>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.date}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; font-weight:bold;">${r.process}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.add}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.actual}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.out}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee; color:#007AFF; font-weight:bold;">${r.remain}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.cap}</td>
                    <td style="padding:12px; border-bottom:1px solid #eee;">${r.cycle}</td>
                </tr>
            `).join('');
        }
    },

    // 5. 打开填写弹窗
    openModal: function() {
        const user = App.currentUser;
        if (user.id !== 'admin' && user.dept !== "生产管理中心" && user.dept !== this.currentWS) {
            alert(`⚠️ 权限不足，无法为 [${this.currentWS}] 填报数据。`);
            return;
        }

        document.getElementById('inputModal').style.display = 'flex';
        document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
        
        const container = document.getElementById('processContainer');
        // 根据车间动态渲染工序输入框
        if (this.currentWS === "信号") {
            container.innerHTML = `<select id="formProcess" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">
                ${DAILY_CONFIG.signalProcesses.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>`;
        } else {
            container.innerHTML = `<input type="text" id="formProcess" placeholder="手动输入工序" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px;">`;
        }
        
        // 清空之前填过的数据
        ['formAdd', 'formActual', 'formOut', 'formRemain', 'formCapacity', 'formCycle'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
    },

    closeModal: function() {
        document.getElementById('inputModal').style.display = 'none';
    },

    // 6. 实时计算剩余在手
    calc: function() {
        const a = parseFloat(document.getElementById('formAdd').value) || 0;
        const b = parseFloat(document.getElementById('formActual').value) || 0;
        const c = parseFloat(document.getElementById('formOut').value) || 0;
        document.getElementById('formRemain').value = a - b - c;
    },

    // 7. 提交上传数据
    uploadData: function() {
        const processVal = document.getElementById('formProcess').value;
        if (!processVal) return alert("工序不能为空！");

        const record = {
            workshop: this.currentWS,
            date: document.getElementById('formDate').value,
            process: processVal,
            add: document.getElementById('formAdd').value || '0',
            actual: document.getElementById('formActual').value || '0',
            out: document.getElementById('formOut').value || '0',
            remain: document.getElementById('formRemain').value || '0',
            cap: document.getElementById('formCapacity').value || '-',
            cycle: document.getElementById('formCycle').value || '-'
        };

        this.allRecords.push(record);
        localStorage.setItem('allDailyReports', JSON.stringify(this.allRecords));
        
        this.closeModal();
        this.refreshTable();
        
        // 尝试呼叫 stats.js 更新顶部卡片数据 (如果 stats 模块存在的话)
        if (typeof window.StatsModule !== 'undefined' && typeof StatsModule.updateStats === 'function') {
            StatsModule.updateStats();
        }
    },

    // 8. 导出Excel
    exportExcel: function() {
        if (typeof XLSX === 'undefined') return alert("缺少 Excel 插件，请检查网络！");
        
        // 找到表格元素
        const tableObj = document.querySelector("#planSection .data-table");
        if (!tableObj) return;

        const ws = XLSX.utils.table_to_sheet(tableObj);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.currentWS);
        XLSX.writeFile(wb, `${this.currentWS}_生产日报.xlsx`);
    }
};