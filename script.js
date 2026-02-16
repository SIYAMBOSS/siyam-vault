let scene, camera, renderer, frames = [];
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';
let selectedFiles = [];

// Logout
function logout() {
    localStorage.clear();
    location.reload();
}

// Upload Logic
async function handleUpload(input) {
    if(!input.files.length) return;
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    for(let file of input.files) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const name = Date.now() + "_" + file.name.replace(/\s/g, '_');
            const targetPath = `vault/${em}/${currentTab === 'videos' ? 'videos' : 'photos'}/${name}`;

            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${targetPath}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${tk}` },
                body: JSON.stringify({ message: "upload", content: content })
            });
            if(file === input.files[input.files.length - 1]) location.reload();
        };
    }
}

// 3D & Other logic (Previous Logic Integrated)
function init3D(urls) {
    const container = document.getElementById('three-container');
    if(!urls.length || container.querySelector('canvas')) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);
    const loader = new THREE.TextureLoader();
    urls.slice(0, 8).forEach((url, i) => {
        loader.load(url, (tex) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
            const angle = (i / 8) * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * 7.5, 0, Math.sin(angle) * 7.5);
            mesh.lookAt(0, 0, 0);
            scene.add(mesh);
        });
    });
    camera.position.set(0, 2, 13);
    const animate = () => { requestAnimationFrame(animate); scene.rotation.y += 0.005; renderer.render(scene, camera); };
    animate();
}

async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 text-[10px] tracking-[1em] animate-pulse">DECRYPTING...</div>';
    
    let path = `vault/${em}/${currentTab}`;
    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const files = await res.json();
        
        if(res.ok && Array.isArray(files)) {
            const media = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|mp4)$/i));
            if(currentTab === 'photos' && media.length) init3D(media.map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`));
            
            box.innerHTML = files.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                if(f.type === 'dir') return `<div onclick="switchTab('folders/${f.name}')" class="flex flex-col items-center justify-center bg-white/5 aspect-square rounded-2xl border border-white/10"><i class="fa-solid fa-folder text-4xl text-purple-500 mb-2"></i><span class="text-[9px] font-bold uppercase">${f.name}</span></div>`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="relative"><${isV?'video':'img'} src="${url}" class="media-item aspect-[3/4] object-cover bg-white/5 cursor-pointer rounded-lg" onclick="handleItemClick('${url}','${f.sha}',this)"></${isV?'video':'img'}></div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-full text-center py-20 opacity-20 text-[10px] tracking-widest uppercase">Vault Empty</p>'; }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-20 text-red-500/20 uppercase text-[10px]">Error</p>'; }
}

function handleItemClick(url, sha, el) {
    if(currentTab.includes('folders/')) { viewMedia(url, sha); return; }
    const idx = selectedFiles.findIndex(f => f.sha === sha);
    if(idx > -1) { selectedFiles.splice(idx,1); el.classList.remove('selected-item'); }
    else { selectedFiles.push({url, sha}); el.classList.add('selected-item'); }
    document.getElementById('move-btn').classList.toggle('hidden', !selectedFiles.length);
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if(document.getElementById(`tab-${tab}`)) document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById('folder-tools').classList.toggle('hidden', tab !== 'folders');
    document.getElementById('upload-fab').classList.toggle('hidden', tab === 'folders');
    selectedFiles = [];
    document.getElementById('move-btn').classList.add('hidden');
    loadGallery();
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

function handleLogin() {
    const em = document.getElementById('u-email').value, tk = document.getElementById('u-token').value;
    if(em && tk) { localStorage.setItem('em', em); localStorage.setItem('tk', tk); showDashboard(); }
}

async function viewMedia(url, sha) {
    document.getElementById('media-modal').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    content.innerHTML = url.endsWith('.mp4') ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    document.getElementById('dl-btn').onclick = async () => { const r = await fetch(url); const b = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = "SIYAM_VAULT.jpg"; a.click(); };
}

function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
if(localStorage.getItem('tk')) showDashboard();
