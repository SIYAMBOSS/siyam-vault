let GITHUB_TOKEN = localStorage.getItem('vault_token') || "ghp_xxxxxxxxxxxx"; // আপনার টোকেন এখানে দিন
const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT";

let isRegistering = false;

window.onload = () => {
    checkBannerStatus();
    const user = localStorage.getItem('activeUser');
    if (user) showDashboard();
};

// ১. ব্যানার সিস্টেম (One-time)
function checkBannerStatus() {
    const savedBanner = localStorage.getItem('siyam_permanent_banner');
    const setupArea = document.getElementById('admin-setup-area');
    const bannerImg = document.getElementById('fixed-banner');
    const placeholder = document.getElementById('banner-placeholder');

    if (savedBanner) {
        bannerImg.src = savedBanner;
        bannerImg.classList.remove('hidden');
        placeholder.classList.add('hidden');
        setupArea.innerHTML = ""; 
        setupArea.classList.add('hidden');
    }
}

function setupBanner(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('siyam_permanent_banner', e.target.result);
        checkBannerStatus();
        alert("Banner set permanently!");
    };
    reader.readAsDataURL(file);
}

// ২. অথেনটিকেশন
function toggleAuth() {
    isRegistering = !isRegistering;
    document.getElementById('reg-fields').classList.toggle('hidden');
    document.getElementById('auth-title').innerText = isRegistering ? "CREATE" : "LOGIN";
}

function handleAuth() {
    const email = document.getElementById('user-email').value;
    const pin = document.getElementById('pin-1').value;
    if(email && pin) {
        localStorage.setItem('activeUser', email);
        showDashboard();
    }
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    switchTab('photos');
}

function switchTab(tab) {
    const tabs = ['photos', 'videos'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
        document.getElementById(`${t}-content`).classList.toggle('hidden', t !== tab);
    });
    loadContent(localStorage.getItem('activeUser'), tab);
}

// ৩. আপলোড ও প্রগ্রেস বার (No Spinner)
async function uploadFiles(event) {
    const files = event.target.files;
    const email = localStorage.getItem('activeUser');
    if(!files.length) return;

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-bar');

    progressContainer.classList.remove('hidden');
    let total = files.length;
    let current = 0;

    for (let file of files) {
        await new Promise((resolve) => {
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
                if(res.ok) {
                    current++;
                    progressBar.style.width = (current / total * 100) + "%";
                }
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        progressBar.style.width = "0%";
        switchTab(files[0].type.startsWith('video') ? 'videos' : 'photos');
    }, 1000);
}

// ৪. গ্যালারি লোড
async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    if(res.ok) {
        const files = await res.json();
        container.innerHTML = files.reverse().map(f => `
            <div class="relative aspect-square overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800">
                ${type === 'videos' ? 
                    `<video src="${f.download_url}" onclick="openPreview('${f.download_url}', true)"></video>` : 
                    `<img src="${f.download_url}" onclick="openPreview('${f.download_url}', false)" class="w-full h-full object-cover">`
                }
            </div>`).join('');
    }
}

// ৫. ফিক্সড ডাউনলোড সিস্টেম (Blob Method)
function openPreview(url, isVideo) {
    const modal = document.getElementById('preview-modal');
    const box = document.getElementById('preview-content-box');
    const downloadBtn = document.getElementById('download-btn');
    
    downloadBtn.onclick = () => downloadMedia(url);

    box.innerHTML = isVideo ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}">`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

async function downloadMedia(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = "SIYAM_VAULT_" + Date.now();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function logout() { localStorage.clear(); location.reload(); }
