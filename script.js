const user = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };

window.onload = () => {
    if(localStorage.getItem('tk')) {
        document.getElementById('login-box').classList.add('hidden');
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
    box.innerHTML = '<p class="col-span-3 text-center py-10">Loading...</p>';

    try {
        // ফোল্ডার পাথ চেক করা হয়েছে
        const res = await fetch(`https://api.github.com/repos/${user.owner}/${user.repo}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if(res.ok) {
            const files = await res.json();
            box.innerHTML = files.reverse().map(f => `
                <div>
                    ${type === 'photos' ? `<img src="${f.download_url}?v=${Date.now()}">` : `<video src="${f.download_url}" controls></video>`}
                </div>
            `).join('');
        } else {
            box.innerHTML = '<p class="col-span-3 text-center py-10">Folder not found. Please upload something.</p>';
        }
    } catch (err) { box.innerHTML = '<p class="col-span-3 text-center py-10 text-red-500">Token Error!</p>'; }
}

async function upload(input) {
    const token = localStorage.getItem('tk');
    const email = localStorage.getItem('em');
    const files = input.files;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            const name = Date.now() + "_" + file.name;

            const res = await fetch(`https://api.github.com/repos/${user.owner}/${user.repo}/contents/vault/${email}/${type}/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "up", content: content })
            });
            if(file === files[files.length-1]) load(type);
        };
        reader.readAsDataURL(file);
    }
}

function logout() { localStorage.clear(); location.reload(); }
