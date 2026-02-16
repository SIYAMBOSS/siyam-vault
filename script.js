let scene, camera, renderer;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';
let selectedFiles = [];

// ১. লগইন ফাংশন ঠিক করা হলো
async function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    
    if(em && tk) { 
        localStorage.setItem('em', em); 
        localStorage.setItem('tk', tk); 
        showDashboard(); 
    } else {
        Swal.fire({
            title: 'Empty Fields!',
            text: 'Please enter both Email and Token',
            icon: 'warning',
            background: '#1a0b2e',
            color: '#fff',
            confirmButtonColor: '#a855f7'
        });
    }
}

function logout() { localStorage.clear(); location.reload(); }

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

// ২. মাল্টি সিলেকশন লজিক
function handleItemClick(url, sha, el) {
    if(currentTab.includes('folders/')) { viewMedia(url, sha); return; }
    
    const idx = selectedFiles.findIndex(f => f.sha === sha);
    if(idx > -1) {
        selectedFiles.splice(idx, 1);
        el.classList.remove('border-4', 'border-purple-500', 'opacity-50', 'scale-90');
    } else {
        selectedFiles.push({ url, sha });
        el.classList.add('border-4', 'border-purple-500', 'opacity-50', 'scale-90');
    }
    
    document.getElementById('move-btn').classList.toggle('hidden', selectedFiles.length === 0);
}

// ৩. গ্যালারি লোড
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
                if(f.type === 'dir') return `<div onclick="openSubFolder('${f.name}')" class="media-item flex flex-col items-center justify-center bg-white/5 aspect-square rounded-3xl border border-white/10 cursor-pointer shadow-lg"><i class="fa-solid fa-folder text-4xl text-purple-600"></i><span class="text-[9px] mt-2 font-black live-text uppercase">${f.name}</span></div>`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item overflow-hidden rounded-2xl shadow-xl border border-white/5"><${isV?'video':'img'} src="${url}" class="w-full aspect-[3/4] object-cover cursor-pointer bg-white/5" onclick="handleItemClick('${url}','${f.sha}',this)"></${isV?'video':'img'}></div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-full py-40 text-center opacity-20 text-[10px] tracking-widest uppercase live-text">Vault Empty</p>'; }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-40 text-red-500/20 uppercase live-text">Error: Repo Not Ready</p>'; }
}

// ৪. বাকি সব প্রয়োজনীয় ফাংশন
function switchTab(tab) {
    currentTab = tab;
    selectedFiles = [];
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById('folder-action-bar').classList.toggle('hidden', tab !== 'folders');
    loadGallery();
}

function openSubFolder(name) { currentTab = `folders/${name}`; loadGallery(); }

// ৩ডি ক্যালকুলেশন (Cylinder)
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

if(localStorage.getItem('tk')) showDashboard();
