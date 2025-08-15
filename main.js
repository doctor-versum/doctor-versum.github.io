// README laden und anzeigen
async function fetchReadme() {
    const url = "https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/README.md";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Fehler beim Abrufen der README.md:", error);
        return null;
    }
}

function updateImageClassesBySrcSuffix() {
    const images = document.querySelectorAll('#readme img');

    images.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
            // aktuell leer, kann für weitere Bild-Klassen genutzt werden
        }
    });
}

// README rendern
fetchReadme().then((text) => {
    const readmeContentElement = document.getElementById("readme-content");
    const toggleBtn = document.getElementById("toggleReadme");
    readmeContentElement.innerHTML = marked.parse(text);

    const imgs = readmeContentElement.querySelectorAll('img');
    imgs.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
            img.setAttribute('src', `https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/${src}`);
        }
        if (src.endsWith('#gh-light-mode-only')) {
            img.classList.add('gh-light-mode-only');
        } else if (src.endsWith('#gh-dark-mode-only')) {
            img.classList.add('gh-dark-mode-only');
        }
    });

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

// Repos laden und anzeigen
fetch("https://api.github.com/users/doctor-versum/repos")
    .then(response => response.json())
    .then(repos => {
        const leftCol = document.getElementById("left-col");
        const rightCol = document.getElementById("right-col");

        repos
          .filter(repo => repo.name !== "doctor-versum" && repo.name !== "doctor-versum.github.io")
          .forEach((repo, index) => {
              const repoDiv = document.createElement("div");
              repoDiv.classList.add("repo");

              (async () => {
                  let coverURL = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
                  try {
                      const coverResponse = await fetch(`https://api.github.com/repos/doctor-versum/${repo.name}/contents/cover.png`);
                      if (coverResponse.ok) {
                          const coverData = await coverResponse.json();
                          if (coverData && coverData.download_url) {
                              coverURL = coverData.download_url;
                          }
                      }
                  } catch (error) {
                      console.error("Kein Cover gefunden für " + repo.name, error);
                  }

                  repoDiv.innerHTML = `
                      <div class="repo-img">
                          <img src="${coverURL}" alt="${repo.name}" />
                      </div>
                      <h3>${repo.name}</h3>
                      <a href="${repo.html_url}" target="_blank"> &gt; Zum Repository</a>
                      <p>updated at: ${new Date(repo.pushed_at).toLocaleString()} (${new Date(repo.pushed_at).toUTCString()})</p>
                  `;

                  if (index % 2 === 0) {
                      leftCol.appendChild(repoDiv);
                  } else {
                      rightCol.appendChild(repoDiv);
                  }
              })();
          });
    })
    .catch(error => console.error("Fehler beim Abrufen der Repositories:", error));

// ------------------------
// Tab-System & Galerie
// ------------------------
function handleHashChange() {
    const hash = location.hash.replace('#','') || 'home';
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.hash === hash);
    });
    document.getElementById('home-section').style.display = (hash === 'home') ? 'block' : 'none';
    document.getElementById('images-section').style.display = (hash === 'images') ? 'block' : 'none';

    if(hash === 'images') loadGallery();
}

window.addEventListener('hashchange', handleHashChange);
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        location.hash = btn.dataset.hash;
    });
});

async function loadGallery() {
    const galleryContainer = document.getElementById('gallery');
    if(galleryContainer.dataset.loaded) return;
    try {
        const res = await fetch('./images/index.json');
        const images = await res.json();
        galleryContainer.innerHTML = '';
        images.forEach(img => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `
                <img src="./images/${img.filename}" alt="${img.description}">
                <div class="info">
                    ${img.date_taken ? `<span class="date">${img.date_taken}</span>` : ''}
                    ${img.description ? `<p>${img.description}</p>` : ''}
                </div>
            `;
            galleryContainer.appendChild(div);
        });
        galleryContainer.dataset.loaded = "true";
    } catch(e) {
        console.error("Fehler beim Laden der Galerie", e);
        galleryContainer.innerHTML = '<p>Gallery could not be loaded.</p>';
    }
}

// initial Hash-Handling
handleHashChange();