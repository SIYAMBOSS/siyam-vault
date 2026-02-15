// --- CONFIG ---
const GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"; // Apnar Token Boshan
const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT";

let wakeLock = null;
let fileToDelete = null;

window.onload = () => {
    checkBannerStatus();
    if (localStorage.getItem('activeUser')) showDashboard();
};

// 1. Permanent Banner Logic (Global)
async function checkBannerStatus() {
    const bannerImg = document.getElementById('fixed-banner');
    const placeholder = document.getElementById('banner-placeholder');
    const setupArea = document.getElementById('admin-setup-area');
    const bannerUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/permanent_banner.jpg`;
    
    try {
        const res = await fetch(bannerUrl);
        if (res.ok) {
            bannerImg.src = bannerUrl + "?v=" + Date.now();
            bannerImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
            setupArea.classList.add('hidden');
        }
    } catch (e) { console.log("No banner set"); }
}

async function setupBanner(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result.split(',')[1];
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/permanent_banner.jpg`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Set Banner", content: content })
        });
        if (res.ok) location.reload();
    };
    reader.readAsDataURL(file);
}

// 2. Upload with Progress & WakeLock
async function uploadFiles(event) {
    const files = event.target.files;
    const email = localStorage.getItem('activeUser');
    if (!files.length) return;

    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-bar');
    const statusText = document.getElementById('upload-status-text');

    progressContainer.classList.remove('hidden');
    let total = files.length, current = 0;

    for (let file of files) {
        await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result.split(',')[1];
                const type = file.type.startsWith('video') ? 'videos' : 'photos';
                const path = `vault/${email}/${type}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

                const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
                    body: JSON.stringify({ message: "Upload", content: content })
                });

                if (res.ok) {
                    current++;
                    let percent = (current / total * 100);
                    progressBar.style.width = percent + "%";
                    statusText.innerText = `Uploading: ${Math.round(percent)}%`;
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    if (wakeLock) { wakeLock.release(); wakeLock = null; }
    setTimeout(() => {
        progressContainer.classList.add('hidden');
        switchTab(files[0].type.startsWith('video') ? 'videos' : 'photos');
    }, 1000);
}

// 3. Gallery & Delete Logic
async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    container.innerHTML = `<div class="col-span-3 py-10 text-center opacity-30"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Cache-Control': 'no-cache' }
    });

    if (res.ok) {
        const files = await res.json();
        container.innerHTML = files.reverse().map(f => `
            <div class="relative aspect-square overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800">
                <button class="delete-trigger" onclick="event.stopPropagation(); askDelete('${f.path}', '${f.sha}')">
                    <i class="fa-solid fa-trash-can text-[10px]"></i>
                </button>
                ${type === 'videos' ? 
                    `<video src="${f.download_url}" onclick="openPreview('${f.download_url}', true)"></video>` : 
                    `<img src="${f.download_url}" onclick="openPreview('${f.download_url}', false)">`
                }
            </div>`).join('');
    } else { container.innerHTML = ""; }
}

function askDelete(path, sha) {
    fileToDelete = { path, sha };
    document.getElementById('delete-modal').classList.remove('hidden');
}

async function executeDelete() {
    if (!fileToDelete) return;
    const btn = document.getElementById('confirm-delete-btn');
    btn.innerText = "...";
    
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileToDelete.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Delete", sha: fileToDelete.sha })
    });

    if (res.ok) {
        closeDeleteModal();
        const activeTab = document.getElementById('photos-content').classList.contains('hidden') ? 'videos' : 'photos';
        loadContent(localStorage.getItem('activeUser'), activeTab);
    }
    btn.innerText = "Delete";
}

// 4. Preview & Download
function openPreview(url, isVideo) {
    const box = document.getElementById('preview-content-box');
    document.getElementById('download-btn').onclick = () => downloadMedia(url);
    box.innerHTML = isVideo ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}">`;
    document.getElementById('preview-modal').classList.remove('hidden');
}

async function downloadMedia(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "SIYAM_VAULT_" + Date.now();
    link.click();
}

// Utilities
function switchTab(tab) {
    ['photos', 'videos'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
        document.getElementById(`${t}-content`).classList.toggle('hidden', t !== tab);
    });
    loadContent(localStorage.getItem('activeUser'), tab);
}

function handleAuth() {
    const email = document.getElementById('user-email').value;
    if (email) { localStorage.setItem('activeUser', email); showDashboard(); }
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    switchTab('photos');
}

function toggleAuth() { document.getElementById('reg-fields').classList.toggle('hidden'); }
function closePreview() { document.getElementById('preview-modal').classList.add('hidden'); }
function closeDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
