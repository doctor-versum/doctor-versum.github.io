import os
import json
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime

# Pfade relativ zum Skript
BASE_DIR = Path(__file__).resolve().parent.parent / "images"
INDEX_FILE = BASE_DIR / "index.json"

# Unterstützte Bildformate
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def read_index():
    """Bestehendes index.json laden oder leere Struktur erstellen."""
    if INDEX_FILE.exists():
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print("⚠ index.json ist beschädigt – leere Struktur wird erstellt.")
                return []
    return []


def save_index(data):
    """index.json speichern."""
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_exif_data(image_path):
    """Liest EXIF-Daten aus und gibt date_taken (YYYYMMDD) und description zurück."""
    try:
        with Image.open(image_path) as img:
            exif_data = img.getexif()
            exif = {TAGS.get(tag): value for tag, value in exif_data.items() if tag in TAGS}

            # Datum im Format YYYYMMDD extrahieren
            date_taken = None
            if "DateTimeOriginal" in exif:
                try:
                    dt = datetime.strptime(exif["DateTimeOriginal"], "%Y:%m:%d %H:%M:%S")
                    date_taken = int(dt.strftime("%Y%m%d"))
                except Exception:
                    pass

            description = ""
            if "ImageDescription" in exif and isinstance(exif["ImageDescription"], str):
                description = exif["ImageDescription"]

            return date_taken, description
    except Exception:
        return None, ""


def main():
    index_data = read_index()

    # Für schnellen Zugriff in dict umwandeln (key = filename)
    index_dict = {entry["filename"]: entry for entry in index_data}

    # Alle Bilddateien im Ordner finden
    all_files = [f for f in BASE_DIR.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS]

    found_filenames = set()

    for img_path in all_files:
        filename = img_path.name
        found_filenames.add(filename)

        if filename not in index_dict:
            print(f"➕ Neue Datei: {filename}")
            date_taken, description = get_exif_data(img_path)
            index_dict[filename] = {
                "filename": filename,
                "date_taken": date_taken,
                "description": description or "",
                "show": True
            }
        else:
            # Falls Datei schon existiert, sicherstellen, dass show=True gesetzt wird
            index_dict[filename]["show"] = True

    # Prüfen, ob alte Einträge nicht mehr existieren
    for entry in index_dict.values():
        if entry["filename"] not in found_filenames:
            if entry.get("show", True) is True:
                print(f"🚫 Datei nicht gefunden: {entry['filename']} – show=False gesetzt")
            entry["show"] = False

    # Zurück in Liste konvertieren (Original-Reihenfolge beibehalten, wenn möglich)
    updated_list = []
    for entry in index_data:
        updated_list.append(index_dict[entry["filename"]])
    # Neue Einträge am Ende anfügen
    for filename, entry in index_dict.items():
        if filename not in {e["filename"] for e in updated_list}:
            updated_list.append(entry)

    save_index(updated_list)
    print("✅ index.json aktualisiert.")


if __name__ == "__main__":
    main()