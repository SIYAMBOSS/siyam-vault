const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k",
    chatId: "7416528268"
};

let currentTab = 'photos', scene, camera, renderer, carousel;

// GitHub CDN (jsDelivr)
const getCDN = (path) => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${path}`;

// ৩ডি গ্যালারি (Last 6 Pics)
function init3D(urls) {
    const container = document.getElementById('three-container');
    if(!container || urls.length === 0) return;
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
    carousel = new THREE.Group();
    scene.add(carousel);
    const loader = new THREE.TextureLoader();
    [...new Set(urls)].slice(0, 6).forEach((url, i) => {
        loader.load(url, (tex) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
            const angle = (i / 6) * Math.PI * 2;
            mesh.position.set(Math.cos(angle)*7, 0, Math.sin(angle)*7);
            mesh.lookAt(0,0,0); carousel.add(mesh);
        });
    });
    camera.position.z = 13;
}

// Parallel Upload (Unlimited)
async function handleUpload(input) {
    const files = Array.from(input.files);
    if (!files.length) return;
    Swal.fire({ title: 'Engine Processing', text: 'Parallel Upload in Progress...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});

    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const tasks = files.map(async (file) => {
        const content = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        const type = file.type.startsWith('image') ? 'photos' : 'videos';
        const name = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        return fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${type}/${name}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "Parallel Upload", content: content })
        });
    });

    const res = await Promise.all(tasks);
    Swal.fire('Vault Secured', `${res.filter(r => r.ok).length} files stored.`, 'success');
    loadGallery();
    fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage?chat_id=${config.chatId}&text=${encodeURIComponent(`🚀 SIYAMBOSS UPLOAD\nFiles: ${files.length}`)}`);
}

// Load Gallery with CDN & Counter
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-10 animate-pulse text-[10px]">SYNCING...</div>';

    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}?v=${Date.now()}`, {
        headers: { 'Authorization': `token ${tk}` }
    });

    if(res.ok) {
        const data = await res.json();
        const media = data.reverse();
        document.getElementById(`c-${currentTab}`).innerText = media.length;
        if(currentTab === 'photos') init3D(media.map(f => getCDN(f.path)));
        box.innerHTML = media.map(f => {
            const url = getCDN(f.path);
            const isV = f.name.endsWith('.mp4');
            return `<div class="media-item" onclick="viewMedia('${url}')"><${isV?'video':'img'} src="${url}" loading="lazy" class="w-full h-full object-cover"></${isV?'video':'img'}></div>`;
        }).join('');
    }
}

function handleLogin() {
    const em = document.getElementById('u-email').value, tk = document.getElementById('u-token').value;
    if(em && tk) {
        localStorage.setItem('em', em); localStorage.setItem('tk', tk);
        fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage?chat_id=${config.chatId}&text=${encodeURIComponent(`🔓 LOGIN\nUser: ${em}`)}`);
        location.reload();
    }
}

function switchTab(t) { currentTab = t; document.getElementById('current-tab-title').innerText = t; toggleSidebar(); loadGallery(); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }

function viewMedia(url) {
    const modal = document.getElementById('media-modal');
    modal.classList.remove('hidden');
    const isV = url.endsWith('.mp4');
    document.getElementById('modal-content').innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    const fb = document.getElementById('fav-btn'); fb.classList.remove('text-red-500');
    fb.onclick = () => fb.classList.toggle('text-red-500');
    document.getElementById('save-btn').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = 'ZeroDay_File'; a.click(); };
}

if(localStorage.getItem('tk')) {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}
