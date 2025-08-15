document.addEventListener("DOMContentLoaded", () => {

    // === Tabs Setup ===
    const tabs = ["home", "images"];
    const tabContainer = document.createElement("div");
    tabContainer.id = "tab-container";
    tabContainer.classList.add("tab-container");

    tabs.forEach(tab => {
        const btn = document.createElement("button");
        btn.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        btn.classList.add("tab-btn");
        btn.dataset.tab = tab;
        btn.addEventListener("click", () => {
            window.location.hash = tab === "home" ? "" : tab;
        });
        tabContainer.appendChild(btn);
    });

    document.body.prepend(tabContainer);

    // === Container-Referenzen ===
    const readmeContainer = document.getElementById("readme-container");
    const readmeContentElement = document.getElementById("readme-content");
    const toggleBtn = document.getElementById("toggleReadme");

    const repoContainer = document.getElementById("repo-container");
    const leftCol = document.getElementById("left-col");
    const rightCol = document.getElementById("right-col");

    // === README laden ===
    async function fetchReadme() {
        const url = "https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/README.md";
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.text();
        } catch (e) {
            console.error("Fehler beim Abrufen der README.md:", e);
            return null;
        }
    }

    fetchReadme().then(text => {
        if (!text) return;
        readmeContentElement.innerHTML = marked.parse(text);

        // Bilder fixen
        const imgs = readmeContentElement.querySelectorAll('img');
        imgs.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http')) {
                img.src = `https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/${src}`;
            }
        });

        // Collapse Button
        if (readmeContentElement.scrollHeight > readmeContentElement.clientHeight) {
            readmeContentElement.classList.add("collapsed");
            toggleBtn.style.display = "inline-block";
            toggleBtn.textContent = "show more";
        }
        toggleBtn.addEventListener("click", () => {
            if (readmeContentElement.classList.contains("collapsed")) {
                readmeContentElement.classList.remove("collapsed");
                readmeContentElement.style.maxHeight = "none";
                toggleBtn.textContent = "hide";
            } else {
                readmeContentElement.classList.add("collapsed");
                readmeContentElement.style.maxHeight = null;
                toggleBtn.textContent = "show more";
            }
        });
    });

    // === Repositories laden ===
    fetch("https://api.github.com/users/doctor-versum/repos")
        .then(res => res.json())
        .then(repos => {
            repos
                .filter(r => r.name !== "doctor-versum" && r.name !== "doctor-versum.github.io")
                .forEach((repo, index) => {
                    const repoDiv = document.createElement("div");
                    repoDiv.classList.add("repo");

                    (async () => {
                        let coverURL = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
                        try {
                            const coverResponse = await fetch(`https://api.github.com/repos/doctor-versum/${repo.name}/contents/cover.png`);
                            if (coverResponse.ok) {
                                const coverData = await coverResponse.json();
                                if (coverData?.download_url) coverURL = coverData.download_url;
                            }
                        } catch (err) {
                            console.warn("Kein Cover für", repo.name, err);
                        }

                        repoDiv.innerHTML = `
                            <div class="repo-img"><img src="${coverURL}" alt="${repo.name}"></div>
                            <h3>${repo.name}</h3>
                            <a href="${repo.html_url}" target="_blank">> Zum Repository</a>
                            <p>updated at: ${new Date(repo.pushed_at).toLocaleString()}</p>
                        `;

                        if (index % 2 === 0) leftCol.appendChild(repoDiv);
                        else rightCol.appendChild(repoDiv);
                    })();
                });
        })
        .catch(err => console.error(err));

    // === Image-Gallery ===
    async function fetchImages() {
        try {
            const res = await fetch("./images/index.json");
            if (!res.ok) throw new Error("Image index fetch failed");
            const images = await res.json();
            return images.filter(img => img.show);
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async function renderImages() {
        const images = await fetchImages();
        const gallery = document.createElement("div");
        gallery.id = "image-gallery";
        gallery.classList.add("image-gallery");

        images.forEach(img => {
            const card = document.createElement("div");
            card.classList.add("image-card");

            card.innerHTML = `
                <img src="./images/${img.filename}" alt="${img.description}">
                <div class="image-info">
                    ${img.date_taken ? `<p>${img.date_taken}</p>` : ""}
                    ${img.description ? `<p>${img.description}</p>` : ""}
                </div>
            `;
            gallery.appendChild(card);
        });

        document.body.appendChild(gallery);
    }

    // === Tab Handling ===
    function showTab(tab) {
        document.querySelectorAll(".tab-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.tab === tab);
        });

        if (tab === "images") {
            readmeContainer.style.display = "none";
            repoContainer.style.display = "none";
            if (!document.getElementById("image-gallery")) renderImages();
        } else {
            readmeContainer.style.display = "block";
            repoContainer.style.display = "flex";
            const gallery = document.getElementById("image-gallery");
            if (gallery) gallery.remove();
        }
    }

    window.addEventListener("hashchange", () => showTab(location.hash.slice(1) || "home"));
    showTab(location.hash.slice(1) || "home");

});