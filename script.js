 let scene, camera, renderer, frames = [];
const config = { owner: "SIYAMBOSS", repo: "SIYAM-VAULT" };

// ৩ডি স্পেস লজিক (Top Section)
function init3D(urls) {
    if(scene) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    urls.slice(0, 6).forEach((url, i) => {
        loader.load(url, (texture) => {
            const geo = new THREE.PlaneGeometry(3.5, 4.5);
            const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
            const mesh = new THREE.Mesh(geo, mat);
            
            mesh.position.set(Math.sin(i) * 6, Math.cos(i) * 2, -8 - (i * 2));
            mesh.rotation.y = Math.sin(i) * 0.5;
            scene.add(mesh);
            frames.push(mesh);
        });
    });

    camera.position.z = 5;
    const animate = () => {
        requestAnimationFrame(animate);
        frames.forEach((f, i) => {
            f.position.y += Math.sin(Date.now() * 0.001 + i) * 0.005;
            f.rotation.y += 0.002;
        });
        renderer.render(scene, camera);
    };
    animate();
}

// লগইন হ্যান্ডলার
async function handleLogin() {
    const email = document.getElementById('u-email').value.trim();
    const token = document.getElementById('u-token').value.trim();
    if(!email || !token) return Swal.fire('Error', 'Input Gmail & Token', 'error');

    localStorage.setItem('em', email);
    localStorage.setItem('tk', token);
    showDashboard();
}

// গ্যালারি লোড (Photos/Videos)
async function loadGallery() {
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    const box = document.getElementById('gallery');
    box.innerHTML = '<div class="col-span-3 py-20 text-center animate-pulse text-zinc-600 uppercase text-[10px] tracking-widest">Decrypting Vault...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/photos`, {
            headers: { 'Authorization': `token ${tk}` }
        });
        const files = await res.json();
        if(res.ok) {
            const urls = files.map(f => `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`);
            init3D(urls); // ৩ডি-তে প্রথম কয়েকটি ছবি পাঠানো
            
            box.innerHTML = files.reverse().map(f => {
                const url = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@main/${f.path}`;
                return `<div class="aspect-[3/4] bg-zinc-900 overflow-hidden cursor-pointer active:scale-95 transition-all" onclick="viewMedia('${url}', '${f.sha}')">
                    <img src="${url}" class="w-full h-full object-cover">
                </div>`;
            }).join('');
        }
    } catch(e) { box.innerHTML = '<p class="col-span-3 text-center py-20 text-red-900 uppercase text-xs">Auth Failed</p>'; }
}

// মিডিয়া ভিউ (Save & Delete)
function viewMedia(url, sha) {
    const modal = document.getElementById('media-modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-content').innerHTML = `<img src="${url}" class="max-h-[75vh] rounded-2xl shadow-2xl border border-white/10">`;
    
    document.getElementById('dl-btn').onclick = () => {
        const link = document.createElement('a');
        link.href = url; link.download = 'SIYAM_VAULT_' + Date.now(); link.click();
    };

    document.getElementById('del-btn').onclick = async () => {
        const ask = await Swal.fire({ title: 'Delete?', text: 'এটি চিরতরে মুছে যাবে!', icon: 'warning', showCancelButton: true });
        if(ask.isConfirmed) {
            const path = url.split('@main/')[1];
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${localStorage.getItem('tk')}` },
                body: JSON.stringify({ message: "delete", sha: sha })
            });
            location.reload();
        }
    };
}

// আপলোড লজিক
async function upload(input) {
    Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const em = localStorage.getItem('em'), tk = localStorage.getItem('tk');
    
    for (let file of input.files) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const content = reader.result.split(',')[1];
            const name = Date.now() + "_" + file.name;
            await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/vault/${em}/photos/${name}`, {
                method: 'PUT',
                headers: { 'Authorization': `token ${tk}` },
                body: JSON.stringify({ message: "upload", content: content })
            });
            if(file === input.files[input.files.length-1]) location.reload();
        };
    }
}

function showDashboard() {
    document.getElementById('auth-box').classList.add('hidden');
    document.getElementById('three-container').classList.remove('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('user-info').innerText = localStorage.getItem('em');
    loadGallery();
}

function closeModal() { document.getElementById('media-modal').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
if(localStorage.getItem('tk')) showDashboard();
