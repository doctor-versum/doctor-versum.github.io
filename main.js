// --- TAB SYSTEM ---
const tabs = document.querySelectorAll('#tabs button');
const homeContainer = document.getElementById('home-container');
const imagesContainer = document.getElementById('images-container');

function setActiveTab(tabName) {
    tabs.forEach(t => t.classList.remove('active'));
    homeContainer.classList.remove('active');
    imagesContainer.classList.remove('active');

    if(tabName === 'images') {
        document.getElementById('tab-images').classList.add('active');
        imagesContainer.classList.add('active');
    } else {
        document.getElementById('tab-home').classList.add('active');
        homeContainer.classList.add('active');
    }
}

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    setActiveTab(hash);
});

// Initial
setActiveTab(window.location.hash.slice(1) || 'home');


// --- README ---
async function fetchReadme() {
    const url = "https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/README.md";
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Fehler beim Abrufen der README.md:", error);
        return null;
    }
}

fetchReadme().then(text => {
    const container = document.getElementById("readme-content");
    const toggleBtn = document.getElementById("toggleReadme");
    container.innerHTML = marked.parse(text);

    // Bilder anpassen
    container.querySelectorAll('img').forEach(img => {
        let src = img.getAttribute('src');
        if (src && !src.startsWith('http')) {
            img.src = `https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/${src}`;
        }
    });

    // Collapsible
    if(container.scrollHeight > container.clientHeight) {
        container.classList.add("collapsed");
        toggleBtn.style.display = "inline-block";
        toggleBtn.textContent = "show more";
    }
    toggleBtn.addEventListener("click", () => {
        if(container.classList.contains("collapsed")) {
            container.classList.remove("collapsed");
            container.style.maxHeight = "none";
            toggleBtn.textContent = "hide";
        } else {
            container.classList.add("collapsed");
            container.style.maxHeight = null;
            toggleBtn.textContent = "show more";
        }
    });
});

// --- REPOS ---
fetch("https://api.github.com/users/doctor-versum/repos")
.then(r => r.json())
.then(repos => {
    const leftCol = document.getElementById("left-col");
    const rightCol = document.getElementById("right-col");

    repos.filter(repo => repo.name !== "doctor-versum" && repo.name !== "doctor-versum.github.io")
    .forEach((repo, i) => {
        const repoDiv = document.createElement("div");
        repoDiv.classList.add("repo");

        (async () => {
            let coverURL = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
            try {
                const res = await fetch(`https://api.github.com/repos/doctor-versum/${repo.name}/contents/cover.png`);
                if(res.ok){
                    const data = await res.json();
                    coverURL = data.download_url || coverURL;
                }
            } catch(e){}

            repoDiv.innerHTML = `
                <div class="repo-img"><img src="${coverURL}" alt="${repo.name}"/></div>
                <h3>${repo.name}</h3>
                <a href="${repo.html_url}" target="_blank"> &gt; Zum Repository</a>
                <p>updated at: ${new Date(repo.pushed_at).toLocaleString()}</p>
            `;
            if(i % 2 === 0) leftCol.appendChild(repoDiv);
            else rightCol.appendChild(repoDiv);
        })();
    });
});

// --- IMAGE GALLERY ---
async function loadGallery() {
    const res = await fetch('images/index.json');
    const images = await res.json();
    const container = document.getElementById('images-container');
    container.innerHTML = '';

    images.filter(img => img.show).forEach(img => {
        const card = document.createElement('div');
        card.classList.add('image-card');
        card.innerHTML = `
            <img src="images/${img.filename}" alt="${img.description || img.filename}" />
            <div class="image-info">
                <p>${img.date_taken || ''}</p>
                <p>${img.description || ''}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

loadGallery();