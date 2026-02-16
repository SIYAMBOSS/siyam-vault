const GITHUB_USER = "SIYAMBOSS";
const REPO_NAME = "siyam-vault";

// ১. লগআউট সিস্টেম (একদম ক্লিয়ার)
function confirmLogout() {
    if(confirm("Are you sure you want to Logout from Siyam Vault?")) {
        console.log("Clearing Session...");
        localStorage.removeItem('gh_token');
        localStorage.removeItem('user_email');
        // রিফ্রেশ করলে আবার লগইন স্ক্রিন আসবে
        window.location.reload(); 
    }
}

// ২. আপলোড কন্ট্রোল
function triggerFileUpload(type) {
    if (type === 'photo') {
        document.getElementById('photo-input').click();
    } else {
        document.getElementById('video-input').click();
    }
}

async function handleFileSelect(event, type) {
    const files = event.target.files;
    if (files.length === 0) return;

    const folderName = currentOpenFolder || "General";
    alert(`Ready to upload ${files.length} ${type}s to folder: ${folderName}`);
    
    // তোমার গিটহাব আপলোড ফাংশন এখানে কল হবে
    // startGithubUpload(files, folderName);
}

// ৩. নতুন ইভেন্ট তৈরি (বিশাল ফাংশন)
async function initCreateFolder() {
    const folderName = prompt("Enter a unique name for your new Event/Folder:");
    
    if (!folderName || folderName.trim().length < 3) {
        alert("Please enter a valid folder name (at least 3 characters)");
        return;
    }

    const token = localStorage.getItem('gh_token');
    const email = localStorage.getItem('user_email').replace(/[@.]/g, '_');
    const path = `vault/${email}/${folderName}/.keep`;

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Initializing folder: ${folderName}`,
                content: btoa('Vault Keep File') 
            })
        });

        if (response.ok) {
            alert("Success! Event created.");
            loadFolders(); // ফোল্ডার লিস্ট রিফ্রেশ হবে
        } else {
            alert("Error: Folder might already exist or Token expired.");
        }
    } catch (err) {
        console.error("Upload Error:", err);
    }
}

// ৪. ট্যাব সুইচিং (সম্পূর্ণ আলাদা লজিক)
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    const bar = document.getElementById('floating-filter');
    const mediaSec = document.getElementById('media-display-section');
    const albumSec = document.getElementById('albums-section');
    const innerView = document.getElementById('folder-inner-view');

    if (tab === 'albums') {
        mediaSec.classList.add('hidden');
        albumSec.classList.remove('hidden');
        innerView.classList.add('hidden');
        bar.classList.add('hidden');
        loadFolders();
    } else {
        mediaSec.classList.remove('hidden');
        albumSec.classList.add('hidden');
        innerView.classList.add('hidden');
        bar.classList.remove('hidden');
        loadMedia(tab);
    }
}
