const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";
let currentOpenFolder = null;

function login() {
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    if (email && token) {
        localStorage.setItem('gh_token', token);
        localStorage.setItem('user_email', email);
        location.reload();
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// তারিখ গ্রুপ করার লজিক
function getFormattedDate(timestamp) {
    const date = new Date(parseInt(timestamp));
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

// মিডিয়া লোড
async function loadMedia() {
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const folderPath = currentOpenFolder ? `vault/${safeEmail}/${currentOpenFolder}` : `vault/${safeEmail}`;

    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${folderPath}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const data = await res.json();
        const grid = document.getElementById('media-grid');
        grid.innerHTML = '';

        const grouped = {};
        data.reverse().forEach(file => {
            if (file.name === ".keep" || file.type === "dir") return;
            const timestamp = file.name.split('_')[0];
            const label = getFormattedDate(timestamp);
            if (!grouped[label]) grouped[label] = [];
            grouped[label].push(file);
        });

        for (const date in grouped) {
            const header = document.createElement('div');
            header.className = 'date-group-header';
            header.innerText = date;
            grid.appendChild(header);

            const container = document.createElement('div');
            container.className = 'grid-3';
            grouped[date].forEach(file => {
                const isVideo = file.name.match(/\.(mp4|webm)$/i);
                const el = document.createElement(isVideo ? 'video' : 'img');
                el.src = file.download_url;
                el.className = 'media-item';
                el.onclick = () => openModal(file.download_url, isVideo, file.path, file.sha, file.name);
                container.appendChild(el);
            });
            grid.appendChild(container);
        }
    } catch (e) { console.log("Empty Vault"); }
}

// আপলোড ফাংশন (উইথ লোডিং বার)
async function uploadFiles() {
    const files = document.getElementById('file-input').files;
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    if (!files.length) return;

    document.getElementById('upload-popup').classList.remove('hidden');
    let done = 0;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const fileName = `${Date.now()}_${file.name}`;
            const path = currentOpenFolder ? `vault/${safeEmail}/${currentOpenFolder}/${fileName}` : `vault/${safeEmail}/${fileName}`;
            
            await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "upload", content })
            });
            done++;
            document.getElementById('progress-bar').style.width = (done/files.length)*100 + "%";
            if(done === files.length) location.reload();
        };
        reader.readAsDataURL(file);
    }
}

// পারমানেন্ট ডিলিট
function deleteFile() {
    closeModal();
    document.getElementById('delete-confirm-popup').classList.remove('hidden');
}

async function executePermanentDelete() {
    const token = localStorage.getItem('gh_token');
    const btn = document.querySelector('.btn-confirm-delete');
    btn.innerText = "Deleting...";
    
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${window.currentFile.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${token}` },
        body: JSON.stringify({ message: "delete", sha: window.currentFile.sha })
    });
    location.reload();
}

function openModal(url, isVideo, path, sha, name) {
    window.currentFile = { url, path, sha, name };
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}">`;
    document.getElementById('modal').classList.remove('hidden');
}

async function downloadOriginal() {
    const res = await fetch(window.currentFile.url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = window.currentFile.name;
    a.click();
}

function switchTab(t) {
    document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    if(t === 'folders') {
        document.getElementById('folders-section').classList.remove('hidden');
        loadFolders();
    } else {
        document.getElementById('main-gallery').classList.remove('hidden');
        loadMedia();
    }
}

async function createNewFolder() {
    const name = prompt("Event Name:");
    if(!name) return;
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/vault/${safeEmail}/${name}/.keep`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}` },
        body: JSON.stringify({ message: "new folder", content: btoa("folder") })
    });
    loadFolders();
}

async function loadFolders() {
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/vault/${safeEmail}`, {
        headers: { 'Authorization': `token ${token}` }
    });
    const data = await res.json();
    const grid = document.getElementById('folder-grid');
    grid.innerHTML = '';
    data.forEach(item => {
        if(item.type === 'dir') {
            const div = document.createElement('div');
            div.innerHTML = `<div style="background:#111; padding:20px; border-radius:15px; border:1px solid #333">📂<br>${item.name}</div>`;
            div.onclick = () => {
                currentOpenFolder = item.name;
                document.getElementById('folder-controls').classList.add('hidden');
                document.getElementById('folder-back-nav').classList.remove('hidden');
                document.getElementById('current-folder-name').innerText = item.name;
                loadMedia();
            };
            grid.appendChild(div);
        }
    });
}

function backToFolders() {
    currentOpenFolder = null;
    document.getElementById('folder-controls').classList.remove('hidden');
    document.getElementById('folder-back-nav').classList.add('hidden');
    loadFolders();
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function closeDeletePopup() { document.getElementById('delete-confirm-popup').classList.add('hidden'); }

window.onload = () => {
    if (localStorage.getItem('gh_token')) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('gallery-container').classList.remove('hidden');
        loadMedia();
    }
};
