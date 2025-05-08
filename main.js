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
    const readmeElement = document.getElementById("readme");
    readmeElement.innerHTML = marked.parse(text);
});