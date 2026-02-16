// ১. সাইডবার টগল
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('-translate-x-full');
}

// ২. ডিলিট টু ট্রাশ লজিক (Move File)
async function moveToTrash(path, sha, fileName) {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    
    // ১. ফাইল কন্টেন্ট সংগ্রহ
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${tk}` }
    });
    const fileData = await res.json();

    // ২. ট্রাশ ফোল্ডারে পাঠানো
    await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/trash/${fileName}`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${tk}` },
        body: JSON.stringify({ message: "moved to trash", content: fileData.content })
    });

    // ৩. অরিজিনাল ফাইল ডিলিট
    await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${tk}` },
        body: JSON.stringify({ message: "delete", sha: sha })
    });

    Swal.fire('Moved to Trash', '', 'success');
    closeModal();
    loadGallery();
}

// ৩. গ্যালারি লোড (ফাস্ট লোডিং লজিক)
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    
    // ল্যাগ কমাতে আগে ছোট ডাটা রিকোয়েস্ট
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/${currentTab}`, {
        headers: { 'Authorization': `token ${tk}` }
    });
    const data = await res.json();
    
    if(res.ok && Array.isArray(data)) {
        // ফাইল কাউন্ট আপডেট
        document.getElementById('file-counter').innerText = `${data.length} ITEMS IN ${currentTab.toUpperCase()}`;
        
        box.innerHTML = data.reverse().map(f => {
            const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
            const isV = f.name.endsWith('.mp4');
            return `
                <div class="media-item" onclick="viewMedia('${url}','${f.sha}','${f.name}','${f.path}')">
                    <${isV?'video':'img'} src="${url}" class="w-full h-full object-cover"></${isV?'video':'img'}>
                </div>`;
        }).join('');
    }
}

function viewMedia(url, sha, name, path) {
    const modal = document.getElementById('media-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    
    const isV = url.endsWith('.mp4');
    content.innerHTML = isV ? `<video src="${url}" controls autoplay class="rounded-xl"></video>` : `<img src="${url}" class="rounded-xl shadow-2xl">`;
    
    // বাটন অ্যাকশন
    document.getElementById('save-btn').onclick = () => {
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    };
    
    document.getElementById('trash-btn').onclick = () => {
        Swal.fire({
            title: 'Move to Trash?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) moveToTrash(path, sha, name);
        });
    };
}
