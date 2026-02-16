const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k", 
    chatId: "7416528268"
};

let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Welcome Back" : "Sign Up";
    document.getElementById('auth-sub').innerText = isLoginMode ? "Sign in to continue" : "Create your vault account";
    document.getElementById('main-auth-btn').innerText = isLoginMode ? "Login" : "Register";
    document.getElementById('toggle-btn').innerText = isLoginMode ? "Sign Up" : "Login Now";
    document.getElementById('toggle-text').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
    document.getElementById('signup-fields').classList.toggle('hidden', isLoginMode);
    document.getElementById('u-token-confirm').classList.toggle('hidden', isLoginMode);
}

async function handleAuth() {
    const name = document.getElementById('u-name').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const email = document.getElementById('u-email').value.trim();
    const token = document.getElementById('u-token').value.trim();
    const confirmToken = document.getElementById('u-token-confirm').value.trim();

    if (isLoginMode) {
        if (!email || !token) return Swal.fire('Error', 'সবগুলো ঘর পূরণ করুন!', 'error');
        if (email !== localStorage.getItem('em') || token !== localStorage.getItem('tk')) {
            return Swal.fire('Denied', 'ভুল জিমেইল অথবা টোকেন!', 'error');
        }
    } else {
        if (!name || !phone || !email || !token || !confirmToken) return Swal.fire('Error', 'সব তথ্য দিন!', 'error');
        if (token !== confirmToken) return Swal.fire('Mismatch', 'টোকেন দুটি মেলেনি!', 'warning');
        localStorage.setItem('em', email);
        localStorage.setItem('tk', token);
        localStorage.setItem('u_name', name);
    }

    fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage?chat_id=${config.chatId}&text=${encodeURIComponent(`🚀 VAULT ACTIVITY\nUser: ${email}\nAction: ${isLoginMode ? 'Login' : 'Signup'}`)}`);
    location.reload();
}

window.onload = () => {
    if(localStorage.getItem('tk') && localStorage.getItem('em')) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('dash').classList.remove('hidden');
        document.body.style.backgroundColor = "#000";
        load('photos');
    }
};

async function load(type) {
    const box = document.getElementById('gallery');
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    
    document.getElementById('btn-photos').className = type === 'photos' ? "text-emerald-500 font-bold border-b-2 border-emerald-500 pb-1 text-[10px]" : "text-zinc-500 font-bold pb-1 text-[10px]";
    document.getElementById('btn-videos').className = type === 'videos' ? "text-emerald-500 font-bold border-b-2 border-emerald-500 pb-1 text-[10px]" : "text-zinc-500 font-bold pb-1 text-[10px]";
    
    box.innerHTML = '<div class="col-span-3 py-20 text-center opacity-20 text-[10px] uppercase font-black animate-pulse text-white">Loading Media...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if(res.ok) {
            const files = await res.json();
            box.innerHTML = files.reverse().map(f => {
                const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                return `<div class="grid-item">
                    <button onclick="window.open('${cdnUrl}', '_blank')" class="save-btn"><i class="fa-solid fa-download text-[10px]"></i></button>
                    ${type === 'photos' ? `<img src="${cdnUrl}" loading="lazy">` : `<video src="${cdnUrl}" controls></video>`}
                </div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-800 text-[10px]">EMPTY</p>'; }
    } catch (e) { box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 text-[10px]">OFFLINE</p>'; }
}

async function upload(input) {
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    const files = input.files;
    if(!files.length) return;
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: 'upload', content: content })
            });
            if(file === files[files.length-1]) { Swal.close(); load(type); }
        };
        reader.readAsDataURL(file);
    }
}
function logout() { localStorage.clear(); location.reload(); }
