const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT",
    botToken: "8536299808:AAHJFWEna66RMHZdq-AV20Ak1KOOSwTJT9k",
    chatId: "7416528268"
};

let currentTab = 'photos';
let scene, camera, renderer, carousel;

// টেলিগ্রাম নোটিফিকেশন
async function sendNotify(msg) {
    try {
        await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage?chat_id=${config.chatId}&text=${encodeURIComponent(msg)}`);
    } catch(e) {}
}

// ৩ডি ইঞ্জিন (Optimized)
function init3D(urls) {
    const container = document.getElementById('three-container');
    if(!container || urls.length === 0) return;
    
    if(!renderer) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
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
    urls.slice(0, 10).forEach((url, i) => {
        loader.load(url, (tex) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
            const angle = (i / 10) * Math.PI * 2;
            mesh.position.set(Math.cos(angle)*8, 0, Math.sin(angle)*8);
            mesh.lookAt(0,0,0);
            carousel.add(mesh);
        });
    });
    camera.position.z = 15;
}

// কোর গ্যালারি লোড
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 text-[8px] tracking-[1em] animate-pulse">DECRYPTING...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        
        if(res.ok && Array.isArray(data)) {
            const media = data.reverse();
            if(currentTab === 'photos') init3D(media.slice(0,10).map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`));
            
            box.innerHTML = media.map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item" onclick="viewMedia('${url}','${f.sha}','${f.name}','${f.path}')"><${isV?'video':'img'} src="${url}" class="w-full h-full object-cover"></${isV?'video':'img'}></div>`;
            }).join('');
        } else { box.innerHTML = '<p class="col-span-full text-center py-20 opacity-20 text-[10px]">VAULT EMPTY</p>'; }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-20 text-red-500">ERROR</p>'; }
}

async function handleLogin() {
    const em = document.getElementById('u-email').value, tk = document.getElementById('u-token').value;
    if(em && tk) {
        localStorage.setItem('em', em); localStorage.setItem('tk', tk);
        await sendNotify(`🔓 VAULT UNLOCKED\nUser: ${em}\nTime: ${new Date().toLocaleString()}`);
        location.reload();
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

function switchTab(t) {
    currentTab = t;
    document.getElementById('current-tab-title').innerText = t;
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    event.currentTarget.classList.add('active');
    toggleSidebar();
    loadGallery();
}

function viewMedia(url, sha, name, path) {
    const modal = document.getElementById('media-modal');
    modal.classList.remove('hidden');
    const isV = url.endsWith('.mp4');
    document.getElementById('modal-content').innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full rounded-2xl"></video>` : `<img src="${url}" class="w-full rounded-2xl shadow-2xl">`;
    
    document.getElementById('save-btn').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); };
    document.getElementById('trash-btn').onclick = async () => {
        if(confirm("Move to Trash?")) {
            await sendNotify(`🗑️ TRASHED: ${name}\nUser: ${localStorage.getItem('em')}`);
            // Trash Logic here (Moving file via GitHub API)
            closeModal(); loadGallery();
        }
    };
}

function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }

if(localStorage.getItem('tk')) {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}
