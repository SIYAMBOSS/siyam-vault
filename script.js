const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k",
    chatId: "7416528268"
};

let currentTab = 'photos', scene, camera, renderer, carousel;

// --- Crypto Functions ---
const encrypt = async (data, key) => {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc.encode(key)), 'AES-GCM', false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, enc.encode(data));
    return btoa(String.fromCharCode(...iv) + String.fromCharCode(...new Uint8Array(encrypted)));
};

const decrypt = async (cipher, key) => {
    try {
        const enc = new TextEncoder();
        const bin = atob(cipher);
        const iv = new Uint8Array([...bin].slice(0, 12).map(c => c.charCodeAt(0)));
        const data = new Uint8Array([...bin].slice(12).map(c => c.charCodeAt(0)));
        const cryptoKey = await crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc.encode(key)), 'AES-GCM', false, ['decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);
        return new TextDecoder().decode(decrypted);
    } catch(e) { return null; }
};

// --- Login Fix ---
function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    const key = document.getElementById('u-key').value.trim();
    const conf = document.getElementById('u-key-conf').value.trim();

    if(!em || !tk || !key) {
        return Swal.fire('Error', 'সবগুলো ঘর পূরণ করুন', 'error');
    }
    if(key !== conf) {
        return Swal.fire('Mismatch', 'পাসওয়ার্ড দুটি মেলেনি!', 'warning');
    }

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    localStorage.setItem('ukey', key);
    
    Swal.fire({ title: 'Vault Initialized', icon: 'success', showConfirmButton: false, timer: 1500 });
    setTimeout(() => location.reload(), 1500);
}

// --- Upload Logic ---
async function handleUpload(input) {
    const files = Array.from(input.files);
    const key = localStorage.getItem('ukey');
    if(!files.length || !key) return;

    Swal.fire({ title: 'Securing...', text: 'Encrypting files', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const tasks = files.map(async (file) => {
        const base64 = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result);
            reader.readAsDataURL(file);
        });
        const encryptedBody = await encrypt(base64, key);
        const folder = file.type.startsWith('image') ? 'photos' : 'videos';
        const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.zd`;

        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${localStorage.getItem('em')}/${folder}/${name}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${localStorage.getItem('tk')}` },
            body: JSON.stringify({ message: "SECURE_UPLOAD", content: btoa(encryptedBody) })
        });
    });

    await Promise.all(tasks);
    Swal.fire({ title: 'Secured', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    loadGallery();
}

async function loadGallery() {
    const box = document.getElementById('gallery');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk'), key = localStorage.getItem('ukey');
    if(!tk) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-10 animate-pulse text-[10px] tracking-widest uppercase">Decrypting Archive...</div>';

    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}?v=${Date.now()}`, {
        headers: { 'Authorization': `token ${tk}` }
    });

    if(res.ok) {
        const data = await res.json();
        const items = data.reverse();
        document.getElementById(`c-${currentTab}`).innerText = items.length;
        box.innerHTML = '';
        const urls = [];
        for(let f of items) {
            const fRes = await fetch(f.download_url);
            const plain = await decrypt(atob(await fRes.text()), key);
            if(plain) {
                urls.push(plain);
                const isV = plain.includes('video/mp4');
                box.innerHTML += `<div class="media-item" onclick="viewMedia('${plain}', '${f.sha}', '${f.path}')">
                    <${isV?'video':'img'} src="${plain}" loading="lazy" class="w-full h-full object-cover"></${isV?'video':'img'}>
                </div>`;
            }
        }
        if(currentTab === 'photos') init3D(urls.slice(0,6));
    } else {
        box.innerHTML = '<p class="col-span-full text-center opacity-40 text-xs">No files found or Token error.</p>';
    }
}

// --- UI Controls ---
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
function switchTab(t) { currentTab = t; document.getElementById('current-tab-title').innerText = t; toggleSidebar(); loadGallery(); }
function toggleLove(btn) { btn.classList.toggle('text-red-500'); btn.classList.toggle('scale-125'); if(navigator.vibrate) navigator.vibrate(50); }

function init3D(urls) {
    const container = document.getElementById('three-container');
    if(!container || !urls.length) return;
    if(!renderer) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.offsetWidth/container.offsetHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.domElement);
        const anim = () => { requestAnimationFrame(anim); if(carousel) carousel.rotation.y += 0.005; renderer.render(scene, camera); };
        anim();
    }
    if(carousel) scene.remove(carousel);
    carousel = new THREE.Group(); scene.add(carousel);
    const loader = new THREE.TextureLoader();
    urls.forEach((url, i) => {
        loader.load(url, (tex) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
            const angle = (i / urls.length) * Math.PI * 2;
            mesh.position.set(Math.cos(angle)*7, 0, Math.sin(angle)*7);
            mesh.lookAt(0,0,0); carousel.add(mesh);
        });
    });
    camera.position.z = 13;
}

function viewMedia(url, sha, path) {
    const modal = document.getElementById('media-modal'); modal.classList.remove('hidden');
    const isV = url.includes('video/mp4');
    document.getElementById('modal-content').innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    document.getElementById('trash-btn').onclick = () => deleteFile(sha, path);
    document.getElementById('save-btn').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = 'ZD_Secure'; a.click(); };
}

async function deleteFile(sha, path) {
    const confirm = await Swal.fire({ title: 'Delete Forever?', icon: 'warning', showCancelButton: true });
    if(confirm.isConfirmed) {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${localStorage.getItem('tk')}` },
            body: JSON.stringify({ message: "DELETE", sha: sha })
        });
        if(res.ok) { closeModal(); loadGallery(); }
    }
}

// Check Auth state on boot
if(localStorage.getItem('tk')) {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}
