const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k",
    chatId: "7416528268"
};

let currentTab = 'photos';
let scene, camera, renderer, carousel;

// ৩ডি গ্যালারি - শেষ ৬টি ছবি (No Duplicate)
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
    // শেষ ৬টি ছবি এবং ডুপ্লিকেট ফিল্টার
    const uniqueUrls = [...new Set(urls)].slice(0, 6);
    
    uniqueUrls.forEach((url, i) => {
        loader.load(url, (tex) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
            const angle = (i / uniqueUrls.length) * Math.PI * 2;
            mesh.position.set(Math.cos(angle)*7, 0, Math.sin(angle)*7);
            mesh.lookAt(0,0,0);
            carousel.add(mesh);
        });
    });
    camera.position.z = 13;
}

// গ্যালারি লোড ও কাউন্টার
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-10 text-[8px] animate-pulse">DECRYPTING ARCHIVE...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}?v=${Date.now()}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        
        if(res.ok && Array.isArray(data)) {
            const media = data.reverse();
            document.getElementById(`c-${currentTab}`).innerText = media.length;
            
            if(currentTab === 'photos') {
                const urls = media.map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`);
                init3D(urls);
            }
            
            box.innerHTML = media.map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item fade-in" onclick="viewMedia('${url}','${f.sha}','${f.name}','${f.path}')"><${isV?'video':'img'} src="${url}" class="w-full h-full object-cover"></${isV?'video':'img'}></div>`;
            }).join('');
        }
    } catch(e) { console.error("Load Failed"); }
}

function viewMedia(url, sha, name, path) {
    const modal = document.getElementById('media-modal');
    modal.classList.remove('hidden');
    const isV = url.endsWith('.mp4');
    document.getElementById('modal-content').innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    
    // লাভ বাটন লজিক (সাদা থেকে লাল)
    const favBtn = document.getElementById('fav-btn');
    favBtn.classList.remove('text-red-500'); // Reset to default
    favBtn.onclick = () => {
        favBtn.classList.toggle('text-red-500');
        // Add to Favorites API Logic
    };
    
    document.getElementById('save-btn').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); };
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }

function switchTab(t) {
    currentTab = t;
    document.getElementById('current-tab-title').innerText = t;
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
    toggleSidebar();
    loadGallery();
}
