const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT";

window.onload = () => {
    const savedToken = localStorage.getItem('v_token');
    const savedEmail = localStorage.getItem('v_email');
    if (savedToken && savedEmail) {
        showDashboard();
    }
};

function login() {
    const email = document.getElementById('user-email').value;
    const token = document.getElementById('github-token').value;
    if (email && token) {
        localStorage.setItem('v_email', email);
        localStorage.setItem('v_token', token);
        showDashboard();
    } else {
        alert("Enter Email & Token");
    }
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    switchTab('photos');
}

async function loadGallery(type) {
    const email = localStorage.getItem('v_email');
    const token = localStorage.getItem('v_token');
    const container = document.getElementById(`${type}-content`);
    container.innerHTML = `<p class="col-span-3 text-center py-10 opacity-50">Loading...</p>`;

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}?cb=${Date.now()}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        if (res.ok) {
            const files = await res.json();
            container.innerHTML = files.reverse().map(f => `
                <div class="relative">
                    ${type === 'photos' ? `<img src="${f.download_url}?v=${Date.now()}">` : `<video src="${f.download_url}#t=0.1" controls></video>`}
                </div>
            `).join('');
        } else { container.innerHTML = ""; }
    } catch (e) { console.log(e); }
}

async function uploadFiles(event) {
    const files = event.target.files;
    const email = localStorage.getItem('v_email');
    const token = localStorage.getItem('v_token');
    if (!files.length) return;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result.split(',')[1];
            const type = file.type.startsWith('image') ? 'photos' : 'videos';
            const path = `vault/${email}/${type}/${Date.now()}_${file.name}`;
            
            await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: 'upload', content: content })
            });
            if (file === files[files.length - 1]) loadGallery(type);
        };
        reader.readAsDataURL(file);
    }
}

function switchTab(tab) {
    const p = document.getElementById('photos-content');
    const v = document.getElementById('videos-content');
    const tp = document.getElementById('tab-photos');
    const tv = document.getElementById('tab-videos');

    if (tab === 'photos') {
        p.classList.remove('hidden'); v.classList.add('hidden');
        tp.className = "text-blue-500 font-bold border-b-2 border-blue-500 pb-1";
        tv.className = "text-zinc-500 font-bold pb-1";
    } else {
        v.classList.remove('hidden'); p.classList.add('hidden');
        tv.className = "text-blue-500 font-bold border-b-2 border-blue-500 pb-1";
        tp.className = "text-zinc-500 font-bold pb-1";
    }
    loadGallery(tab);
}

function logout() { localStorage.clear(); location.reload(); }
