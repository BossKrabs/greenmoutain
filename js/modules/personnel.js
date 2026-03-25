// js/modules/personnel.js
const PersonnelModule = {
    // 渲染账号管理界面
    render: function() {
        const container = document.getElementById('personnelSection');
        const currentUserData = JSON.parse(localStorage.getItem('currentUserData') || '{}');
        
        // 只有 admin 才能看到创建表单
        const adminFormHtml = currentUserData.id === 'admin' ? `
            <div class="admin-box">
                <strong style="color:#007AFF;">➕ 新增系统账号</strong>
                <div class="admin-grid">
                    <input type="text" id="newUsername" placeholder="请输入工号">
                    <input type="password" id="newPassword" placeholder="初始密码">
                    <select id="newDept">
                        <option value="生产管理中心">生产管理中心</option>
                        <option value="大力缆">大力缆</option>
                        <option value="中力缆">中力缆</option>
                        <option value="小力缆">小力缆</option>
                        <option value="中压">中压</option>
                        <option value="特缆">特缆</option>
                        <option value="防火">防火</option>
                        <option value="信号">信号</option>
                        <option value="网络">网络</option>
                        <option value="橡缆">橡缆</option>
                    </select>
                    <button class="btn btn-primary" onclick="PersonnelModule.addUser()">确认创建账号</button>
                </div>
            </div>` : '';

        container.innerHTML = `
            <h3>👤 人员管理与权限分配</h3>
            ${adminFormHtml}
            <table class="user-table">
                <thead><tr><th>工号/用户名</th><th>所属部门</th><th>操作权限</th></tr></thead>
                <tbody id="userListTableBody"></tbody>
            </table>
        `;
        this.renderUserList();
    },

    // 渲染用户列表
    renderUserList: function() {
        const tbody = document.getElementById('userListTableBody');
        const users = JSON.parse(localStorage.getItem('systemUsers') || '{}');
        const currentUserData = JSON.parse(localStorage.getItem('currentUserData') || '{}');
        
        let html = "";
        for (let id in users) {
            html += `<tr>
                <td><b>${id}</b></td>
                <td>${users[id].dept}</td>
                <td>
                    ${currentUserData.id === 'admin' ? 
                      `<button onclick="PersonnelModule.deleteUser('${id}')" style="color:red; background:none; border:none; cursor:pointer;">删除</button>` : 
                      `<span style="color:#ccc;">只读</span>`}
                </td>
            </tr>`;
        }
        tbody.innerHTML = html || '<tr><td colspan="3" style="text-align:center;">暂无账号数据</td></tr>';
    },

    // 添加账号逻辑
    addUser: function() {
        const id = document.getElementById('newUsername').value.trim();
        const pw = document.getElementById('newPassword').value;
        const dept = document.getElementById('newDept').value;
        if (!id || !pw) return alert("请填写工号和密码");
        
        const users = JSON.parse(localStorage.getItem('systemUsers') || '{}');
        users[id] = { password: pw, dept: dept };
        localStorage.setItem('systemUsers', JSON.stringify(users));
        
        alert("账号创建成功！");
        this.render(); // 刷新界面
    },

    // 删除账号逻辑
    deleteUser: function(id) {
        if(confirm(`确认删除账号 ${id} 吗？`)) {
            const users = JSON.parse(localStorage.getItem('systemUsers') || '{}');
            delete users[id];
            localStorage.setItem('systemUsers', JSON.stringify(users));
            this.render(); // 刷新界面
        }
    }
};