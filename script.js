const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let fileToDelete = null;

window.onload = () => {
    const tk = localStorage.getItem('myToken');
    const em = localStorage.getItem('myEmail');
    if(tk && em) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        show('photos');
    }
};

function saveAndEnter() {
    const t = document.getElementById('token').value;
    const e = document.getElementById('email').value;
    if(t && e) {
        localStorage.setItem('myToken', t);
        localStorage.setItem('myEmail', e);
        location.reload();
    }
}

async function show(type) {
    const token = localStorage.getItem('myToken');
    const email = localStorage.getItem('myEmail');
    const box = document.getElementById(type);
    
    document.getElementById('btn-photos').className = type === 'photos' ? "text-blue-500 font-black border-b-2 border-blue-500 pb-1 text-xs uppercase" : "text-zinc-500 font-black pb-1 text-xs uppercase";
    document.getElementById('btn-videos').className = type === 'videos' ? "text-blue-500 font-black border-b-2 border-blue-500 pb-1 text-xs uppercase" : "text-zinc-500 font-black pb-1 text-xs uppercase";
    
    document.getElementById('photos').classList.toggle('hidden', type !== 'photos');
    document.getElementById('videos').classList.toggle('hidden', type !== 'videos');

    box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-700 text-[10px] uppercase font-bold animate-pulse">Loading...</p>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}?v=${Date.now()}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const files = await res.json();

        if (res.ok && files.length > 0) {
            box.innerHTML = files.reverse().map(f => `
                <div class="relative bg-zinc-900 overflow-hidden group">
                    <button onclick="downloadFile('${f.download_url}')" class="action-btn dl-btn"><i class="fa-solid fa-download"></i></button>
                    <button onclick="askDelete('${f.path}', '${f.sha}')" class="action-btn del-btn"><i class="fa-solid fa-trash-can"></i></button>
                    
                    ${type === 'photos' ? 
                        `<img src="${f.download_url}?v=${Date.now()}" loading="lazy">` : 
                        `<video src="${f.download_url}" class="w-full h-full"></video>`
                    }
                </div>
            `).join('');
        } else { box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-800 text-[10px] font-bold">EMPTY</p>'; }
    } catch(e) { box.innerHTML = ''; }
}

async function startUpload(input) {
    const token = localStorage.getItem('myToken');
    const email = localStorage.getItem('myEmail');
    const files = input.files;
    if(!files.length) return;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            const name = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

            const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "up", content: content })
            });
            if(file === files[files.length-1]) show(type);
        };
        reader.readAsDataURL(file);
    }
}

// ডাউনলোড লজিক
function downloadFile(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = "SIYAM_VAULT_" + Date.now();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ডিলিট লজিক
function askDelete(path, sha) {
    fileToDelete = { path, sha };
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDelete() {
    document.getElementById('delete-modal').classList.add('hidden');
}

document.getElementById('confirm-delete-btn').onclick = async () => {
    const token = localStorage.getItem('myToken');
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${fileToDelete.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${token}` },
        body: JSON.stringify({ message: "del", sha: fileToDelete.sha })
    });
    if(res.ok) {
        closeDelete();
        show(fileToDelete.path.includes('photos') ? 'photos' : 'videos');
    }
};

function exit() { localStorage.clear(); location.reload(); }
