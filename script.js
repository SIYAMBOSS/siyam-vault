const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";
let currentTab = 'photos';
let currentOpenFolder = null;

function switchTab(tab) {
    currentTab = tab;
    currentOpenFolder = null;
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    const bar = document.getElementById('floating-filter');
    if(tab === 'albums') {
        document.getElementById('albums-section').classList.remove('hidden');
        document.getElementById('media-display-section').classList.add('hidden');
        document.getElementById('folder-inner-view').classList.add('hidden');
        bar.classList.add('hidden');
        loadFolders();
    } else {
        document.getElementById('albums-section').classList.add('hidden');
        document.getElementById('media-display-section').classList.remove('hidden');
        document.getElementById('folder-inner-view').classList.add('hidden');
        bar.classList.remove('hidden');
        loadMedia();
    }
}

async function loadMedia() {
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const path = currentOpenFolder ? `vault/${safeEmail}/${currentOpenFolder}` : `vault/${safeEmail}`;

    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
    });
    const data = await res.json();
    
    // শুধু ফাইলগুলো ফিল্টার করা
    const files = data.filter(f => f.type === 'file' && f.name !== '.keep');
    const filtered = files.filter(f => {
        const isVid = f.name.match(/\.(mp4|webm|mov)$/i);
        return currentTab === 'photos' ? !isVid : isVid;
    });

    renderGallery(filtered.reverse());
    updateFooter(filtered.length);
}

function updateFooter(count) {
    document.getElementById('total-count').innerText = `${count} Items`;
    document.getElementById('all-count').innerText = count;
    document.getElementById('filter-specific').innerText = currentTab === 'photos' ? 'Camera' : 'Videos';
}

function renderGallery(files) {
    const grid = currentOpenFolder ? document.getElementById('event-media-grid') : document.getElementById('media-grid');
    grid.innerHTML = '';
    files.forEach(file => {
        const isVid = file.name.match(/\.(mp4|webm|mov)$/i);
        const img = document.createElement(isVid ? 'video' : 'img');
        img.src = file.download_url;
        img.className = 'media-item';
        img.onclick = () => openModal(file.download_url, isVid, file.path, file.sha, file.name);
        grid.appendChild(img);
    });
}

function openModal(url, isVid, path, sha, name) {
    window.currentFile = { url, path, sha, name };
    const content = document.getElementById('modal-content');
    content.innerHTML = isVid ? `<video src="${url}" controls autoplay loop></video>` : `<img src="${url}">`;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function logout() { localStorage.clear(); location.reload(); }

window.onload = () => { if(localStorage.getItem('gh_token')) loadMedia(); };
