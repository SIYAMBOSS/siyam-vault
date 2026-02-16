const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
};

let currentTab = 'photos';

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

    if(!em || !tk || !key) return Swal.fire('Error', 'Please fill all fields', 'error');
    if(key !== conf) return Swal.fire('Error', 'Passwords do not match', 'warning');

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    localStorage.setItem('ukey', key);
    
    location.reload();
}

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
        const name = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${folder}/${name}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "upload", content: b64 })
        });
    }
    Swal.fire('Success', 'Files Uploaded!', 'success').then(() => loadGallery());
}

async function loadGallery() {
    const box = document.getElementById('gallery');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    if(!tk || !em) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 animate-pulse tracking-widest">DECRYPTING...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}?v=${Date.now()}`, {
            headers: { 'Authorization': `token ${tk}` }
        });

        if(res.ok) {
            const data = await res.json();
            box.innerHTML = '';
            data.reverse().forEach(f => {
                const isV = f.name.toLowerCase().match(/\.(mp4|mov|webm)$/);
                box.innerHTML += `
                    <div class="media-item" onclick="viewMedia('${f.download_url}', ${!!isV}, '${f.sha}', '${f.path}')">
                        ${isV ? `<video src="${f.download_url}" class="w-full h-full object-cover"></video>` : `<img src="${f.download_url}" loading="lazy" class="w-full h-full object-cover">`}
                    </div>`;
            });
        } else {
            box.innerHTML = `<p class="col-span-full text-center py-20 opacity-30 text-xs">NO ITEMS IN ${currentTab.toUpperCase()}</p>`;
        }
    } catch(e) {
        box.innerHTML = '<p class="col-span-full text-center py-20 text-red-500">Connection Error</p>';
    }
}

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
        background: 'rgba(11, 11, 26, 0.98)',
        width: '95%'
    });
}

async function moveFile(sha, path, target) {
    const tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    const fileName = path.split('/').pop();
    
    Swal.fire({ title: 'Moving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

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
        Swal.fire({ title: 'Moved!', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

function switchTab(t) {
    currentTab = t;
    document.getElementById('current-tab-title').innerText = t.toUpperCase();
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`btn-${t}`).classList.add('active');
    toggleSidebar();
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
