const REPO_OWNER = "SIYAMBOSS";
const REPO_NAME = "SIYAM-VAULT";

let GITHUB_TOKEN = localStorage.getItem('vault_token') || "";
let fileToDelete = null;

window.onload = () => {
    // যদি আগে থেকেই টোকেন সেভ থাকে, বক্সে অটো দেখাবে
    if (GITHUB_TOKEN) {
        document.getElementById('github-token-input').value = GITHUB_TOKEN;
        checkBannerStatus();
    }
    if (localStorage.getItem('activeUser') && GITHUB_TOKEN) {
        showDashboard();
    }
};

function handleAuth() {
    const email = document.getElementById('user-email').value;
    const token = document.getElementById('github-token-input').value;

    if (email && token) {
        localStorage.setItem('activeUser', email);
        localStorage.setItem('vault_token', token);
        GITHUB_TOKEN = token;
        showDashboard();
    } else {
        alert("Please fill all fields!");
    }
}

// গ্যালারি লোড করার সময় এই টোকেন ব্যবহার হবে
async function loadContent(email, type) {
    const container = document.getElementById(`${type}-content`);
    container.innerHTML = `<div class="col-span-3 py-20 text-center opacity-20"><i class="fa-solid fa-spinner fa-spin text-2xl"></i></div>`;

    try {
        const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/vault/${email}/${type}?nocache=${Date.now()}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        if (res.ok) {
            const files = await res.json();
            container.innerHTML = files.reverse().map(f => `
                <div class="relative aspect-square overflow-hidden bg-zinc-900 border-[0.5px] border-zinc-800 group">
                    <button class="delete-trigger absolute top-2 right-2 p-2 bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 z-10" onclick="event.stopPropagation(); askDelete('${f.path}', '${f.sha}')">
                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                    ${type === 'videos' ? 
                        `<video src="${f.download_url}" onclick="openPreview('${f.download_url}', true)"></video>` : 
                        `<img src="${f.download_url}" onclick="openPreview('${f.download_url}', false)" loading="lazy">`
                    }
                </div>`).join('');
        } else {
            container.innerHTML = `<p class="col-span-3 text-center py-20 text-zinc-800">EMPTY VAULT</p>`;
        }
    } catch (e) { alert("Invalid Token or Connection Error!"); }
}

// বাকি ফাংশনগুলো (setupBanner, uploadFiles, executeDelete, preview) আগের মতোই কাজ করবে...
// (সময় ও জায়গা বাঁচাতে আমি শুধু মূল পরিবর্তনগুলো এখানে দেখালাম)

function logout() {
    localStorage.removeItem('activeUser');
    // টোকেন মুছতে চাইলে নিচের লাইনটি আনকমেন্ট করুন
    // localStorage.removeItem('vault_token'); 
    location.reload();
}

// ... (পুরনো সব ফাংশন যেমন uploadFiles, setupBanner, downloadMedia এর ভেতরে GITHUB_TOKEN ভেরিয়েবলটি ব্যবহার হবে)
