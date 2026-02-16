const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k", 
    chatId: "7416528268"
};

let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Welcome Back" : "Create Account";
    document.getElementById('signup-fields').classList.toggle('hidden', isLoginMode);
    document.getElementById('main-auth-btn').innerText = isLoginMode ? "Login" : "Register";
}

async function handleAuth() {
    const email = document.getElementById('u-email').value.trim();
    const pass = document.getElementById('u-pass').value.trim();
    
    if (isLoginMode) {
        if (email === localStorage.getItem('em') && pass === localStorage.getItem('upass')) {
            showDashboard();
        } else {
            Swal.fire('Denied', 'ভুল জিমেইল অথবা পাসওয়ার্ড! আগে সাইন-আপ করুন।', 'error');
        }
    } else {
        const name = document.getElementById('u-name').value.trim();
        const phone = document.getElementById('u-phone').value.trim();
        if(!email || !pass || !name) return Swal.fire('Error', 'সব তথ্য দিন', 'warning');
        localStorage.setItem('em', email);
        localStorage.setItem('upass', pass);
        localStorage.setItem('u_name', name);
        localStorage.setItem('u_phone', phone);
        showDashboard();
    }
}

async function getVaultToken() {
    let token = sessionStorage.getItem('v_tk');
    if (!token) {
        const { value: tk } = await Swal.fire({
            title: 'Vault Locked 🔒',
            input: 'password',
            inputLabel: 'গ্যালারি আনলক করতে GitHub Token দিন',
            confirmButtonColor: '#10b981',
            showCancelButton: true
        });
        if (tk) { sessionStorage.setItem('v_tk', tk); return tk; }
        return null;
    }
    return token;
}

async function load(type) {
    const token = await getVaultToken();
    if (!token) return;

    const box = document.getElementById('gallery');
    const email = localStorage.getItem('em');
    box.innerHTML = '<div class="col-span-3 py-20 text-center animate-pulse text-zinc-600">Syncing Vault...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        if (res.ok) {
            const files = await res.json();
            document.getElementById('file-count').innerText = `${files.length} Items`;
            document.getElementById('storage-bar').style.width = Math.min(files.length * 5, 100) + '%';
            box.innerHTML = files.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                return `<div class="aspect-square bg-zinc-900 border border-white/5 overflow-hidden">
                    ${type === 'photos' ? `<img src="${url}" class="w-full h-full object-cover">` : `<video src="${url}" class="w-full h-full object-cover"></video>`}
                </div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-3 text-center py-20 opacity-30 uppercase text-xs">No Media Found</p>'; }
    } catch (e) { Swal.fire('Token Error', 'আপনার টোকেনটি সঠিক নয়।', 'error'); sessionStorage.removeItem('v_tk'); }
}

async function adminPrompt() {
    const { value: pass } = await Swal.fire({ title: 'Admin Access', input: 'password', confirmButtonColor: '#10b981' });
    if (pass === "SIYAMBOSS77") {
        document.getElementById('admin-panel').classList.remove('hidden');
        fetchAdminData();
    }
}

async function fetchAdminData() {
    const token = await getVaultToken();
    if (!token) return closeAdmin();
    const statsBox = document.getElementById('admin-stats');
    statsBox.innerHTML = '<p class="text-zinc-500 animate-pulse">Scanning Cloud...</p>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const users = await res.json();
        let html = '';
        for (let u of users) {
            if (u.type === 'dir') {
                html += `<div class="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 flex justify-between items-center">
                    <div><h3 class="font-bold text-emerald-400">${u.name}</h3><p class="text-[10px] text-zinc-500 uppercase">User Root</p></div>
                    <div class="text-right text-[10px] text-zinc-400 uppercase font-black">Online</div>
                </div>`;
            }
        }
        statsBox.innerHTML = html;
    } catch (e) { statsBox.innerHTML = 'Error fetching user list.'; }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('user-display').innerText = `${localStorage.getItem('u_name')} | ${localStorage.getItem('em')}`;
    load('photos');
}
function logout() { localStorage.clear(); sessionStorage.clear(); location.reload(); }
function closeAdmin() { document.getElementById('admin-panel').classList.add('hidden'); }
