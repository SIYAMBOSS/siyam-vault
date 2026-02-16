const config = {
    owner: "SIYAMBOSS",
    repo: "SIYAM-VAULT"
};

// সরাসরি লগইন ফাংশন
async function handleLogin() {
    const email = document.getElementById('u-email').value.trim();
    const token = document.getElementById('u-token').value.trim();

    if (!email || !token) {
        return Swal.fire('Error', 'Gmail এবং Token দুটিই দিন!', 'warning');
    }

    // টেস্ট করার জন্য গিটহাব এপিআই চেক
    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (res.ok) {
            localStorage.setItem('em', email);
            localStorage.setItem('tk', token);
            Swal.fire({ icon: 'success', title: 'Access Granted', showConfirmButton: false, timer: 1500 });
            showDashboard();
        } else {
            Swal.fire('Denied', 'ভুল টোকেন অথবা রিপোজিটরি পারমিশন নেই!', 'error');
        }
    } catch (e) {
        Swal.fire('Error', 'Connection failed!', 'error');
    }
}

async function load(type = 'photos') {
    const box = document.getElementById('gallery');
    const email = localStorage.getItem('em');
    const token = localStorage.getItem('tk');
    
    box.innerHTML = '<div class="col-span-3 py-20 text-center animate-pulse text-zinc-600 uppercase text-xs">Loading Cloud...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (res.ok) {
            const files = await res.json();
            box.innerHTML = files.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                return `<div class="aspect-square bg-zinc-900 overflow-hidden border border-white/5">
                    <img src="${url}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400?text=Video+File'">
                </div>`;
            }).join('');
        } else {
            box.innerHTML = '<p class="col-span-3 text-center py-20 opacity-30 text-xs">NO FILES FOUND</p>';
        }
    } catch (e) {
        box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 text-xs">AUTH ERROR</p>';
    }
}

async function upload(input) {
    const email = localStorage.getItem('em');
    const token = localStorage.getItem('tk');
    const files = input.files;

    for (let file of files) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const type = file.type.includes('video') ? 'videos' : 'photos';
            const fileName = Date.now() + "_" + file.name;

            const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${email}/${type}/${fileName}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${token}` },
                body: JSON.stringify({ message: "upload", content: content })
            });

            if (res.ok) {
                Swal.fire('Uploaded!', file.name + ' সেভ হয়েছে।', 'success');
                load(type);
            }
        };
    }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('user-display').innerText = localStorage.getItem('em');
    load();
}

function logout() {
    localStorage.clear();
    location.reload();
}

// অটো লগইন চেক
if (localStorage.getItem('tk')) {
    showDashboard();
}
