const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";

function login() {
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    if (email === "sadaf245sz@gmail.com" && token.length > 5) {
        localStorage.setItem('gh_token', token);
        showGallery();
    } else { alert("Wrong details!"); }
}

function showGallery() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('gallery-container').classList.remove('hidden');
    loadMedia();
}

async function loadMedia() {
    const token = localStorage.getItem('gh_token');
    const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/`;
    
    try {
        const res = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const data = await res.json();
        const grid = document.getElementById('media-grid');
        grid.innerHTML = '';
        
        let count = 0;
        data.forEach(file => {
            if (file.name.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/i)) {
                count++;
                const isVideo = file.name.match(/\.(mp4|webm)$/i);
                const el = document.createElement(isVideo ? 'video' : 'img');
                el.src = file.download_url;
                el.onclick = () => openModal(file.download_url, isVideo);
                grid.appendChild(el);
            }
        });
        document.getElementById('file-count').innerText = `${count} photos and videos`;
    } catch (e) { alert("Error loading vault!"); }
}

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const token = localStorage.getItem('gh_token');
    if (!fileInput.files[0]) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
        const content = reader.result.split(',')[1];
        const path = `${Date.now()}_${file.name}`;
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`;
        
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}` },
            body: JSON.stringify({ message: "upload", content: content })
        });
        if (res.ok) { loadMedia(); } else { alert("Upload failed!"); }
    };
    reader.readAsDataURL(file);
}

function openModal(url, isVideo) {
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay style="width:100%"></video>` : `<img src="${url}" style="width:100%">`;
    document.getElementById('download-btn').href = url;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function logout() { localStorage.clear(); location.reload(); }

if (localStorage.getItem('gh_token')) showGallery();
