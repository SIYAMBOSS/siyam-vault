const config = {
    owner: "SIYAMBOSS", // Apnar GitHub Username
    repo: "SIYAM-VAULT", // Apnar Repository Name
};

let currentTab = 'photos';

// --- Login Fix ---
function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    const key = document.getElementById('u-key').value.trim();
    const conf = document.getElementById('u-key-conf').value.trim();

    if(!em || !tk || !key) return Swal.fire('Error', 'Sob ghor puron korun', 'error');
    if(key !== conf) return Swal.fire('Error', 'Password mile nai', 'warning');

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    localStorage.setItem('ukey', key);
    
    location.reload();
}

// --- Load Gallery (Fixed Logic) ---
async function loadGallery() {
    const box = document.getElementById('gallery');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    
    if(!tk || !em) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 animate-pulse tracking-widest">DECRYPTING...</div>';

    // GitHub API URL
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${tk}`, 'Accept': 'application/vnd.github.v3+json' }
        });

        if(res.status === 404) {
            box.innerHTML = `<p class="col-span-full text-center py-20 opacity-30">NO FILES IN ${currentTab.toUpperCase()}<br><span class="text-[8px]">Upload kicu file prothome</span></p>`;
            return;
        }

        if(res.ok) {
            const data = await res.json();
            box.innerHTML = '';
            
            if(data.length === 0) {
                box.innerHTML = `<p class="col-span-full text-center py-20 opacity-30 text-xs">FOLDER IS EMPTY</p>`;
            }

            data.reverse().forEach(f => {
                if(f.type === 'file') {
                    const isV = f.name.toLowerCase().match(/\.(mp4|mov|webm|mkv)$/);
                    box.innerHTML += `
                        <div class="media-item border border-white/5" onclick="viewMedia('${f.download_url}', ${!!isV}, '${f.sha}', '${f.path}')">
                            ${isV ? `<video src="${f.download_url}" class="w-full h-full object-cover"></video>` : `<img src="${f.download_url}" loading="lazy" class="w-full h-full object-cover">`}
                        </div>`;
                }
            });
        } else {
            const errData = await res.json();
            box.innerHTML = `<p class="col-span-full text-center py-20 text-red-500 text-[10px]">ERROR: ${errData.message}</p>`;
        }
    } catch(e) {
        box.innerHTML = '<p class="col-span-full text-center py-20 text-red-500">NETWORK ERROR</p>';
    }
}

// --- Upload Logic (Auto-Folder Creation) ---
async function handleUpload(input) {
    const files = Array.from(input.files);
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    if(!files.length) return;

    Swal.fire({ title: 'Uploading...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    for(let file of files) {
        const reader = new FileReader();
        const contentPromise = new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const b64 = await contentPromise;
        const folder = file.type.startsWith('video') ? 'videos' : 'photos';
        const name = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${folder}/${name}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "vault upload", content: b64 })
        });
    }
    Swal.fire('Success', 'Vault-e save hoyeche!', 'success').then(() => loadGallery());
}

// --- Baki UI Functions ---
function viewMedia(url, isV, sha, path) {
    Swal.fire({
        html: `
            <div class="relative">
                ${isV ? `<video src="${url}" controls autoplay class="w-full rounded-2xl"></video>` : `<img src="${url}" class="w-full rounded-2xl">`}
                <div class="flex justify-center gap-10 mt-6">
                    <button onclick="Swal.close(); moveFile('${sha}', '${path}', 'favorites')" class="text-3xl text-red-500"><i class="fa-solid fa-heart"></i></button>
                    <button onclick="Swal.close(); moveFile('${sha}', '${path}', 'trash')" class="text-3xl text-gray-500"><i class="fa-solid fa-trash-can"></i></button>
                    <a href="${url}" download class="text-3xl text-cyan-500"><i class="fa-solid fa-circle-down"></i></a>
                </div>
            </div>`,
        showConfirmButton: false,
        background: '#0b0b1a',
        width: '95%'
    });
}

async function moveFile(sha, path, target) {
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    const fileName = path.split('/').pop();
    Swal.fire({ title: 'Moving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        const fileRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const fileData = await fileRes.json();
        const putRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${target}/${fileName}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: `move to ${target}`, content: fileData.content })
        });
        if(putRes.ok) {
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${tk}` },
                body: JSON.stringify({ message: "delete source", sha: sha })
            });
            loadGallery();
            Swal.fire({ title: 'Success', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    } catch(e) { Swal.fire('Error', 'Kicu akta somossa hoyeche', 'error'); }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function togglePass(id, icon) {
    const input = document.getElementById(id);
    if (input.type === "password") { input.type = "text"; icon.classList.replace("fa-eye", "fa-eye-slash"); } 
    else { input.type = "password"; icon.classList.replace("fa-eye-slash", "fa-eye"); }
}

function switchTab(t) {
    currentTab = t;
    document.getElementById('current-tab-title').innerText = t.toUpperCase();
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    try { document.getElementById(`btn-${t}`).classList.add('active'); } catch(e){}
    if(!document.getElementById('sidebar').classList.contains('-translate-x-full')) toggleSidebar();
    loadGallery();
}

function logout() { localStorage.clear(); location.reload(); }

window.onload = () => {
    if(localStorage.getItem('tk')) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('dash').classList.remove('hidden');
        document.getElementById('upload-fab').classList.remove('hidden');
        loadGallery();
    }
};
