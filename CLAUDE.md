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
