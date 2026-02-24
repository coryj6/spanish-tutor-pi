let activeProfile = null;
let editingProfileId = null;

async function loadProfiles() {
    const response = await fetch('/api/profiles');
    const profiles = await response.json();
    const list = document.getElementById('profile-list');
    list.innerHTML = '<h3>Students</h3>';
    profiles.forEach(p => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `<div onclick='startSession(${JSON.stringify(p)})' style="flex:1; cursor:pointer;"><strong>${p.display_name}</strong><br><small>${p.level}</small></div><button onclick='showEditForm(${JSON.stringify(p)})' class="edit-btn">Settings</button>`;
        list.appendChild(card);
    });
    
    // RESTORED: Add Student and History Buttons
    const actions = document.createElement('div');
    actions.style = "display:flex; flex-direction:column; gap:10px; margin-top:20px;";
    actions.innerHTML = `
        <button onclick="showEditForm(null)" style="background:#27ae60; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">+ Add Student</button>
        <button onclick="loadHistory()" style="background:#9b59b6; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;">Session History</button>
    `;
    list.appendChild(actions);
}

function formatTutorResponse(text) {
    if (!text) return "";
    
    const pMatch = text.match(/PRACTICE:\s*([\s\S]*)$/i);
    const sMatch = text.match(/S:\s*([\s\S]*?)(?=(C:|E:|PRACTICE:|$))/i);
    const cMatch = text.match(/C:\s*([\s\S]*?)(?=(E:|PRACTICE:|$))/i);
    const eMatch = text.match(/E:\s*([\s\S]*?)(?=(PRACTICE:|$))/i);

    let html = "";
    if (sMatch) {
        html += `<div style="font-size:1.1em; margin-bottom:12px; color:#2c3e50; line-height:1.4;">${sMatch[1].trim()}</div>`;
    }
    if (cMatch && cMatch[1].trim().length > 5) {
        html += `<div style="background:#fff9db; padding:12px; border-radius:8px; margin-bottom:12px; color:#856404; font-size:0.95em; border: 1px solid #ffeeba;"><strong>Mentor Note:</strong><br>${cMatch[1].trim()}</div>`;
    }
    if (eMatch && eMatch[1].trim()) {
        html += `<div style="opacity:0.6; font-style:italic; font-size:0.9em; margin-bottom:10px;">${eMatch[1].trim()}</div>`;
    }
    if (pMatch) {
        html += `<div style="background:#e8f4fd; border-left:5px solid #3498db; padding:12px; margin-top:15px; border-radius:4px; color:#2c3e50;"><strong>Target Practice:</strong><br>${pMatch[1].trim()}</div>`;
    }
    return html;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text || !activeProfile) return;

    const userMsgId = Date.now();
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user-msg';
    userDiv.innerHTML = `<div>${text}</div><div class="user-meta" id="meta-${userMsgId}" style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.3); padding-top:6px; font-size:0.85em;"></div>`;
    document.getElementById('messages').appendChild(userDiv);
    
    const metaDiv = document.getElementById(`meta-${userMsgId}`);
    input.value = '';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg tutor-msg';
    document.getElementById('messages').appendChild(msgDiv);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({profile_id: activeProfile.id, message: text})
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let rawText = "";

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.includes('data: ')) {
                    try {
                        const data = JSON.parse(line.replace('data: ', '').trim());
                        if (data.token) {
                            rawText += data.token;
                            const tMatch = rawText.match(/T_SPANISH:\s*([\s\S]*?)(?=(IDEAL:|S:|$))/i);
                            const iMatch = rawText.match(/IDEAL:\s*([\s\S]*?)(?=(S:|$))/i);
                            let metaHtml = "";
                            if (tMatch) metaHtml += `<div style="opacity:0.85; font-style:italic;">"${tMatch[1].trim()}"</div>`;
                            if (iMatch) metaHtml += `<div style="color:#aaffaa; font-weight:bold; margin-top:2px;">✓ ${iMatch[1].trim()}</div>`;
                            metaDiv.innerHTML = metaHtml;
                            msgDiv.innerHTML = formatTutorResponse(rawText);
                        }
                        if (data.done) document.getElementById('brain-status').innerText = data.brain;
                    } catch(e) {}
                }
            }
        }
    } catch(err) { console.error(err); }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

function startSession(profile) { activeProfile = profile; document.getElementById('profile-selection').style.display = 'none'; document.getElementById('chat-ui').style.display = 'flex'; document.getElementById('title').innerText = "Tutor: " + profile.display_name; addMessage("tutor", "¡Hola! ¿Listos para practicar?"); }
function addMessage(type, text) { const m = document.getElementById('messages'); const d = document.createElement('div'); d.className = 'msg ' + (type === 'user' ? 'user-msg' : 'tutor-msg'); d.innerText = text; m.appendChild(d); m.scrollTop = m.scrollHeight; }
function exitChat() { location.reload(); }

async function loadHistory() {
    const response = await fetch('/api/sessions');
    const files = await response.json();
    const list = document.getElementById('profile-list');
    list.innerHTML = '<h3>Past Sessions</h3>';
    files.forEach(file => {
        const btn = document.createElement('div');
        btn.className = 'profile-card';
        btn.style.cursor = "pointer";
        btn.innerHTML = `<strong>${file.replace('.json', '')}</strong>`;
        btn.onclick = () => viewSessionFile(file);
        list.appendChild(btn);
    });
    const backBtn = document.createElement('button');
    backBtn.innerText = "Back"; backBtn.style.width = "100%"; backBtn.onclick = loadProfiles;
    list.appendChild(backBtn);
}

async function viewSessionFile(filename) {
    const response = await fetch(`/api/sessions/${filename}`);
    const data = await response.json();
    const list = document.getElementById('profile-list');
    list.innerHTML = `<h3>${filename}</h3><div id="history-content" style="text-align:left; background:white; padding:15px; border-radius:12px; max-height:400px; overflow-y:auto; border: 1px solid #ddd; margin-bottom:15px;"></div>`;
    const content = document.getElementById('history-content');
    data.forEach(entry => { content.innerHTML += `<p style="color:#0084ff"><strong>You:</strong> ${entry.user}</p><div><strong>Tutor:</strong> ${formatTutorResponse(entry.tutor)}</div><hr>`; });
    const backBtn = document.createElement('button');
    backBtn.innerText = "Back"; backBtn.style.width = "100%"; backBtn.onclick = loadHistory;
    list.appendChild(backBtn);
}

function showEditForm(profile) { editingProfileId = profile ? profile.id : "new"; document.getElementById('edit-name').value = profile ? profile.display_name : ""; document.getElementById('edit-level').value = profile ? profile.level : "A1"; document.getElementById('profile-selection').style.display = 'none'; document.getElementById('edit-form-container').style.display = 'block'; }
function hideEditForm() { document.getElementById('edit-form-container').style.display = 'none'; document.getElementById('profile-selection').style.display = 'block'; }
async function saveProfileChanges() {
    const name = document.getElementById('edit-name').value || "Learner";
    const level = document.getElementById('edit-level').value;
    const updated = { id: editingProfileId, display_name: name, level: level };
    const method = editingProfileId === "new" ? 'POST' : 'PUT';
    const url = editingProfileId === "new" ? '/api/profiles' : `/api/profiles/${editingProfileId}`;
    await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updated) });
    hideEditForm(); loadProfiles();
}

loadProfiles();
