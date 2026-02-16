const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";
const BRANCH = "main"; 

function login() {
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;

    if (email.includes('@gmail.com') && token.length > 10) {
        localStorage.setItem('gh_token', token);
        localStorage.setItem('user_email', email);
        loadGallery();
    } else {
        alert("Sothik Gmail o Token din!");
    }
}

async function loadGallery() {
    const token = localStorage.getItem('gh_token');
    const email = localStorage.getItem('user_email');
    if (!token) return;

    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('gallery-container').classList.remove('hidden');
    document.getElementById('user-title').innerText = `${email.split('@')[0]}'s Vault`;

    const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/`;
    
    try {
        const response = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        const files = await response.json();
        const grid = document.getElementById('media-grid');
        grid.innerHTML = '';

        files.forEach(file => {
            if (file.name.match(/\.(jpg|jpeg|png|gif|mp4|webm)$/i)) {
                const isVideo = file.name.match(/\.(mp4|webm)$/i);
                const element = document.createElement(isVideo ? 'video' : 'img');
                element.src = file.download_url;
                element.onclick = (e) => { e.stopPropagation(); openModal(file.download_url, isVideo); };
                grid.appendChild(element);
            }
        });
    } catch (err) { alert("Error loading files!"); }
}

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const token = localStorage.getItem('gh_token');
    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async () => {
        const content = reader.result.split(',')[1];
        const url = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${Date.now()}_${file.name}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Upload from Web", content: content, branch: BRANCH })
        });

        if (response.ok) { alert("Upload Successful!"); loadGallery(); }
        else { alert("Upload Failed!"); }
    };
    reader.readAsDataURL(file);
}

function openModal(url, isVideo) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = isVideo ? `<video src="${url}" controls autoplay></video>` : `<img src="${url}">`;
    document.getElementById('download-btn').href = url;
    modal.classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function logout() {
    localStorage.clear();
    location.reload();
}

// Auto-load if already logged in
if (localStorage.getItem('gh_token')) { loadGallery(); }
