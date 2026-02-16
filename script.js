const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";

function logout() {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('user_email');
    window.location.href = "login.html"; // Tomar login page er name onujayi change koro
}

function switchTab(tab) {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    const mediaSec = document.getElementById('media-display-section');
    const albumSec = document.getElementById('albums-section');
    const folderView = document.getElementById('folder-inner-view');
    const filterBar = document.getElementById('floating-filter');

    if (tab === 'albums') {
        mediaSec.classList.add('hidden');
        albumSec.classList.remove('hidden');
        folderView.classList.add('hidden');
        filterBar.classList.add('hidden');
        loadFolders();
    } else {
        mediaSec.classList.remove('hidden');
        albumSec.classList.add('hidden');
        folderView.classList.add('hidden');
        filterBar.classList.remove('hidden');
        loadMedia(tab);
    }
}

// Upload Trigger Logic
let uploadTargetFolder = null;
function triggerUpload(type) {
    uploadTargetFolder = currentOpenFolder; // currentOpenFolder variable thakte hobe
    document.getElementById('file-input').click();
}

async function createNewFolder() {
    const folderName = prompt("Event Name:");
    if (!folderName) return;
    
    // GitHub API call to create folder (via .keep file)
    const token = localStorage.getItem('gh_token');
    const email = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const path = `vault/${email}/${folderName}/.keep`;
    
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}` },
        body: JSON.stringify({ message: `Create folder ${folderName}`, content: btoa('') })
    });
    loadFolders();
}
