let scene, camera, renderer, carousel;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';

// ১. ৩ডি সিলিন্ডার গ্যালারি
function init3D(urls) {
    const container = document.getElementById('three-container');
    const loader = document.getElementById('three-loader');
    if(loader) loader.style.display = 'none';

    // ক্লিনআপ আগের ক্যানভাস
    const oldCanvas = container.querySelector('canvas');
    if(oldCanvas) container.removeChild(oldCanvas);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    carousel = new THREE.Group();
    scene.add(carousel);

    const texLoader = new THREE.TextureLoader();
    const radius = 9;
    const count = Math.min(urls.length, 12);

    urls.slice(0, count).forEach((url, i) => {
        texLoader.load(url, (tex) => {
            const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 5.5), mat);
            const angle = (i / count) * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            mesh.lookAt(0, 0, 0);
            carousel.add(mesh);
        });
    });

    camera.position.z = 16;
    camera.position.y = 1;

    function animate() {
        requestAnimationFrame(animate);
        if(carousel) carousel.rotation.y += 0.005;
        renderer.render(scene, camera);
    }
    animate();
}

// ২. টাইম ক্যাপসুল (১ বছর আগের স্মৃতি)
function checkMemory(data) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const day = oneYearAgo.getDate(), month = oneYearAgo.getMonth();

    const mem = data.find(f => {
        const d = new Date(parseInt(f.name.split('_')[0]));
        return d.getDate() === day && d.getMonth() === month;
    });

    if(mem) {
        const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${mem.path}`;
        document.getElementById('memory-content').innerHTML = `<img src="${url}" class="w-full aspect-square object-cover">`;
        document.getElementById('memory-popup').classList.remove('hidden');
    }
}

// ৩. কোর ফাংশনালিটি (লগইন, গ্যালারি, আপলোড)
function handleLogin() {
    const em = document.getElementById('u-email').value, tk = document.getElementById('u-token').value;
    if(em && tk) { localStorage.setItem('em', em); localStorage.setItem('tk', tk); showDashboard(); }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    const counter = document.getElementById('file-counter');
    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-10 text-[8px] tracking-[1em] animate-pulse">LOADING VAULT...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        if(res.ok && Array.isArray(data)) {
            const pics = data.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i));
            const vids = data.filter(f => f.name.endsWith('.mp4'));
            counter.innerText = `${pics.length} PHOTOS • ${vids.length} VIDEOS`;

            if(currentTab === 'photos' && pics.length > 0) {
                init3D(pics.slice(0,10).map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`));
                checkMemory(pics);
            }

            box.innerHTML = data.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                if(f.type === 'dir') return `<div onclick="openSubFolder('${f.name}')" class="media-item flex flex-col items-center justify-center cursor-pointer bg-white/5 border border-white/5"><i class="fa-solid fa-folder text-3xl text-purple-600 mb-2"></i><span class="text-[9px] font-bold uppercase">${f.name}</span></div>`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item shadow-2xl border border-white/5"><${isV?'video':'img'} src="${url}" class="w-full h-full object-cover cursor-pointer" onclick="viewMedia('${url}','${f.sha}')"></${isV?'video':'img'}></div>`;
            }).join('');
        }
    } catch(e) { box.innerHTML = '<div class="col-span-full text-center py-20 opacity-20 text-[10px]">RECONNECTING...</div>'; }
}

async function handleUpload(input) {
    if(!input.files.length) return;
    const overlay = document.getElementById('upload-overlay'), bar = document.getElementById('progress-bar'), txt = document.getElementById('progress-text');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    overlay.classList.remove('hidden');
    
    for(let i=0; i<input.files.length; i++){
        const file = input.files[i];
        const base64 = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result.split(',')[1]); rd.readAsDataURL(file); });
        const dir = file.type.includes('video') ? 'videos' : 'photos';
        const path = `vault/${em}/${dir}/${Date.now()}_${file.name.replace(/\s/g,'_')}`;
        
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'PUT', headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "up", content: base64 })
        });
        
        let p = Math.round(((i+1)/input.files.length)*100);
        bar.style.width = p+'%'; txt.innerText = `${p}% COMPLETED`;
    }
    setTimeout(() => { overlay.classList.add('hidden'); loadGallery(); }, 1000);
}

function viewMedia(url, sha) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    const isV = url.endsWith('.mp4');
    content.innerHTML = isV ? `<video src="${url}" controls autoplay class="w-full"></video>` : `<img src="${url}" class="w-full">`;
    document.getElementById('dl-btn').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = "SIYAM_VAULT.jpg"; a.click(); };
}

function switchTab(t) { currentTab = t; document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); loadGallery(); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
function closeMemory() { document.getElementById('memory-popup').classList.add('hidden'); }

if(localStorage.getItem('tk')) showDashboard();
