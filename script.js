const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
};

let currentTab = 'photos', scene, camera, renderer, carousel;

// --- Helper Functions ---
function togglePass(id, icon) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    const key = document.getElementById('u-key').value.trim();
    const conf = document.getElementById('u-key-conf').value.trim();

    if(!em || !tk || !key) return Swal.fire('Error', 'Fill all fields', 'error');
    if(key !== conf) return Swal.fire('Mismatch', 'Passwords do not match', 'warning');

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    localStorage.setItem('ukey', key);
    
    Swal.fire({ title: 'Vault Ready', icon: 'success', timer: 1000, showConfirmButton: false });
    setTimeout(() => location.reload(), 1000);
}

// --- GitHub Logic ---
async function handleUpload(input) {
    const files = Array.from(input.files);
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    if(!files.length) return;

    Swal.fire({ title: 'Securing...', didOpen: () => Swal.showLoading() });

    for(let file of files) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const folder = file.type.startsWith('video') ? 'videos' : 'photos';
            const name = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${folder}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${tk}` },
                body: JSON.stringify({ message: "upload", content: content })
            });
        };
    }
    setTimeout(() => { Swal.fire('Uploaded', 'Gallery Refreshing', 'success'); loadGallery(); }, 3000);
}

async function moveFile(sha, path, targetTab) {
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    const fileName = path.split('/').pop();
    
    Swal.fire({ title: 'Moving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const fileRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${tk}` }
    });
    const fileData = await fileRes.json();

    const putRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${targetTab}/${fileName}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${tk}` },
        body: JSON.stringify({ message: `move to ${targetTab}`, content: fileData.content })
    });

    if(putRes.ok) {
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "delete source", sha: sha })
        });
        Swal.close();
        loadGallery();
    }
}

async function loadGallery() {
    const box = document.getElementById('gallery');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    if(!tk) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 animate-pulse tracking-[0.5em]">DECRYPTING...</div>';

    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}?v=${Date.now()}`, {
        headers: { 'Authorization': `token ${tk}` }
    });

    if(res.ok) {
        const data = await res.json();
        document.getElementById(`c-${currentTab}`).innerText = data.length;
        box.innerHTML = '';
        data.reverse().forEach(f => {
            const isV = f.name.toLowerCase().match(/\.(mp4|mov|webm)$/);
            box.innerHTML += `
                <div class="media-item" onclick="viewMedia('${f.download_url}', ${!!isV}, '${f.sha}', '${f.path}')">
                    ${isV ? `<video src="${f.download_url}" class="w-full h-full object-cover"></video>` : `<img src="${f.download_url}" loading="lazy" class="w-full h-full object-cover">`}
                </div>`;
        });
    } else {
        box.innerHTML = `<p class="col-span-full text-center py-20 opacity-30 text-xs uppercase tracking-widest">No Items in ${currentTab}</p>`;
    }
}

function viewMedia(url, isV, sha, path) {
    Swal.fire({
        html: `
            <div class="relative">
                ${isV ? `<video src="${url}" controls autoplay class="w-full rounded-2xl"></video>` : `<img src="${url}" class="w-full rounded-2xl">`}
                <div class="flex justify-center gap-10 mt-6">
                    <button onclick="moveFile('${sha}', '${path}', 'favorites')" class="text-3xl text-red-500 active:scale-125 transition-transform"><i class="fa-solid fa-heart"></i></button>
                    <button onclick="moveFile('${sha}', '${path}', 'trash')" class="text-3xl text-gray-500 active:scale-125 transition-transform"><i class="fa-solid fa-trash-can"></i></button>
                    <a href="${url}" download class="text-3xl text-cyan-500 active:scale-125 transition-transform"><i class="fa-solid fa-circle-down"></i></a>
                </div>
            </div>`,
        showConfirmButton: false,
        background: 'rgba(11, 11, 26, 0.98)',
        width: '95%'
    });
}

// --- UI Logic ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function switchTab(t) { currentTab = t; document.getElementById('current-tab-title').innerText = t.toUpperCase(); toggleSidebar(); loadGallery(); }
function logout() { localStorage.clear(); location.reload(); }

window.onload = () => {
    if(localStorage.getItem('tk')) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('dash').classList.remove('hidden');
        document.getElementById('upload-fab').classList.remove('hidden');
        loadGallery();
    }
};
