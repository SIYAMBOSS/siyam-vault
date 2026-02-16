const config = { owner: "SIYAMBOSS", repo: "siyam-vault" };
let currentTab = 'photos';

function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    if(em && tk) {
        localStorage.setItem('em', em);
        localStorage.setItem('tk', tk);
        location.reload();
    }
}

async function loadGallery() {
    const box = document.getElementById('gallery'), carousel = document.getElementById('carousel-3d');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    if(!tk || !em) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-20 animate-pulse text-xs">LOADING...</div>';

    const path = `vault/${em}/${currentTab}`;
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `token ${tk}` } });
        if (res.ok) {
            const data = await res.json();
            const items = data.reverse();
            
            // 3D Carousel (Last 6 Photos)
            carousel.innerHTML = '';
            const photos = items.filter(f => !f.name.match(/\.(mp4|mov|webm)$/i)).slice(0, 6);
            photos.forEach((f, i) => {
                carousel.innerHTML += `<img src="${f.download_url}" style="--i:${i+1}" class="carousel-item">`;
            });

            // Gallery
            box.innerHTML = '';
            items.forEach(f => {
                const isV = f.name.match(/\.(mp4|mov|webm)$/i);
                box.innerHTML += `
                    <div class="media-item" onclick="viewMedia('${f.download_url}', ${!!isV})">
                        ${isV ? `<video src="${f.download_url}" class="w-full h-full object-cover"></video>` : `<img src="${f.download_url}" class="w-full h-full object-cover" loading="lazy">`}
                    </div>`;
            });
        } else {
            box.innerHTML = `<p class="col-span-full text-center py-20 opacity-20 text-[10px]">EMPTY FOLDER</p>`;
        }
    } catch (e) { console.error(e); }
}

async function handleUpload(input) {
    const files = Array.from(input.files), tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    if(!files.length) return;
    Swal.fire({ title: 'Uploading...', didOpen: () => Swal.showLoading() });

    for(let file of files) {
        const b64 = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = () => r(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        const folder = file.type.startsWith('video') ? 'videos' : 'photos';
        const name = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${folder}/${name}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "upload", content: b64 })
        });
    }
    Swal.fire('Success', 'File Secured!', 'success').then(() => loadGallery());
}

function switchTab(t) { currentTab = t; document.getElementById('current-tab-title').innerText = t.toUpperCase(); loadGallery(); toggleSidebar(); }
function viewMedia(url, isV) { Swal.fire({ html: isV ? `<video src="${url}" controls autoplay class="w-full rounded-xl"></video>` : `<img src="${url}" class="w-full rounded-xl">`, showConfirmButton: false, background: '#0b0b1a', width: '95%' }); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
function logout() { localStorage.clear(); location.reload(); }

window.onload = () => {
    if(localStorage.getItem('tk')) {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('dash').classList.remove('hidden');
        document.getElementById('upload-fab').classList.remove('hidden');
        loadGallery();
    }
};
