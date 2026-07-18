# NutriScan

Statische Web-App, die Lebensmittel per Barcode scannt und passend zum
Ernährungsziel von 1 bis 10 bewertet. Reines HTML/CSS/JavaScript, kein
Framework, kein Backend, keine Accounts oder API-Keys.

## Projektstruktur

```
index.html          Markup + Einbindungen
css/styles.css       Gesamtes Styling
js/config.js          Bewertungs-Schwellenwerte & Listen (Allergene, Ziele, Zusatzstoffe, Öle, ...)
js/scoring.js         Bewertungslogik: quality(), fit(), evaluate()
js/data.js            Open-Food-Facts-Abruf, normalize(), EAN-Prüfung, Demo-Produkte
js/camera.js          Barcode-Scanner (BarcodeDetector + ZXing-Fallback)
js/storage.js         Verlauf, Cache, Einstellungen (localStorage) + App-Zustand
js/ui.js              Figuren (SVG), Ergebnis-Anzeige, DOM-Helfer
js/main.js            Initialisierung, Bildschirmnavigation, Event-Bindings
```

Die Module hängen über ES-`import`/`export` zusammen (`<script type="module">`),
`js/main.js` ist der Einstiegspunkt.

## Lokal starten

Da `type="module"` verwendet wird, funktioniert die App nicht direkt über
`file://` – sie braucht einen lokalen Webserver. Im Projektordner:

```
python3 -m http.server 8000
```

Danach im Browser öffnen:

```
http://localhost:8000
```

Alternativ z. B. `npx serve` oder die "Live Server"-Erweiterung in VS Code.

## Bewertungslogik anpassen

Fast alle Zahlen und Listen, die in die Bewertung einfließen (Nährwert-
Schwellen, Allergen-/Ziel-Definitionen, Zusatzstoff- und Öl-Listen, NOVA-
Basiswerte, Blend-Gewichtungen), stehen kommentiert in `js/config.js`.
Die eigentlichen Formeln/Verzweigungen bleiben in `js/scoring.js`.
