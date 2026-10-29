# Mieciu X50 Card

Autorska, darmowa karta Lovelace dla **Dreame X50 Ultra** w Home Assistant — styl sci‑fi holograficzny.
Działa na encjach integracji **[Tasshack/dreame-vacuum](https://github.com/Tasshack/dreame-vacuum)** (integracja pozostaje nienaruszona).

> Status: **v1.0.0**. Nowe wersje publikują się automatycznie po zmianie numeru w `package.json`.

## Instalacja

### HACS (repozytorium niestandardowe)
1. HACS → menu ⋮ → *Niestandardowe repozytoria*.
2. URL: `https://github.com/voltronicpl/mieciu-x50-card`, kategoria **Dashboard**.
3. Zainstaluj **Mieciu X50 Card**, przeładuj przeglądarkę (Ctrl+F5).

### Ręcznie
1. Skopiuj `dist/mieciu-x50-card.js` do `/config/www/mieciu-x50-card.js`.
2. Ustawienia → Dashboardy → ⋮ → Zasoby → Dodaj: `/local/mieciu-x50-card.js`, typ **Moduł JavaScript**.

## Konfiguracja

```yaml
type: custom:mieciu-x50-card
entity: vacuum.mieciu
map_entity: camera.mieciu_map   # opcjonalnie, domyślnie camera.<prefix>_map
name: Mieciu
```

| Opcja | Domyślnie | Opis |
|---|---|---|
| `entity` | — (wymagane) | encja `vacuum.*` |
| `map_entity` | `camera.<prefix>_map` | kamera mapy z integracji |
| `name` | `Mieciu` | nazwa w nagłówku |
| `model` | `Dreame X50 Ultra` | podpis pod nazwą |
| `prefix` | object_id odkurzacza | prefiks do auto‑wykrywania encji |
| `entities` | — | ręczne nadpisanie dowolnej encji, np. `battery: sensor.inna` |
| `map_filter` | `holo` | `none` = mapa w oryginalnych kolorach |
| `default_tab` | `map` | `map`, `cleaning`, `station`, `service`, `history`, `settings` |
| `map_rotate` | `auto` | obrót widoku mapy: `auto` (poziomo), `0`, `90`, `180`, `270` — tylko wygląd karty |
| `map_3d` | `true` | `false` = mapa płaska (2D) na starcie |
| `robot_image` | — | własny obraz robota (np. `/local/robot.png`) zamiast rysunku SVG |
| `station_image` | — | własny obraz stacji zamiast rysunku SVG |
| `station_name` | `Dreame PowerDock` | podpis panelu stacji |
| `graphics` | `photo` | `svg` = rysunki wektorowe zamiast grafik z mockupu |

Najlepiej na pełnej szerokości (widok *Panel* lub sekcja na całą szerokość).

## Co działa w v0.1.0

- Stan robota liczony z wielu atrybutów (nie tylko `status`) → grafika: w stacji / sprząta / wraca / pauza / mycie / suszenie / opróżnianie / błąd.
- Stacja: zbiorniki pokazują **tylko status** z sensorów. Integracja nie podaje poziomu wody w litrach ani %, więc karta ich nie wymyśla.
- Mapa z kamery + pan/zoom + 2D/3D, klikalne środki pokoi.
- Start / Pauza / Do bazy, tryb, moc ssania, nawilżanie mopa.
- Sprzątanie wybranych pokoi (`dreame_vacuum.vacuum_clean_segment`).
- Akcje stacji i resety eksploatacji — zawsze z oknem potwierdzenia.
- Serwis, historia z miniaturami, ustawienia per pokój (podgląd), wszystkie przełączniki.

## Tryby mapy (od v1.2.0)

Przyciski pod mapą: **Pokój · Strefa · Punkt · Zakazana · Edycja mapy**. Rysowanie działa w widoku 2D (karta sama przełącza).

- **Strefa** — przeciągnij po mapie (max 4 strefy), wybierz 1×/2×/3×, *Sprzątaj strefy* → `dreame_vacuum.vacuum_clean_zone`. Lista stref też w *Pomieszczenia → Strefy*.
- **Punkt** — kliknij w mapę → *Jedź tutaj* (`vacuum_goto`) albo *Sprzątaj punkt* (`vacuum_clean_spot`).
- **Zakazana** — zakaz wjazdu / bez mopa / wirtualna ściana. Rysujesz, klikasz istniejącą żeby usunąć, *Zapisz* wysyła całość (`vacuum_set_restricted_zone` nadpisuje wszystkie strefy mapy) — z potwierdzeniem.
- **Edycja mapy** — zaznacz pokoje etykietami: *Zmień nazwę* (`vacuum_rename_segment`), *Połącz (2)* (`vacuum_merge_segments`), *Podziel* — narysuj linię (`vacuum_split_segments`). Połącz/podziel z potwierdzeniem.
- **Ustawienia per pokój** (zakładka Sprzątanie) — komórki to listy wyboru, zmiana zapisuje się od razu (`select.select_option`).

Jeśli integracja nie ma danej usługi, przycisk jest wyłączony z podpowiedzią.

## Budowanie

```bash
npm run build   # -> dist/mieciu-x50-card.js (bez zależności)
npm test
```

## Prywatność

Repo nie zawiera map, tokenów kamer, SSID ani IP. Nie wrzucaj eksportów stanów do repo (`.gitignore` je blokuje).

## Licencja

MIT. Projekt niezależny — nie zawiera kodu ani grafik z płatnych kart.
