const config = { 
    owner: "SIYAMBOSS", 
    repo: "siyam-vault" // নিশ্চিত করুন আপনার Repo নাম এটাই
};

let currentTab = 'photos';

// ১. সুপার সিম্পল লগইন (কোনো জটিলতা নেই)
function handleLogin() {
    const em = document.getElementById('u-email').value.trim();
    const tk = document.getElementById('u-token').value.trim();
    
    if(!em || !tk) {
        Swal.fire('Error', 'ইমেইল এবং টোকেন দিন', 'error');
        return;
    }

    localStorage.setItem('em', em);
    localStorage.setItem('tk', tk);
    
    // লগইন চেক করার জন্য একটি ছোট টেস্ট
    testConnection(tk);
}

async function testConnection(tk) {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: { 'Authorization': `token ${tk}` }
    });
    if(res.ok) {
        Swal.fire('Success', 'Vault Unlocked!', 'success').then(() => location.reload());
    } else {
        Swal.fire('Login Failed', 'টোকেন বা রিপোজিটরি নাম ভুল', 'error');
    }
}

// ২. গ্যালারি লোড (পাথ রিফাইনড)
async function loadGallery() {
    const box = document.getElementById('gallery'), carousel = document.getElementById('carousel-3d');
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    if(!tk || !em) return;

    box.innerHTML = '<div class="col-span-full py-20 text-center opacity-30 animate-pulse">CONNECTING...</div>';

    // আপনার স্ট্রাকচার অনুযায়ী পাথ: vault/sadaf245sz@gmail.com/photos
    const path = `vault/${em}/${currentTab}`;
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `token ${tk}` } });
        if (res.ok) {
            const data = await res.json();
            const items = data.reverse();
            
            // 3D Carousel (শেষ ৬টি ছবি)
            carousel.innerHTML = '';
            const photos = items.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i)).slice(0, 6);
            photos.forEach((f, i) => {
                carousel.innerHTML += `<img src="${f.download_url}" style="--i:${i+1}" class="carousel-item">`;
            });

            // Gallery Grid
            box.innerHTML = '';
            items.forEach(f => {
                const isV = f.name.match(/\.(mp4|mov|webm)$/i);
                box.innerHTML += `
                    <div class="media-item" onclick="viewMedia('${f.download_url}', ${!!isV})">
                        ${isV ? `<video src="${f.download_url}" class="w-full h-full object-cover"></video>` : `<img src="${f.download_url}" class="w-full h-full object-cover" loading="lazy">`}
                    </div>`;
            });
        } else {
            box.innerHTML = `<div class="col-span-full py-20 text-center opacity-30 text-[10px]">EMPTY ARCHIVE</div>`;
        }
    } catch (e) { box.innerHTML = '<p class="col-span-full text-center text-red-500">SERVER ERROR</p>'; }
}

// ৩. অটো-আপলোড (ফোল্ডার না থাকলেও তৈরি হবে)
async function handleUpload(input) {
    const files = Array.from(input.files), tk = localStorage.getItem('tk'), em = localStorage.getItem('em');
    if(!files.length) return;
    Swal.fire({ title: 'Securing File...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

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
            body: JSON.stringify({ message: "vault update", content: b64 })
        });
    }
    Swal.fire('Success', 'File Secured!', 'success').then(() => loadGallery());
}

function switchTab(t) { currentTab = t; document.getElementById('current-tab-title').innerText = t.toUpperCase(); loadGallery(); toggleSidebar(); }
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
