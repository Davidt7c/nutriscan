# NutriScan — Prompts für Claude Code

**So nutzt du das:** Leg die Datei `nutriscan-final.html` in einen neuen Ordner, öffne ihn mit Claude Code, und schick die Prompts **einzeln, nacheinander** — eine Session pro Aufgabe. Zwischen den Aufgaben `/clear` eingeben, damit der Kontext klein bleibt. Standardmäßig Sonnet nutzen. **Wichtig:** Setz keinen `ANTHROPIC_API_KEY` in der Shell, sonst rechnet Claude Code pro Token statt über dein Pro-Abo (`/status` zeigt den Modus).

---

## 0 · Projekt-Kontext (als Erstes einfügen, oder als CLAUDE.md speichern)

```
Projekt: "NutriScan" – eine Web-App, die Lebensmittel per Barcode scannt und von 1 bis 10 bewertet, passend zum Ernährungsziel des Nutzers.

Tech-Rahmen (bitte einhalten):
- Rein statische Website: HTML + CSS + JavaScript, KEIN Framework, KEIN Backend, keine Accounts, keine Secrets/API-Keys.
- Wird auf GitHub Pages gehostet (HTTPS).
- Produktdaten: Open Food Facts API v2 (kostenlos, kein Key): https://world.openfoodfacts.org/api/v2/product/{barcode}.json — Erfolg steht in data.status===1.
- Barcode-Scan: native BarcodeDetector (Android/Chrome) mit ZXing als Fallback (iPad/Safari).
- Design: hell, freundlich, an codecheck.info angelehnt – Maskottchen + Ampel-Bewertungsring. Fonts Fredoka (Display) + Nunito (Text).

Bewertungslogik (bereits im Prototyp umgesetzt, bitte beibehalten):
- Allergen-Vorfilter = harter Deckel: enthält das Produkt ein gewähltes Allergen, Score auf 1, rot markiert. Nie "garantiert frei" sagen.
- Bis zu 3 Ziele gleichzeitig; das schwächste Ziel dominiert die Bewertung.
- Zwei Ebenen: Ziel-Fit (passt es zum Ziel?) + Grund-Qualität (NOVA/Zutaten/Zusatzstoffe = Primal-Score). Grund-Qualität ist Boden (gesundes Produkt fällt nicht unter ~5) und Deckel (stark verarbeitetes fällt trotz gutem Fit).
- Rote Flaggen zielunabhängig: Alkohol > 1,2 % vol → Score 1; Transfette/gehärtete Fette → Deckel.
- Süßstoff: bei "Wenig Zucker" ok, bei "Primal" Abzug – kein harter Deckel.
- Zutaten-Textsuche muss verneinungssicher sein ("ohne Palmöl", "palmölfrei" NICHT als Treffer).
- Kleinmengen (Öl, Gewürz, Sauce): Salz/Zucker/Fett-Abzüge dämpfen.
- Ehrlichkeit: fehlen Daten fürs Ziel, KEINE erfundene Zahl, sondern "zu wenig Daten".
- "Gut zu wissen"-Hinweise (Rohmilch/Listerien, Koffein, Süßstoff) stehen NEBEN dem Score, verändern ihn nicht.
- Verlauf & Einstellungen pro Gerät in localStorage.

WICHTIGE REGEL (Verarbeitungsgrad / Grund-Qualität):
Die Grund-Qualität (NOVA/Verarbeitung/Zusatzstoffe) darf den Score NUR beeinflussen, wenn der Nutzer "Primal" gewählt hat – oder als klar begründeter, milder Boden ("gesund, aber nicht optimal"). Sie darf ein Produkt NICHT nach unten deckeln, wenn Primal nicht gewählt ist. Beispiel des Problems: Bei Zielen "Energie" + "Wenig Zucker" soll eine Cola Zero gut abschneiden (kein Zucker, Kohlenhydrate vorhanden) – der Verarbeitungs-Deckel darf sie hier NICHT abwerten, weil der Nutzer Verarbeitung nie abgefragt hat. Faustregel: Der Deckel/Malus für "stark verarbeitet" greift nur, wenn Primal unter den gewählten Zielen ist. Der Qualitäts-BODEN (Aufwertung gesunder, unverarbeiteter Produkte) darf dagegen immer mitlaufen – nur die ABwertung ist an Primal gebunden. Prüfe jedes Ziel einzeln auf diese Logik.

Es gibt einen funktionierenden Single-File-Prototyp: nutriscan-final.html. Der ist die Referenz für Aussehen UND Verhalten.
```

---

## Session 1 · Prototyp in saubere Dateien aufteilen

```
In diesem Ordner liegt nutriscan-final.html – ein funktionierender Single-File-Prototyp von NutriScan. Teile ihn in ein sauberes, wartbares statisches Projekt auf, OHNE das Verhalten oder das Design zu ändern:

- index.html (nur Markup + Einbindungen)
- css/styles.css
- js/ aufgeteilt in sinnvolle Module:
  - config.js  → ALLE Bewertungs-Schwellenwerte, Listen (Zusatzstoffe, Öle, Allergene, Ziele) an EINER Stelle gebündelt, gut kommentiert, damit man Regeln leicht anpassen kann
  - scoring.js → quality(), fit(), evaluate()
  - data.js    → Open-Food-Facts-Abruf + normalize() + EAN-Prüfung
  - camera.js  → Scanner (BarcodeDetector + ZXing)
  - storage.js → Verlauf, Cache, Einstellungen (localStorage)
  - ui.js      → Figuren (SVG), Anzeige, Screens
  - main.js    → Initialisierung + Events

Kommentare auf Deutsch. Lege eine README.md mit Anleitung zum lokalen Start an. Prüfe am Ende sorgfältig, dass die App sich exakt wie der Prototyp verhält.
```

## Session 2 · Lokal testen & echte Daten prüfen

```
Starte einen lokalen Webserver (python3 -m http.server 8000) und sag mir die genaue URL zum Öffnen. Teste dann die echte Barcode-Suche gegen die Open-Food-Facts-API mit diesen Codes und zeig mir jeweils das Ergebnis:
- Nutella: 3017624010701
- ein echtes Bier deiner Wahl (um das Alkohol-Feld zu prüfen)

Falls Nährwert-Felder fehlen, falsch gemappt sind oder Fehler auftreten, korrigiere normalize() in data.js. Prüfe besonders, ob das Alkohol-Feld korrekt gelesen wird und der Alkohol-Deckel greift.
```

## Session 3 · Auf GitHub Pages veröffentlichen (HTTPS)

```
Richte das Projekt für GitHub Pages ein: git init, sinnvolle .gitignore, erster Commit. Erkläre mir dann Schritt für Schritt mit den genauen Befehlen, wie ich das Repo zu GitHub pushe und GitHub Pages aktiviere, sodass ich eine HTTPS-URL bekomme. Die App muss rein statisch bleiben (kein Backend, keine Secrets). Sag mir am Ende, wie ich die fertige URL auf iPad und Laptop öffne.
```

## Session 4 · Kamera-Scan auf dem iPad robust machen

```
Der Kamera-Scan nutzt native BarcodeDetector, mit ZXing als Fallback für iPad/Safari. Geh die Kamera-Logik in camera.js durch und mach sie robust:
- Wir holen den Kamerastream selbst per getUserMedia – stelle sicher, dass ZXing damit sauber zusammenarbeitet und KONTINUIERLICH scannt (nicht nur einmal).
- Rückkamera bevorzugen (facingMode environment), Stream beim Verlassen sauber stoppen.
- EAN-Prüfziffer validieren, klare Fehlermeldungen bei Fehlscans, händlerinterne Codes (Beginn mit 2) abfangen.
Erkläre mir, wie ich den Scan auf dem iPad über die HTTPS-URL teste, und was ich tun muss, falls Safari keine Kameraerlaubnis gibt.
```

## Session 4b · Bewertungslogik auf "durchsickernde" Faktoren prüfen

```
Geh die Bewertungslogik (scoring.js) systematisch durch und suche nach Faktoren, die in den Score einfließen, obwohl der Nutzer das entsprechende Ziel gar nicht gewählt hat. Leitregel: Jeder Malus/Deckel muss zu einem GEWÄHLTEN Ziel gehören.

Konkret prüfen und korrigieren:
1. Verarbeitungsgrad/Grund-Qualität darf nur ABwerten, wenn "Primal" gewählt ist (siehe Regel im Projekt-Kontext). Der Qualitäts-Boden (Aufwertung) darf bleiben.
2. Teste diese Kombinationen und sag mir die Scores – sie müssen plausibel sein:
   - Cola Zero + Ziele [Energie, Wenig Zucker]  → sollte GUT sein (nicht durch Verarbeitung gedeckelt)
   - Cola Zero + Ziel [Primal]                  → sollte SCHLECHT sein
   - Proteinriegel + Ziel [Muskelaufbau]        → gut, aber Hinweis auf Verarbeitung nur wenn er den Score wirklich deckelt
   - Diät-Limo + Ziel [Wenig Zucker]            → gut; Süßstoff nur als "Gut zu wissen", kein Malus
3. Geh jedes Ziel einzeln durch: Welche Nährwerte/Zutaten fließen ein? Gehört jeder davon wirklich zu DIESEM Ziel? Liste mir pro Ziel auf, was es bewertet, damit ich es gegenprüfen kann.
4. Achte darauf, dass rote Flaggen (Alkohol, Transfette) und der Allergen-Deckel weiterhin IMMER greifen – die sind absichtlich zielunabhängig.

Ändere nur die Wertungslogik, nicht das Design.
```

## Session 5 · (Optional, später) v2-Erweiterungen

```
Baue diese Erweiterungen, jede als klar abgegrenzten Schritt – frag nach, bevor du mehrere gleichzeitig anfängst:
(a) Harte Ernährungsform-Filter: vegan, vegetarisch, glutenfrei, laktosefrei (über labels_tags / allergens_tags), als Vorfilter wie bei den Allergenen.
(b) "Produkt nicht gefunden"-Ablauf mit Link, es bei Open Food Facts einzutragen, plus optionale manuelle Nährwert-Eingabe für eine einmalige Bewertung.
(c) Zwei Produkte vergleichen (nebeneinander, gleiche Ziele).
(d) Portions-Umrechnung: bei Kleinmengen-Kategorien über serving_size statt pro 100 g rechnen.
```

---

**Reihenfolge-Tipp:** Sessions 1–3 bringen dich zur gehosteten, funktionierenden App (Barcode-Suche live). Session 4 macht die iPad-Kamera rund. Session 5 ist Zukunftsmusik – erst wenn die Basis sitzt.
