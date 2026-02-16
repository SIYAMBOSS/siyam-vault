let scene, camera, renderer;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';

// --- UI Helpers ---
function openMenu() { 
    document.getElementById('sidebar').style.transform = 'translateX(0)'; 
    document.getElementById('sidebar-overlay').classList.remove('hidden');
}
function closeMenu() { 
    document.getElementById('sidebar').style.transform = 'translateX(-100%)'; 
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

// --- Login & Auth ---
function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    if(em && tk) { localStorage.setItem('em', em); localStorage.setItem('tk', tk); showDashboard(); }
}
function logout() { localStorage.clear(); location.reload(); }

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('upload-fab').classList.remove('hidden');
    loadGallery();
}

// --- Gallery Logic ---
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    const counter = document.getElementById('file-counter');
    box.innerHTML = '<div class="col-span-full py-40 text-center opacity-20 text-[10px] tracking-[1em] animate-pulse">SYNCING...</div>';
    
    try {
        const path = currentTab === 'photos' ? `vault/${em}/photos` : `vault/${em}/${currentTab}`;
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const data = await res.json();
        
        if(res.ok && Array.isArray(data)) {
            const pics = data.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i));
            counter.innerText = `${pics.length} Files in ${currentTab}`;

            box.innerHTML = data.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                const isV = f.name.endsWith('.mp4');
                return `<div class="media-item overflow-hidden rounded-xl border border-white/5 active:scale-95 transition-all" onclick="fullScreen('${url}', '${f.sha}', ${isV})">
                    <${isV?'video':'img'} src="${url}" class="w-full aspect-[3/4] object-cover bg-white/5"></${isV?'video':'img'}>
                </div>`;
            }).join('');
            
            if(currentTab === 'photos') checkTimeCapsule(data);
        } else { box.innerHTML = '<p class="col-span-full text-center py-40 opacity-20 uppercase tracking-[1em]">Empty</p>'; }
    } catch(e) { box.innerHTML = '<p class="col-span-full text-center py-40 text-red-500/20">ACCESS ERROR</p>'; }
}

// --- Full Screen Viewer ---
function fullScreen(url, sha, isVideo) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay class="max-w-full"></video>` : `<img src="${url}">`;
    modal.classList.remove('hidden');
}
function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }

// --- Time Capsule ---
function checkTimeCapsule(data) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const memory = data.find(f => {
        const d = new Date(parseInt(f.name.split('_')[0]));
        return d.getDate() === oneYearAgo.getDate() && d.getMonth() === oneYearAgo.getMonth();
    });
    if(memory) {
        document.getElementById('time-capsule-indicator').classList.remove('hidden');
        Swal.fire({ title: 'New Memory!', text: 'You have a photo from 1 year ago!', icon: 'info', background: '#1a0b2e', color: '#fff' });
    }
}

// --- Tabs & SlideShow ---
function switchTab(tab) { currentTab = tab; loadGallery(); }
function startSlideshow() {
    const items = Array.from(document.querySelectorAll('#gallery img, #gallery video'));
    if(!items.length) return;
    let i = 0;
    const interval = setInterval(() => {
        if(i >= items.length || document.getElementById('media-modal').classList.contains('hidden')) { clearInterval(interval); return; }
        fullScreen(items[i].src, '', items[i].tagName === 'VIDEO');
        i++;
    }, 3000);
}

// --- Upload ---
async function handleUpload(input) {
    if(!input.files.length) return;
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    for(let file of input.files) {
        const reader = new FileReader();
        const content = await new Promise(r => { reader.onload = () => r(reader.result.split(',')[1]); reader.readAsDataURL(file); });
        const dir = file.type.includes('video') ? 'videos' : 'photos';
        const name = `${Date.now()}_${file.name}`;
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${dir}/${name}`, {
            method: 'PUT', headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "up", content: content })
        });
    }
    Swal.close(); loadGallery();
}

if(localStorage.getItem('tk')) showDashboard();
