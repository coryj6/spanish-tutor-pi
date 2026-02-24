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
        card.innerHTML = `
            <div onclick='startSession(${JSON.stringify(p)})' style="flex:1">
                <strong>${p.display_name}</strong><br>
                <small>${p.level} | English: ${p.english_help || 'always'}</small>
            </div>
            <button onclick='showEditForm(${JSON.stringify(p)})' class="edit-btn">Settings</button>`;
        list.appendChild(card);
    });
    const actions = document.createElement('div');
    actions.style.display = "flex"; actions.style.flexDirection = "column"; actions.style.gap = "10px"; actions.style.marginTop = "20px";
    actions.innerHTML = `<button onclick="showEditForm(null)" style="background:#27ae60">+ Add Student</button>
                         <button onclick="loadHistory()" style="background:#9b59b6">Session History</button>`;
    list.appendChild(actions);
}

function formatTutorResponse(text) {
    if (!text) return "";
    
    // Use Regex for more robust matching of S:, C:, and E:
    let html = text
        .replace(/S:\s*/gi, '<span class="spanish">')
        .replace(/C:\s*/gi, '</span><span class="correction"><strong>Correction:</strong> ')
        .replace(/E:\s*/gi, '</span><span class="english">');
    
    if (html.includes('<span')) html += '</span>';
    return html;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    addMessage("user", text);
    input.value = '';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg tutor-msg';
    document.getElementById('messages').appendChild(msgDiv);
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
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.token) {
                        rawText += data.token;
                        msgDiv.innerHTML = formatTutorResponse(rawText);
                        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
                    }
                    if (data.done) {
                        const timer = document.createElement('span');
                        timer.className = 'timer';
                        timer.innerText = `Took ${data.duration}s`;
                        msgDiv.appendChild(timer);
                    }
                } catch(e) {}
            }
        }
    }
}

function startSession(profile) {
    activeProfile = profile;
    document.getElementById('profile-selection').style.display = 'none';
    document.getElementById('chat-ui').style.display = 'flex';
    document.getElementById('title').innerText = "Tutor: " + profile.display_name;
    addMessage("tutor", "¡Hola! ¿Listos para practicar?");
}

function addMessage(type, text) {
    const m = document.getElementById('messages');
    const d = document.createElement('div');
    d.className = 'msg ' + (type === 'user' ? 'user-msg' : 'tutor-msg');
    d.innerText = text;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
}

async function loadHistory() {
    const response = await fetch('/api/sessions');
    const files = await response.json();
    const list = document.getElementById('profile-list');
    list.innerHTML = '<h3>Past Sessions</h3>';
    files.forEach(file => {
        const btn = document.createElement('div');
        btn.className = 'profile-card';
        btn.innerHTML = `<span>${file.replace('.json', '')}</span>`;
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
    data.forEach(entry => {
        const uMsg = entry.user || "";
        const tMsg = entry.tutor || "";
        content.innerHTML += `<p style="color:#0084ff"><strong>You:</strong> ${uMsg}</p><div><strong>Tutor:</strong> ${formatTutorResponse(tMsg)}</div><hr>`;
    });
    const backBtn = document.createElement('button');
    backBtn.innerText = "Back"; backBtn.style.width = "100%"; backBtn.onclick = loadHistory;
    list.appendChild(backBtn);
}

function showEditForm(profile) {
    editingProfileId = profile ? profile.id : "new";
    document.getElementById('edit-name').value = profile ? profile.display_name : "";
    document.getElementById('edit-level').value = profile ? profile.level : "A1";
    document.getElementById('edit-english').value = (profile && profile.english_help) ? profile.english_help : "always";
    document.getElementById('profile-selection').style.display = 'none';
    document.getElementById('edit-form-container').style.display = 'block';
}
function hideEditForm() { document.getElementById('edit-form-container').style.display = 'none'; document.getElementById('profile-selection').style.display = 'block'; }
async function saveProfileChanges() {
    const updated = { id: editingProfileId, display_name: document.getElementById('edit-name').value || "Learner", level: document.getElementById('edit-level').value, correction_style: "gentle", english_help: document.getElementById('edit-english').value, allowed_tenses: ["present"] };
    const method = editingProfileId === "new" ? 'POST' : 'PUT';
    const url = editingProfileId === "new" ? '/api/profiles' : `/api/profiles/${editingProfileId}`;
    await fetch(url, { method: method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updated) });
    hideEditForm(); loadProfiles();
}
function exitChat() { location.reload(); }
loadProfiles();
