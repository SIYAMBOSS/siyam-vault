const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";

// Login Logic
function login() {
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    if (email && token) {
        localStorage.setItem('gh_token', token);
        localStorage.setItem('user_email', email);
        location.reload();
    }
}

// সুপার ফাস্ট ফোল্ডার ওয়াইজ আপলোড
async function uploadFiles() {
    const files = document.getElementById('file-input').files;
    const token = localStorage.getItem('gh_token');
    const userEmail = localStorage.getItem('user_email');
    const safeEmail = userEmail.replace(/[@.]/g, '_');

    if (files.length === 0) return;
    
    document.getElementById('upload-popup').classList.remove('hidden');
    let done = 0;

    const uploads = Array.from(files).map(async (file) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async () => {
                const content = reader.result.split(',')[1];
                const fileName = `${Date.now()}_${file.name}`;
                // ফোল্ডার পাথ: vault/user_folder/file
                const filePath = `vault/${safeEmail}/${fileName}`;
                
                try {
                    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${filePath}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `token ${token}` },
                        body: JSON.stringify({ message: `Upload by ${userEmail}`, content })
                    });
                    done++;
                    document.getElementById('progress-bar').style.width = (done/files.length)*100 + "%";
                } catch (e) { console.error(e); }
                resolve();
            };
            reader.readAsDataURL(file);
        });
    });

    await Promise.all(uploads);
    location.reload();
}

// ফাস্ট রিলোড ও ফোল্ডার লোড
async function loadMedia() {
    const token = localStorage.getItem('gh_token');
    const safeEmail = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const folderPath = `vault/${safeEmail}`;

    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${folderPath}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const data = await res.json();
        
        const grid = document.getElementById('media-grid');
        const carousel = document.getElementById('carousel');
        const myFiles = data.reverse();

        myFiles.forEach((file, i) => {
            const isVideo = file.name.match(/\.(mp4|webm)$/i);
            if(!isVideo && i < 8) {
                const img = document.createElement('img');
                img.src = file.download_url;
                img.style.transform = `rotateY(${i * 45}deg) translateZ(280px)`;
                carousel.appendChild(img);
            }
            const el = document.createElement(isVideo ? 'video' : 'img');
            el.src = file.download_url;
            el.loading = "lazy";
            el.onclick = () => openModal(file.download_url, isVideo, file.path, file.sha, file.name);
            grid.appendChild(el);
        });
    } catch (e) { 
        document.getElementById('media-grid').innerHTML = "<p style='color:#555; padding:20px;'>No media found.</p>";
    }
}

function openModal(url, isVideo, path, sha, name) {
    window.currentFile = { url, name, path, sha };
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay style="width:100%"></video>` : `<img src="${url}" style="width:100%; border-radius:15px;">`;
    document.getElementById('modal').classList.remove('hidden');
}

async function downloadOriginal() {
    const res = await fetch(window.currentFile.url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = window.currentFile.name;
    a.click();
}

async function deleteFile() {
    if(!confirm("Are you sure?")) return;
    const token = localStorage.getItem('gh_token');
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${window.currentFile.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${token}` },
        body: JSON.stringify({ message: "del", sha: window.currentFile.sha })
    });
    location.reload();
}

function switchTab(t) {
    document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(t === 'folders' ? 'folder-view' : 'main-gallery').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }

window.onload = () => {
    if (localStorage.getItem('gh_token')) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('gallery-container').classList.remove('hidden');
        loadMedia();
    }
};
