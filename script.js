const owner = "SIYAMBOSS";
const repo = "SIYAM-VAULT";

window.onload = () => {
    if(localStorage.getItem('tk') && localStorage.getItem('em')) {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('dash').classList.remove('hidden');
        load('photos');
    }
};

function login() {
    const e = document.getElementById('u-email').value;
    const t = document.getElementById('u-token').value;
    if(e && t) {
        localStorage.setItem('em', e);
        localStorage.setItem('tk', t);
        location.reload();
    }
}

async function load(type) {
    const box = document.getElementById('gallery');
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    
    document.getElementById('btn-photos').className = type === 'photos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1 text-xs" : "text-zinc-500 font-bold pb-1 text-xs";
    document.getElementById('btn-videos').className = type === 'videos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1 text-xs" : "text-zinc-500 font-bold pb-1 text-xs";
    
    box.innerHTML = '<div class="col-span-3 py-20 text-center opacity-30"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/vault/${email}/${type}?v=${Date.now()}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if(res.ok) {
            const files = await res.json();
            box.innerHTML = files.reverse().map(f => `
                <div>
                    ${type === 'photos' ? 
                        `<img src="${f.download_url}?v=${Date.now()}" loading="lazy">` : 
                        `<video src="${f.download_url}" controls class="w-full"></video>`
                    }
                </div>
            `).join('');
        } else {
            box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-800 text-xs">FOLDER EMPTY</p>';
        }
    } catch (err) { 
        box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 text-xs">CONNECTION ERROR</p>'; 
    }
}

async function upload(input) {
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    const files = input.files;
    if(!files.length) return;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            const name = Date.now() + "_" + file.name.replace(/\s+/g, '_');

            await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/vault/${email}/${type}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "upload", content: content })
            });
            if(file === files[files.length-1]) {
                alert("Upload Done!");
                load(type);
            }
        };
        reader.readAsDataURL(file);
    }
}

function logout() { localStorage.clear(); location.reload(); }
