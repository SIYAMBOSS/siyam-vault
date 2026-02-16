const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";
let currentTab = 'photos';
let currentOpenFolder = null;

// ১. ট্যাব সুইচিং
function switchTab(tab) {
    currentTab = tab;
    currentOpenFolder = null; // হোম পেজে ফিরলে ফোল্ডার ক্লিয়ার হবে
    
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    if(tab === 'albums') {
        document.getElementById('albums-section').classList.remove('hidden');
        document.getElementById('media-display-section').classList.add('hidden');
        document.getElementById('folder-inner-view').classList.add('hidden');
        loadFolders();
    } else {
        document.getElementById('albums-section').classList.add('hidden');
        document.getElementById('media-display-section').classList.remove('hidden');
        document.getElementById('folder-inner-view').classList.add('hidden');
        loadMedia();
    }
}

// ২. মিডিয়া লোড (ফিল্টার ও কাউন্টারসহ)
async function loadMedia() {
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const path = currentOpenFolder ? `vault/${safeEmail}/${currentOpenFolder}` : `vault/${safeEmail}`;

    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
    });
    const data = await res.json();
    
    // ইভেন্টের ভেতর থাকলে বা হোম পেজে থাকলে সেই অনুযায়ী ফিল্টার
    const filtered = data.filter(file => {
        if(file.type === 'dir' || file.name === '.keep') return false;
        const isVid = file.name.match(/\.(mp4|webm|mov)$/i);
        return currentTab === 'photos' ? !isVid : isVid;
    });

    renderMedia(filtered.reverse());
    updateUI(filtered.length);
}

function renderMedia(files) {
    const grid = currentOpenFolder ? document.getElementById('event-media-grid') : document.getElementById('media-grid');
    grid.innerHTML = '';
    
    // তারিখ অনুযায়ী গ্রুপিং লজিক
    let lastDate = "";
    files.forEach(file => {
        const dateLabel = new Date(parseInt(file.name.split('_')[0])).toDateString();
        if(dateLabel !== lastDate) {
            const header = document.createElement('div');
            header.className = 'date-group-header';
            header.innerText = dateLabel === new Date().toDateString() ? "Today" : dateLabel;
            grid.appendChild(header);
            lastDate = dateLabel;
        }

        const isVideo = file.name.match(/\.(mp4|webm|mov)$/i);
        const el = document.createElement(isVideo ? 'video' : 'img');
        el.src = file.download_url;
        el.className = 'media-item';
        el.onclick = () => openModal(file.download_url, isVideo, file.path, file.sha, file.name);
        grid.appendChild(el);
    });
}

function updateUI(count) {
    document.getElementById('total-count').innerText = `${count} ${currentTab.toUpperCase()}`;
    document.getElementById('all-count').innerText = count;
    document.getElementById('specific-filter').innerText = currentTab === 'photos' ? 'Camera' : 'Videos';
    
    const filterBar = document.getElementById('floating-filter');
    currentTab === 'albums' ? filterBar.classList.add('hidden') : filterBar.classList.remove('hidden');
}

// ৩. অ্যালবাম/ইভেন্ট সিস্টেম
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
            div.innerHTML = `<div class="folder-card-inner" style="background:#111; padding:30px; border-radius:20px; text-align:center; border:1px solid #222;">📂<br>${item.name}</div>`;
            div.onclick = () => {
                currentOpenFolder = item.name;
                document.getElementById('albums-section').classList.add('hidden');
                document.getElementById('folder-inner-view').classList.remove('hidden');
                document.getElementById('current-folder-title').innerText = item.name;
                loadMedia();
            };
            grid.appendChild(div);
        }
    });
}

function backToFolders() {
    currentOpenFolder = null;
    switchTab('albums');
}

// ৪. ওপেন মোডাল ও ডাউনলোড
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

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }

window.onload = () => { if(localStorage.getItem('gh_token')) loadMedia(); };
