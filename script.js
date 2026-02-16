let scene, camera, renderer, carousel;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';

// ১. ৩ডি সিলিন্ডার (মেমোরি সেভ লজিক)
function init3D(urls) {
    const container = document.getElementById('three-container');
    if (!container || urls.length === 0) return;

    // যদি ক্যানভাস আগে থেকেই থাকে, তবে নতুন করে তৈরি না করে শুধু আপডেট করবে
    if (!renderer) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true }); // Anti-alias false for speed
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setPixelRatio(window.devicePixelRatio > 1 ? 1 : 1); // Limit resolution for speed
        container.appendChild(renderer.domElement);
        
        const animate = () => {
            requestAnimationFrame(animate);
            if(carousel) carousel.rotation.y += 0.005;
            renderer.render(scene, camera);
        };
        animate();
    }

    // ক্লিনআপ পুরাতন অবজেক্ট
    if(carousel) scene.remove(carousel);
    carousel = new THREE.Group();
    scene.add(carousel);

    const texLoader = new THREE.TextureLoader();
    const count = Math.min(urls.length, 8); // ফাস্ট করার জন্য মাত্র ৮টি ছবি ৩ডিতে
    const radius = 8;

    urls.slice(0, count).forEach((url, i) => {
        texLoader.load(url, (tex) => {
            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(3.5, 5),
                new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
            );
            const angle = (i / count) * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            mesh.lookAt(0, 0, 0);
            carousel.add(mesh);
        });
    });
    camera.position.set(0, 1, 14);
}

// ২. ড্যাশবোর্ড এবং গ্যালারি লোড
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    const counter = document.getElementById('file-counter');
    
    box.style.opacity = "0.5";

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        
        if(res.ok && Array.isArray(data)) {
            const pics = data.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i));
            const vids = data.filter(f => f.name.endsWith('.mp4'));
            counter.innerText = `${pics.length} PHOTOS • ${vids.length} VIDEOS`;

            // ৩ডি ছবিগুলো লোড করা (Background এ হবে)
            if(currentTab === 'photos' && pics.length > 0) {
                const thumbUrls = pics.slice(0, 8).map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`);
                init3D(thumbUrls);
            }

            box.innerHTML = data.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                if(f.type === 'dir') return `<div onclick="openSubFolder('${f.name}')" class="media-item flex flex-col items-center justify-center cursor-pointer border border-white/5"><i class="fa-solid fa-folder text-3xl text-purple-600 mb-2"></i><span class="text-[9px] font-black uppercase">${f.name}</span></div>`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item shadow-xl border border-white/5"><${isV?'video':'img'} src="${url}" class="w-full h-full object-cover cursor-pointer" onclick="viewMedia('${url}')"></${isV?'video':'img'}></div>`;
            }).join('');
        }
    } catch(e) { console.error("Loading Error:", e); }
    box.style.opacity = "1";
}

// ৩. লগইন এবং ইউটিলিটি
function handleLogin() {
    const em = document.getElementById('u-email').value.trim(), tk = document.getElementById('u-token').value.trim();
    if(em && tk) { localStorage.setItem('em', em); localStorage.setItem('tk', tk); showDashboard(); }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

async function handleUpload(input) {
    if(!input.files.length) return;
    const overlay = document.getElementById('upload-overlay'), bar = document.getElementById('progress-bar');
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
        bar.style.width = ((i+1)/input.files.length)*100+'%';
    }
    overlay.classList.add('hidden');
    loadGallery();
}

function viewMedia(url) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    const isV = url.endsWith('.mp4');
    content.innerHTML = isV ? `<video src="${url}" controls autoplay class="max-w-full max-h-full"></video>` : `<img src="${url}" class="max-w-full max-h-full">`;
}

function switchTab(t) { currentTab = t; document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); loadGallery(); }
function openSubFolder(n) { currentTab = `folders/${n}`; loadGallery(); }
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); document.getElementById('modal-content').innerHTML = ''; }
function logout() { localStorage.clear(); location.reload(); }

if(localStorage.getItem('tk')) showDashboard();
