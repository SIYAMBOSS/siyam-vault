// --- আপনার সঠিক টোকেন এখানে বসান ---
const GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxx"; 
const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT";

let wakeLock = null;
let fileToDelete = null;

// পেজ লোড হলে চেক করা
window.onload = () => {
    checkBannerStatus();
    const activeUser = localStorage.getItem('activeUser');
    if (activeUser) {
        showDashboard();
    }
};

// ১. ব্যানার স্ট্যাটাস চেক
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
    } catch (e) { console.log("Banner not found"); }
}

// ২. ব্যানার আপলোড করা
async function setupBanner(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result.split(',')[1];
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/permanent_banner.jpg`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Update Banner", content: content })
        });
        if (res.ok) {
            alert("Banner updated successfully!");
            location.reload();
        }
    };
    reader.readAsDataURL(file);
}

// ৩. গ্যালারি লোড (Fix: SHA এবং Path হ্যান্ডলিং)
async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    container.innerHTML = `<div class="col-span-3 py-10 text-center opacity-20"><i class="fa-solid fa-spinner fa-spin"></i></div>`;

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Cache-Control': 'no-cache' }
        });

        if (res.ok) {
            const files = await res.json();
            if(files.length === 0) {
                container.innerHTML = `<p class="col-span-3 text-center py-20 text-zinc-700 text-[10px] font-bold">VAULT IS EMPTY</p>`;
                return;
            }

            container.innerHTML = files.reverse().map(f => `
                <div class="relative aspect-square overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800">
                    <button class="delete-trigger" onclick="event.stopPropagation(); askDelete('${f.path}', '${f.sha}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ${type === 'videos' ? 
                        `<video src="${f.download_url}" onclick="openPreview('${f.download_url}', true)"></video>` : 
                        `<img src="${f.download_url}" onclick="openPreview('${f.download_url}', false)" loading="lazy">`
                    }
                </div>`).join('');
        } else {
            container.innerHTML = `<p class="col-span-3 text-center py-20 text-red-500/20 text-[8px]">CONNECTION ERROR</p>`;
        }
    } catch (e) { console.error(e); }
}

// ৪. আপলোড লজিক (Background Support)
async function uploadFiles(event) {
    const files = event.target.files;
    const email = localStorage.getItem('activeUser');
    if (!files.length || !email) return;

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
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Upload", content: content })
                });

                if (res.ok) {
                    current++;
                    let percent = (current / total * 100);
                    progressBar.style.width = percent + "%";
                    statusText.innerText = `UPLOADING: ${Math.round(percent)}%`;
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

// ৫. ডিলিট লজিক
function askDelete(path, sha) {
    fileToDelete = { path, sha };
    document.getElementById('delete-modal').classList.remove('hidden');
}

async function executeDelete() {
    if (!fileToDelete) return;
    const btn = document.getElementById('confirm-delete-btn');
    btn.innerText = "...";
    
    try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileToDelete.path}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Delete file", sha: fileToDelete.sha })
        });

        if (res.ok) {
            closeDeleteModal();
            const activeTab = document.getElementById('photos-content').classList.contains('hidden') ? 'videos' : 'photos';
            loadContent(localStorage.getItem('activeUser'), activeTab);
        }
    } catch (e) { alert("Delete failed!"); }
    btn.innerText = "Delete";
}

// প্রিভিউ এবং ডাউনলোড
function openPreview(url, isVideo) {
    const box = document.getElementById('preview-content-box');
    document.getElementById('download-btn').onclick = () => downloadMedia(url);
    box.innerHTML = isVideo ? `<video src="${url}" controls autoplay class="max-h-full"></video>` : `<img src="${url}" class="max-h-full">`;
    document.getElementById('preview-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function downloadMedia(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "SIYAM_VAULT_" + Date.now();
    link.click();
}

// সুইচ ট্যাব
function switchTab(tab) {
    const tabs = ['photos', 'videos'];
    tabs.forEach(t => {
        document.getElementById(`${t}-content`).classList.toggle('hidden', t !== tab);
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
    });
    const email = localStorage.getItem('activeUser');
    if(email) loadContent(email, tab);
}

// অথেনটিকেশন
function handleAuth() {
    const email = document.getElementById('user-email').value;
    if (email) {
        localStorage.setItem('activeUser', email);
        showDashboard();
    }
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    switchTab('photos');
}

function toggleAuth() { document.getElementById('reg-fields').classList.toggle('hidden'); }
function closePreview() { document.getElementById('preview-modal').classList.add('hidden'); document.body.style.overflow = 'auto'; }
function closeDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
