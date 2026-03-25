// js/modules/stats.js
const StatsModule = {
    init: function() {
        console.log("核心指标模块已激活...");
        this.render();
    },

    render: function() {
        const container = document.getElementById('statsSection');
        const allData = JSON.parse(localStorage.getItem('allDailyReports') || '[]');

        // 1. 计算核心总计数据
        let totalPlan = 0, totalActual = 0, totalRemain = 0;
        allData.forEach(item => {
            totalPlan += parseFloat(item.add || 0);
            totalActual += parseFloat(item.actual || 0);
            totalRemain += parseFloat(item.remain || 0);
        });

        const completionRate = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : 0;

        // 2. 渲染顶部统计卡片 (利用我们在 CSS 里写好的 .stats-grid)
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>全厂总计划 (米/件)</h4>
                    <div class="value">${totalPlan.toLocaleString()}</div>
                </div>
                <div class="stat-card success">
                    <h4>累计完成产值</h4>
                    <div class="value">${totalActual.toLocaleString()}</div>
                </div>
                <div class="stat-card warning">
                    <h4>在手剩余总量</h4>
                    <div class="value">${totalRemain.toLocaleString()}</div>
                </div>
                <div class="stat-card danger">
                    <h4>总体计划达成率</h4>
                    <div class="value">${completionRate}%</div>
                </div>
            </div>

            <div class="card-box">
                <div class="card-title">🏭 各车间实时进度概览</div>
                <table class="data-table">
                    <thead>
                        <tr><th>车间名称</th><th>工序数</th><th>计划总量</th><th>实际产量</th><th>达成率</th></tr>
                    </thead>
                    <tbody id="statsTableBody">${this.getWorkshopRows(allData)}</tbody>
                </table>
            </div>
        `;
    },

    // 辅助函数：按车间分组计算
    getWorkshopRows: function(data) {
        const workshops = ["大力缆", "中力缆", "小力缆", "中压", "特缆", "防火", "信号", "网络", "橡缆"];
        let html = "";
        
        workshops.forEach(ws => {
            const wsData = data.filter(d => d.workshop === ws);
            const wsPlan = wsData.reduce((sum, d) => sum + parseFloat(d.add || 0), 0);
            const wsActual = wsData.reduce((sum, d) => sum + parseFloat(d.actual || 0), 0);
            const rate = wsPlan > 0 ? ((wsActual / wsPlan) * 100).toFixed(1) : 0;

            html += `
                <tr>
                    <td><b>${ws}</b></td>
                    <td>${wsData.length}</td>
                    <td>${wsPlan}</td>
                    <td>${wsActual}</td>
                    <td style="color: ${rate >= 100 ? '#4CD964' : '#007AFF'}">${rate}%</td>
                </tr>`;
        });
        return html;
    }
};