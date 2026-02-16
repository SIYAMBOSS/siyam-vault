const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";

function login() {
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    if (email === "sadaf245sz@gmail.com" && token.length > 5) {
        localStorage.setItem('gh_token', token);
        showGallery();
    } else { alert("Gmail or Token error!"); }
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
        const carousel = document.getElementById('carousel');
        grid.innerHTML = '';
        carousel.innerHTML = '';

        let files = data.filter(f => f.name.match(/\.(jpg|jpeg|png|mp4|webm)$/i));

        files.forEach((file, index) => {
            const isVideo = file.name.match(/\.(mp4|webm)$/i);
            const img = document.createElement('img');
            img.src = file.download_url;
            img.onclick = () => openModal(file.download_url, isVideo, file.path);

            // Add to 3D Carousel (First 5 files)
            if (index < 5) {
                const cImg = img.cloneNode();
                if (index === 2) cImg.classList.add('center');
                carousel.appendChild(cImg);
            }

            // Add to Main Grid
            const gridItem = isVideo ? document.createElement('video') : document.createElement('img');
            gridItem.src = file.download_url;
            gridItem.onclick = () => openModal(file.download_url, isVideo, file.path);
            grid.appendChild(gridItem);
        });
    } catch (e) { console.error("Load failed"); }
}

async function uploadFile() {
    const file = document.getElementById('file-input').files[0];
    const token = localStorage.getItem('gh_token');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        const content = reader.result.split(',')[1];
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${Date.now()}_${file.name}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}` },
            body: JSON.stringify({ message: "upload", content })
        });
        if (res.ok) loadMedia();
    };
    reader.readAsDataURL(file);
}

function openModal(url, isVideo, path) {
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}">`;
    document.getElementById('download-btn').href = url;
    document.getElementById('modal').classList.remove('hidden');
    window.currentPath = path;
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function logout() { localStorage.clear(); location.reload(); }

if (localStorage.getItem('gh_token')) showGallery();
