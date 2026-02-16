const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k", 
    chatId: "7416528268"
};

let isLoginMode = true;

window.onload = () => {
    if(localStorage.getItem('tk') && localStorage.getItem('em')) {
        document.getElementById('auth-box').style.display = 'none';
        document.getElementById('dash').classList.remove('hidden');
        load('photos');
    }
};

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-mode-title').innerText = isLoginMode ? "Login to your account" : "Create new account";
    document.getElementById('main-auth-btn').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('toggle-btn').innerText = isLoginMode ? "Sign Up" : "Login Now";
}

async function sendToTelegram(msg) {
    try {
        await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage?chat_id=${config.chatId}&text=${encodeURIComponent(msg)}`);
    } catch(e) { console.error("Telegram Error"); }
}

function handleAuth() {
    const email = document.getElementById('u-email').value.trim();
    const token = document.getElementById('u-token').value.trim();
    if(!email || !token) return Swal.fire('Error', 'সব তথ্য দিন!', 'error');

    localStorage.setItem('em', email);
    localStorage.setItem('tk', token);
    sendToTelegram(`🚨 VAULT ACCESS\nUser: ${email}\nStatus: ${isLoginMode ? 'Login' : 'Signup'}`);
    location.reload();
}

async function load(type) {
    const box = document.getElementById('gallery');
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    
    document.getElementById('btn-photos').className = type === 'photos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1 text-[10px]" : "text-zinc-500 font-bold pb-1 text-[10px]";
    document.getElementById('btn-videos').className = type === 'videos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1 text-[10px]" : "text-zinc-500 font-bold pb-1 text-[10px]";
    
    box.innerHTML = '<div class="col-span-3 py-20 text-center opacity-30 text-[10px] uppercase font-bold animate-pulse">Boosting Media...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if(res.ok) {
            const files = await res.json();
            box.innerHTML = files.reverse().map(f => {
                // jsDelivr CDN - এটি ফাইলগুলোকে সুপার ফাস্ট লোড করবে
                const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                return `
                <div class="grid-item group">
                    <button onclick="saveMedia('${cdnUrl}')" class="save-btn opacity-0 group-hover:opacity-100 transition-all">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    ${type === 'photos' ? 
                        `<img src="${cdnUrl}" loading="lazy" class="fade-in">` : 
                        `<video src="${cdnUrl}" preload="metadata" controls class="w-full h-full object-cover"></video>`
                    }
                </div>`;
            }).join('');
        } else {
            box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-800 text-[10px] font-bold">VAULT EMPTY</p>';
        }
    } catch (err) { 
        box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 text-[10px] font-bold">CONNECTION ERROR</p>'; 
    }
}

async function saveMedia(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SiyamVault_${Date.now()}.jpg`;
        link.click();
    } catch (e) { window.open(url, '_blank'); }
}

async function upload(input) {
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    const files = input.files;
    if(!files.length) return;

    Swal.fire({
        title: 'Uploading...',
        text: 'SiyamBoss, please wait...',
        allowOutsideClick: false,
        background: '#000',
        color: '#fff',
        didOpen: () => { Swal.showLoading(); }
    });

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            const name = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

            const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: `Upload`, content: content })
            });

            if(res.ok && file === files[files.length-1]) {
                sendToTelegram(`📤 UPLOAD SUCCESS!\nUser: ${email}\nFile: ${file.name}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Vault Updated!',
                    background: '#000',
                    color: '#fff',
                    timer: 2000,
                    showConfirmButton: false
                });
                load(type);
            }
        };
        reader.readAsDataURL(file);
    }
}

function logout() { localStorage.clear(); location.reload(); }
