const config = {
    owner: "SIYAMBOSS",
    repo: "siyam-vault", // আপনার রিপোজিটরি নাম ঠিক এটাই
};

let currentTab = 'photos';

// --- Login Logic ---
function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    const key = document.getElementById('u-key').value.trim();

    if(!em || !tk || !key) return Swal.fire('Error', 'সবগুলো ঘর পূরণ করুন', 'error');

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    localStorage.setItem('ukey', key);
    
    location.reload();
}

// --- Load Gallery (Direct Path Logic) ---
async function loadGallery() {
    const box = document.getElementById('gallery');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    if(!tk || !em) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-30 animate-pulse tracking-widest text-[10px]">ACCESSING CLOUD...</div>';

    // পাথ ফিক্স: সরাসরি vault ফোল্ডারের ভেতর আপনার ইমেইল ফোল্ডার খুঁজবে
    const path = `vault/${em}/${currentTab}`;
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

    try {
        const response = await fetch(url, {
            headers: { 
                'Authorization': `token ${tk}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            box.innerHTML = `<div class="col-span-full py-20 text-center"><p class="opacity-20 text-[9px] uppercase tracking-tighter">No data in ${currentTab}</p><p class="text-[8px] text-cyan-500 mt-2 uppercase">একটি ফাইল আপলোড করে ট্রাই করুন</p></div>`;
            return;
        }

        const files = await response.json();
        
        if (!Array.isArray(files)) throw new Error("Not a folder");

        box.innerHTML = '';
        files.reverse().forEach(file => {
            const isVideo = file.name.match(/\.(mp4|mov|webm)$/i);
            box.innerHTML += `
                <div class="media-item bg-white/5 border border-white/5 rounded-lg overflow-hidden" onclick="viewMedia('${file.download_url}', ${!!isVideo})">
                    ${isVideo ? 
                        `<video src="${file.download_url}" class="w-full h-full object-cover"></video>` : 
                        `<img src="${file.download_url}" loading="lazy" class="w-full h-full object-cover">`
                    }
                </div>`;
        });

    } catch (err) {
        box.innerHTML = `<div class="col-span-full py-20 text-center text-red-500 text-[9px] uppercase">Connection Failed: ${err.message}</div>`;
    }
}

// --- Upload Fix (Force Folder Creation) ---
async function handleUpload(input) {
    const files = Array.from(input.files);
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    if(!files.length) return;

    Swal.fire({ title: 'Securing...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    for(let file of files) {
        const base64 = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const folder = file.type.startsWith('video') ? 'videos' : 'photos';
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const uploadUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${folder}/${fileName}`;

        await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "vault update", content: base64 })
        });
    }
    Swal.fire('Success', 'ফাইল ভল্টে সেভ হয়েছে', 'success').then(() => loadGallery());
}

// Sidebar & Tabs
function switchTab(t) {
    currentTab = t;
    document.getElementById('current-tab-title').innerText = t.toUpperCase();
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    loadGallery();
    toggleSidebar();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function logout() { localStorage.clear(); location.reload(); }

window.onload = () => {
    if(localStorage.getItem('tk')) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('dash').classList.remove('hidden');
        document.getElementById('upload-fab').classList.remove('hidden');
        loadGallery();
    }
};
