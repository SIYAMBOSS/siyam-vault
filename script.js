let scene, camera, renderer;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';

// 3D Carousel (Cylinder)
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

// Authentication
function handleLogin() {
    const em = document.getElementById('u-email').value, tk = document.getElementById('u-token').value;
    if(em && tk) { localStorage.setItem('em', em); localStorage.setItem('tk', tk); showDashboard(); }
}

function logout() { localStorage.clear(); location.reload(); }

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

// Tab Switching
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById('folder-action-bar').classList.toggle('hidden', tab !== 'folders');
    loadGallery();
}

// Load Content
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-40 text-center opacity-20 text-[10px] tracking-[1em] animate-pulse">DECRYPTING...</div>';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        if(res.ok && Array.isArray(data)) {
            const media = data.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|mp4)$/i));
            if(currentTab === 'photos' && media.length) init3D(media.map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`));
            
            box.innerHTML = data.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                if(f.type === 'dir') return `<div onclick="openSubFolder('${f.name}')" class="media-item flex flex-col items-center justify-center bg-white/5 aspect-square rounded-3xl border border-white/5 cursor-pointer"><i class="fa-solid fa-folder text-4xl text-purple-500"></i><span class="text-[9px] mt-2 font-bold uppercase">${f.name}</span></div>`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item overflow-hidden rounded-2xl"><${isV?'video':'img'} src="${url}" class="w-full aspect-[3/4] object-cover cursor-pointer bg-white/5" onclick="viewMedia('${url}','${f.sha}')"></${isV?'video':'img'}></div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-full py-40 text-center opacity-20 text-[10px] tracking-widest uppercase">Vault Empty</p>'; }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-40 text-red-500/20">ERROR</p>'; }
}

function openSubFolder(name) { currentTab = `folders/${name}`; loadGallery(); }

// Media Viewer
function viewMedia(url, sha) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => content.classList.remove('scale-95'), 10);
    
    const isV = url.endsWith('.mp4');
    content.innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    
    document.getElementById('dl-btn').onclick = async () => {
        const r = await fetch(url); const b = await r.blob();
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = "SIYAM_FILE.jpg"; a.click();
    };
    
    document.getElementById('del-btn').onclick = async () => {
        const { isConfirmed } = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true, background: '#1a0b2e', color: '#fff' });
        if(isConfirmed) {
            const path = url.split('@main/')[1];
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${localStorage.getItem('tk')}` },
                body: JSON.stringify({ message: "del", sha: sha })
            });
            closeModal(); loadGallery();
        }
    };
}

function closeModal() {
    document.getElementById('media-modal').classList.add('hidden');
    document.getElementById('modal-content').classList.add('scale-95');
}

// Upload & Create Folder
async function createNewFolder() {
    const { value: name } = await Swal.fire({ title: 'Folder Name', input: 'text', background: '#1a0b2e', color: '#fff' });
    if(name) {
        const path = `vault/${localStorage.getItem('em')}/folders/${name}/.keep`;
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'PUT', headers: { 'Authorization': `token ${localStorage.getItem('tk')}` },
            body: JSON.stringify({ message: "folder", content: btoa(" ") })
        });
        loadGallery();
    }
}

async function handleUpload(input) {
    if(!input.files.length) return;
    Swal.fire({ title: 'Uploading...', didOpen: () => Swal.showLoading() });
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    for(let file of input.files) {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const path = `vault/${em}/${currentTab === 'videos' ? 'videos' : 'photos'}/${Date.now()}_${file.name}`;
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
                method: 'PUT', headers: { 'Authorization': `token ${tk}` },
                body: JSON.stringify({ message: "up", content: content })
            });
            if(file === input.files[input.files.length - 1]) location.reload();
        };
    }
}

if(localStorage.getItem('tk')) showDashboard();
