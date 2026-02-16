let scene, camera, renderer, frames = [];
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';

// 3D Interactive Carousel
function init3D(urls) {
    if(scene || urls.length === 0) return;
    scene = new THREE.Scene();
    const container = document.getElementById('three-container');
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    urls.slice(0, 6).forEach((url, i) => {
        loader.load(url, (texture) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2.5, 3.5),
                new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
            );
            const angle = (i / 6) * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
            mesh.lookAt(0, 0, 0);
            scene.add(mesh);
            frames.push(mesh);
        });
    });

    camera.position.z = 8;
    const animate = () => {
        requestAnimationFrame(animate);
        scene.rotation.y += 0.005;
        renderer.render(scene, camera);
    };
    animate();
}

// Media Filter Logic
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    loadGallery();
}

async function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    if(!em || !tk) return Swal.fire('Error', 'Input Missing', 'error');
    localStorage.setItem('em', em); localStorage.setItem('tk', tk);
    showDashboard();
}

async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-20 text-center text-zinc-600 uppercase text-[10px]">Loading Vault...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab === 'photos' ? 'photos' : 'videos'}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const files = await res.json();
        
        if(res.ok) {
            const urls = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|mp4)$/i)).map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`);
            if(currentTab === 'photos') init3D(urls);
            
            box.innerHTML = files.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                if(currentTab === 'videos') return `<video src="${url}" onclick="viewMedia('${url}', '${f.sha}')" class="aspect-square object-cover"></video>`;
                return `<img src="${url}" onclick="viewMedia('${url}', '${f.sha}')" class="aspect-[3/4] object-cover cursor-pointer hover:opacity-80 transition-all">`;
            }).join('');
        }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-20 text-zinc-800 uppercase text-xs tracking-widest italic">Vault Empty</p>'; }
}

// Photo Save Fixing
function viewMedia(url, sha) {
    document.getElementById('media-modal').classList.remove('hidden');
    const content = document.getElementById('modal-content');
    content.innerHTML = url.endsWith('.mp4') ? `<video src="${url}" controls class="max-h-[70vh]"></video>` : `<img src="${url}" class="max-h-[70vh] rounded-xl shadow-2xl">`;
    
    document.getElementById('dl-btn').onclick = async () => {
        // Blob download method (Android/iOS save fix)
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `SIYAM_VAULT_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
    };
    
    // Delete logic ager moto thakbe...
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('three-container').classList.remove('hidden');
    document.getElementById('dash').classList.remove('hidden');
    loadGallery();
}

function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
if(localStorage.getItem('tk')) showDashboard();
