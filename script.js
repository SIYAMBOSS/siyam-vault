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
    } else {
        alert("ইমেইল এবং টোকেন দুইটাই দিন!");
    }
}

async function load(type) {
    const box = document.getElementById('gallery');
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    
    // Tab Style
    document.getElementById('btn-photos').className = type === 'photos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1" : "text-zinc-500 font-bold pb-1";
    document.getElementById('btn-videos').className = type === 'videos' ? "text-blue-500 font-bold border-b-2 border-blue-500 pb-1" : "text-zinc-500 font-bold pb-1";
    
    box.innerHTML = '<p class="col-span-3 text-center py-20 opacity-50 italic">লোড হচ্ছে...</p>';

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/vault/${email}/${type}?v=${Date.now()}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if(res.ok) {
            const files = await res.json();
            if(files.length > 0) {
                box.innerHTML = files.reverse().map(f => `
                    <div class="bg-zinc-900 border border-zinc-950">
                        ${type === 'photos' ? 
                            `<img src="${f.download_url}?v=${Date.now()}" loading="lazy">` : 
                            `<video src="${f.download_url}" controls class="w-full h-full"></video>`
                        }
                    </div>
                `).join('');
            } else {
                box.innerHTML = '<p class="col-span-3 text-center py-20 text-zinc-700 uppercase font-bold text-xs tracking-widest">ভল্ট খালি</p>';
            }
        } else {
            box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 text-xs">ফোল্ডার পাওয়া যায়নি!</p>';
        }
    } catch (err) { 
        box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-500">টোকেন এরর!</p>'; 
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

            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/vault/${email}/${type}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "up", content: content })
            });
            if(file === files[files.length-1]) {
                alert("আপলোড সম্পন্ন!");
                load(type);
            }
        };
        reader.readAsDataURL(file);
    }
}

function logout() { localStorage.clear(); location.reload(); }
