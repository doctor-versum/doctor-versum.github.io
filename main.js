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

fetchReadme().then((text) => {
    console.log(text);
    const readmeContentElement = document.getElementById("readme-content");
    const toggleBtn = document.getElementById("toggleReadme");
    // README-Inhalt via marked parsen und einfügen
    readmeContentElement.innerHTML = marked.parse(text);
    
    // Für alle <img>-Tags: Falls das src nicht mit http oder https startet, 
    // wird der Prefix hinzugefügt.
    const imgs = readmeContentElement.querySelectorAll('img');
    imgs.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
            img.setAttribute('src', `https://raw.githubusercontent.com/doctor-versum/doctor-versum/main/${src}`);
        }
    });

    // Initial prüfen: wenn der Inhalt höher ist als der initiale max-height()-Wert,
    // dann den Inhalt einklappen und den Button sichtbar machen.
    if (readmeContentElement.scrollHeight > readmeContentElement.clientHeight) {
        readmeContentElement.classList.add("collapsed");
        toggleBtn.style.display = "inline-block";
        toggleBtn.textContent = "show more";
    }
    toggleBtn.addEventListener("click", () => {
        if (readmeContentElement.classList.contains("collapsed")) {
            // Aufklappen: max-height wird aufgehoben, sodass der gesamte Text sichtbar wird
            readmeContentElement.classList.remove("collapsed");
            readmeContentElement.style.maxHeight = "none";
            toggleBtn.textContent = "hide";
        } else {
            // Einklappen: max-height über CSS zurücksetzen
            readmeContentElement.classList.add("collapsed");
            readmeContentElement.style.maxHeight = null; // entfernt den Inline-Stil
            toggleBtn.textContent = "show more";
        }
    });
});

// Neue Funktion: Repositories abrufen und anzeigen
fetch("https://api.github.com/users/doctor-versum/repos")
    .then(response => response.json())
    .then(repos => {
        const leftCol = document.getElementById("left-col");
        const rightCol = document.getElementById("right-col");
        console.log("Repositories:", repos);
        // Filtere die Repos "doctor-versum" und "doctor-versum.github.io" heraus
        repos
          .filter(repo => repo.name !== "doctor-versum" && repo.name !== "doctor-versum.github.io")
          .forEach((repo, index) => {
              const repoDiv = document.createElement("div");
              repoDiv.classList.add("repo");
              
              // Asynchroner Aufruf, um das Cover-Bild abzuholen
              (async () => {
                  let coverURL = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
                  try {
                      const coverResponse = await fetch(`https://api.github.com/repos/doctor-versum/${repo.name}/contents/cover.png`);
                      if (coverResponse.ok) {
                          const coverData = await coverResponse.json();
                          console.log("Cover URL:", coverData);
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
                  
                  // Abwechselnd in left-col und right-col einfügen
                  if (index % 2 === 0) {
                      leftCol.appendChild(repoDiv);
                  } else {
                      rightCol.appendChild(repoDiv);
                  }
              })();
          });
    })
    .catch(error => console.error("Fehler beim Abrufen der Repositories:", error));