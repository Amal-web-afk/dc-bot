document.addEventListener('DOMContentLoaded', async () => {
    const serverSelect = document.getElementById('serverSelect');
    const serverSelectStatus = document.getElementById('serverSelectStatus');
    const configForm = document.getElementById('configForm');
    const welcomeChannel = document.getElementById('welcomeChannel');
    const welcomeMsg = document.getElementById('welcomeMsg');
    const welcomeBg = document.getElementById('welcomeBg');
    const leaveChannel = document.getElementById('leaveChannel');
    const leaveMsg = document.getElementById('leaveMsg');
    const leaveBg = document.getElementById('leaveBg');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const saveStatus = document.getElementById('saveStatus');

    // 1. Fetch servers on load
    try {
        const res = await fetch('/api/guilds');
        const guilds = await res.json();
        
        serverSelect.innerHTML = '<option value="">Select a server...</option>';
        if (guilds.length === 0) {
            serverSelect.innerHTML = '<option value="">Bot is not in any servers</option>';
            return;
        }

        guilds.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = g.name;
            serverSelect.appendChild(opt);
        });

        // Autoselect if only 1 server
        if (guilds.length === 1) {
            serverSelect.value = guilds[0].id;
            serverSelectStatus.textContent = "Auto-selected your only server.";
            serverSelectStatus.style.color = "var(--text-secondary)";
            await loadConfigForGuild(guilds[0].id);
        }
    } catch(e) {
        console.error("Failed to load servers", e);
        serverSelect.innerHTML = '<option value="">Error loading servers</option>';
    }

    // Load Commands
    async function loadCommands() {
        try {
            const cmdRes = await fetch('/api/commands');
            const commands = await cmdRes.json();
            const commandsGrid = document.getElementById('commandsGrid');
            
            if (commands && commands.length > 0) {
                commandsGrid.innerHTML = '';
                commands.forEach(cmd => {
                    const div = document.createElement('div');
                    div.className = 'cmd-card fade-in';
                    div.innerHTML = `<h4>/${cmd.name}</h4><p>${cmd.description}</p>`;
                    commandsGrid.appendChild(div);
                });
            } else {
                commandsGrid.innerHTML = '<p>No commands registered yet!</p>';
            }
        } catch(e) {
            console.error("Failed to load commands", e);
            document.getElementById('commandsGrid').innerHTML = '<p class="status-msg error">Error loading commands.</p>';
        }
    }

    await loadCommands();

    // 2. Event Listener for server select
    serverSelect.addEventListener('change', async (e) => {
        const guildId = e.target.value;
        serverSelectStatus.textContent = '';
        if (!guildId) {
            configForm.classList.add('hidden');
            return;
        }
        await loadConfigForGuild(guildId);
    });

    // 3. Load config function
    async function loadConfigForGuild(guildId) {
        configForm.classList.add('hidden');
        saveStatus.textContent = "Loading...";
        saveStatus.className = "status-msg";
        
        try {
            const [channelsRes, configRes] = await Promise.all([
                fetch(`/api/guild/${guildId}/channels`),
                fetch(`/api/config/${guildId}`)
            ]);
            
            const channels = await channelsRes.json();
            const config = await configRes.json();
            
            let channelOptions = '<option value="">Select Channel</option>';
            channels.forEach(c => {
                channelOptions += `<option value="${c.id}">#${c.name}</option>`;
            });
            
            welcomeChannel.innerHTML = channelOptions;
            leaveChannel.innerHTML = channelOptions;
            document.getElementById('srChannel').innerHTML = channelOptions;
            const lvlUpChannelSelect = document.getElementById('levelUpChannelId');
            if (lvlUpChannelSelect) lvlUpChannelSelect.innerHTML = '<option value="">Current Channel</option>' + channelOptions;
            const botCmdSelect = document.getElementById('botCommandsChannelId');
            if (botCmdSelect) botCmdSelect.innerHTML = '<option value="">Allow Anywhere</option>' + channelOptions;
            const xpLogsSelect = document.getElementById('xpLogsChannelId');
            if (xpLogsSelect) xpLogsSelect.innerHTML = '<option value="">Disabled</option>' + channelOptions;
            
            // Fetch roles
            let cachedRoleOpts = '<option value="">None</option>';
            try {
                const rRes = await fetch(`/api/guild/${guildId}/roles`);
                const roles = await rRes.json();
                roles.forEach(r => cachedRoleOpts += `<option value="${r.id}">${r.name}</option>`);
                for(let i=1; i<=5; i++) document.getElementById(`srRole${i}`).innerHTML = cachedRoleOpts;
                document.getElementById('autoroleId').innerHTML = cachedRoleOpts;
                // Store globally for dynamic level roles
                window.guildRolesHtml = cachedRoleOpts;
            } catch(e) {}
            
            // Fetch Level Roles specifically
            try {
                const lrRes = await fetch(`/api/guild/${guildId}/level-roles`);
                window.currentLevelRoles = await lrRes.json();
                renderLevelRoles();
            } catch(e) {}
            
            welcomeChannel.value = config.welcome_channel_id || '';
            welcomeMsg.value = config.welcome_message || '';
            welcomeBg.value = config.welcome_bg_url || '';
            
            leaveChannel.value = config.leave_channel_id || '';
            leaveMsg.value = config.leave_message || '';
            leaveBg.value = config.leave_bg_url || '';

            document.getElementById('autoroleId').value = config.autorole_id || '';
            const lvlUpChannelSelect2 = document.getElementById('levelUpChannelId');
            if (lvlUpChannelSelect2) lvlUpChannelSelect2.value = config.level_up_channel_id || '';
            const botCmdSelect2 = document.getElementById('botCommandsChannelId');
            if (botCmdSelect2) botCmdSelect2.value = config.bot_commands_channel_id || '';
            const xpLogsSelect2 = document.getElementById('xpLogsChannelId');
            if (xpLogsSelect2) xpLogsSelect2.value = config.xp_logs_channel_id || '';
            
            configForm.classList.remove('hidden');
            saveStatus.textContent = "";
        } catch (err) {
            saveStatus.textContent = "Failed to load server configuration.";
            saveStatus.className = "status-msg error";
        }
    }

    // 4. Save API logic
    saveConfigBtn.addEventListener('click', async () => {
        const guildId = serverSelect.value;
        if (!guildId) return;
        
        saveConfigBtn.textContent = "⏳ Saving...";
        saveConfigBtn.disabled = true;
        
        const payload = {
            welcome_channel_id: welcomeChannel.value,
            welcome_message: welcomeMsg.value,
            welcome_bg_url: welcomeBg.value,
            leave_channel_id: leaveChannel.value,
            leave_message: leaveMsg.value,
            leave_bg_url: leaveBg.value,
            autorole_id: document.getElementById('autoroleId').value,
            level_up_channel_id: document.getElementById('levelUpChannelId') ? document.getElementById('levelUpChannelId').value : '',
            bot_commands_channel_id: document.getElementById('botCommandsChannelId') ? document.getElementById('botCommandsChannelId').value : '',
            xp_logs_channel_id: document.getElementById('xpLogsChannelId') ? document.getElementById('xpLogsChannelId').value : ''
        };
        
        try {
            // Save main config
            const res = await fetch(`/api/config/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to save config data");

            // Save Level Roles
            const lrRows = document.querySelectorAll('.level-role-row');
            const newLevelRoles = [];
            lrRows.forEach(row => {
                const lvl = row.querySelector('.lr-level').value;
                const rId = row.querySelector('.lr-role').value;
                if (lvl && rId) newLevelRoles.push({ level: lvl, role_id: rId });
            });

            await fetch(`/api/guild/${guildId}/level-roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roles: newLevelRoles })
            });

            saveStatus.textContent = "✅ All settings carefully saved!";
            saveStatus.className = "status-msg success fade-in";
        } catch (e) {
            saveStatus.textContent = "❌ Failed to save configuration. Is the bot running? Error: " + e.message;
            saveStatus.className = "status-msg error fade-in";
        } finally {
            saveConfigBtn.textContent = "💾 Save Changes";
            saveConfigBtn.disabled = false;
            
            setTimeout(() => {
                if (saveStatus.className.includes("success")) {
                    saveStatus.textContent = "";
                }
            }, 4000);
        }
    });

    // 5. Test Buttons Logic
    const testWelcomeBtn = document.getElementById('testWelcomeBtn');
    const testLeaveBtn = document.getElementById('testLeaveBtn');

    testWelcomeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const guildId = serverSelect.value;
        if (!guildId) return;

        testWelcomeBtn.textContent = '⏳ Sending Preview...';
        testWelcomeBtn.disabled = true;

        const payload = {
            channel_id: welcomeChannel.value,
            message: welcomeMsg.value,
            bg_url: welcomeBg.value
        };

        try {
            const res = await fetch(`/api/test/welcome/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            saveStatus.textContent = "✅ Test welcome message sent privately to the channel!";
            saveStatus.className = "status-msg success fade-in";
        } catch (err) {
            saveStatus.textContent = "❌ Error sending test: " + err.message;
            saveStatus.className = "status-msg error fade-in";
        } finally {
            testWelcomeBtn.textContent = '🧪 Test Welcome Banner';
            testWelcomeBtn.disabled = false;
        }
    });

    testLeaveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const guildId = serverSelect.value;
        if (!guildId) return;

        testLeaveBtn.textContent = '⏳ Sending Preview...';
        testLeaveBtn.disabled = true;

        const payload = {
            channel_id: leaveChannel.value,
            message: leaveMsg.value,
            bg_url: leaveBg.value
        };

        try {
            const res = await fetch(`/api/test/leave/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            saveStatus.textContent = "✅ Test leave message sent privately to the channel!";
            saveStatus.className = "status-msg success fade-in";
        } catch (err) {
            saveStatus.textContent = "❌ Error sending test: " + err.message;
            saveStatus.className = "status-msg error fade-in";
        } finally {
            testLeaveBtn.textContent = '🧪 Test Leave Banner';
            testLeaveBtn.disabled = false;
        }
    });

    const srDeployBtn = document.getElementById('srDeployBtn');
    const srDeployStatus = document.getElementById('srDeployStatus');

    srDeployBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const guildId = serverSelect.value;
        if (!guildId) return;

        srDeployBtn.textContent = '⏳ Deploying...';
        srDeployBtn.disabled = true;

        const rolesArr = [];
        for(let i=1; i<=5; i++) {
            const role_id = document.getElementById(`srRole${i}`).value;
            const emoji = document.getElementById(`srEmoji${i}`).value;
            if (role_id) {
                rolesArr.push({ role_id, emoji });
            }
        }

        const payload = {
            channel_id: document.getElementById('srChannel').value,
            message: document.getElementById('srMessage').value,
            roles: rolesArr
        };

        try {
            const res = await fetch(`/api/setup/selfrole/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            srDeployStatus.textContent = "✅ Panel successfully deployed to the channel!";
            srDeployStatus.className = "status-msg success fade-in";
        } catch (err) {
            srDeployStatus.textContent = "❌ Error: " + err.message;
            srDeployStatus.className = "status-msg error fade-in";
        } finally {
            srDeployBtn.textContent = '🚀 Deploy Panel to Server';
            srDeployBtn.disabled = false;
            setTimeout(() => { srDeployStatus.textContent = ""; }, 5000);
        }
    });

    // --- Dynamic Level Roles UI Methods ---
    function renderLevelRoles() {
        const container = document.getElementById('levelRolesContainer');
        if (!container) return;
        container.innerHTML = '';
        const roles = window.currentLevelRoles || [];
        roles.forEach(lr => addLevelRoleRow(lr.level, lr.role_id));
    }

    function addLevelRoleRow(levelVal = '', roleIdVal = '') {
        const container = document.getElementById('levelRolesContainer');
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'level-role-row';
        row.style = 'display: grid; grid-template-columns: 80px 1fr auto; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 8px;';
        
        row.innerHTML = `
            <input type="number" class="input-field lr-level" placeholder="Level" value="${levelVal}" min="1" required style="padding: 0.5rem;">
            <select class="input-field lr-role" style="padding: 0.5rem;">
                ${window.guildRolesHtml || '<option value="">None</option>'}
            </select>
            <button class="btn remove-lr-btn" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 0.5rem 1rem;">❌</button>
        `;

        // Set the active selected role dynamically
        if (roleIdVal) {
            row.querySelector('.lr-role').value = roleIdVal;
        }

        row.querySelector('.remove-lr-btn').addEventListener('click', (e) => {
            e.preventDefault();
            row.remove();
        });

        container.appendChild(row);
    }

    const addLrBtn = document.getElementById('addLevelRoleBtn');
    if (addLrBtn) {
        addLrBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addLevelRoleRow();
        });
    }

});
