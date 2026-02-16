let scene, camera, renderer;
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };
let currentTab = 'photos';
let selectedFiles = []; // একসাথে অনেক ফাইল সিলেক্ট করার জন্য

// ১. মাল্টি-সিলেকশন লজিক (গ্যালারিতে ক্লিক করলে সিলেক্ট হবে)
function handleItemClick(url, sha, el) {
    // যদি আমরা কোন ফোল্ডারের ভেতরে থাকি, তবে ক্লিক করলে ছবি বড় হবে
    if(currentTab.includes('folders/')) { 
        viewMedia(url, sha); 
        return; 
    }

    // সিলেকশন মোড: একবার ক্লিক করলে সিলেক্ট হবে, আবার করলে আনসিলেক্ট
    const idx = selectedFiles.findIndex(f => f.sha === sha);
    if(idx > -1) {
        selectedFiles.splice(idx, 1);
        el.classList.remove('selected-item', 'border-4', 'border-emerald-500', 'opacity-50');
    } else {
        selectedFiles.push({ url, sha });
        el.classList.add('selected-item', 'border-4', 'border-emerald-500', 'opacity-50', 'scale-90');
    }

    // যদি অন্তত ১টি ফাইল সিলেক্ট থাকে, তবে 'MOVE' বাটন দেখাবে
    const moveBtn = document.getElementById('move-btn');
    if(moveBtn) {
        moveBtn.classList.toggle('hidden', selectedFiles.length === 0);
        moveBtn.innerHTML = `<i class="fa-solid fa-share mr-2"></i> MOVE (${selectedFiles.length})`;
    }
}

// ২. একসাথে অনেক ফাইল মুভ করার প্রসেস
async function startMoveProcess() {
    if(selectedFiles.length === 0) return;
    
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    
    // টার্গেট ফোল্ডার লিস্ট আনা
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/folders`, {
        headers: { 'Authorization': `token ${tk}` }
    });
    const folders = await res.json();
    const options = {};
    folders.forEach(f => { if(f.type === 'dir') options[f.name] = f.name; });

    const { value: target } = await Swal.fire({
        title: 'Move Selected Files',
        input: 'select',
        inputOptions: options,
        placeholder: 'Select Folder',
        showCancelButton: true,
        background: '#1a0b2e',
        color: '#fff'
    });

    if(target) {
        Swal.fire({
            title: `Moving ${selectedFiles.length} files...`,
            html: 'Please wait, sync in progress',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        for(let file of selectedFiles) {
            const oldPath = file.url.split('@main/')[1];
            const fileName = oldPath.split('/').pop();
            const newPath = `vault/${em}/folders/${target}/${fileName}`;
            
            try {
                // ১. ফাইল কপি করা
                const rawFile = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${oldPath}`, {
                    headers: { 'Authorization': `token ${tk}` }
                }).then(r => r.json());

                await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${newPath}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `token ${tk}` },
                    body: JSON.stringify({
                        message: `moved ${fileName}`,
                        content: rawFile.content
                    })
                });

                // ২. পুরাতন ফাইল ডিলিট করা
                await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${oldPath}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `token ${tk}` },
                    body: JSON.stringify({ message: "cleanup", sha: file.sha })
                });
            } catch (err) { console.error("Move failed for:", fileName); }
        }

        Swal.fire('Success', 'All files moved successfully!', 'success');
        selectedFiles = [];
        loadGallery();
    }
}

// ৩. একসাথে অনেক ফাইল আপলোড (Queue System)
async function handleUpload(input) {
    if(!input.files.length) return;
    
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    let count = 0;
    
    Swal.fire({
        title: 'Uploading Files...',
        html: `Progress: <b>0</b> / ${input.files.length}`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    for(let file of input.files) {
        const content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });

        const path = `vault/${em}/${currentTab === 'videos' ? 'videos' : 'photos'}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;

        await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tk}` },
            body: JSON.stringify({ message: "upload", content: content })
        });

        count++;
        Swal.getHtmlContainer().querySelector('b').textContent = count;
    }

    Swal.fire('Success', 'All files uploaded!', 'success');
    loadGallery();
}

// ৪. বাকি সব ফাংশন (init3D, loadGallery, etc.) আগের মতোই থাকবে
