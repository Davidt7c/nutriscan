# NutriScan mit Claude Code — Schritt für Schritt

Alles, was du am PC tun musst. Arbeite die Sessions **der Reihe nach** ab. Zwischen den Sessions immer `/clear`.

---

## Vorbereitung (einmalig)

**1. Ordner + Dateien**

Ordner `nutriscan` unter Dokumente, darin:
- `nutriscan-final.html`
- `claude-code-prompts.md`

**2. Git Bash öffnen und reingehen**

```
cd ~/Documents/nutriscan
ls
```
`ls` muss beide Dateien zeigen. Falls Fehler: probier `cd ~/Dokumente/nutriscan`.

**3. Claude Code starten**

```
claude
```

**4. Prüfen, dass dein Pro-Abo genutzt wird (nicht API-Abrechnung)**

Im Claude-Code-Fenster eintippen:
```
/status
```
Da muss dein Abo stehen, nicht "API". Falls doch API: Claude Code beenden, in Git Bash `unset ANTHROPIC_API_KEY` eingeben, `claude` neu starten.

---

## Modell-Wahl — die Faustregel

Modell wechseln mit `/model` (dann auswählen) oder direkt `/model sonnet`.

| Wofür | Modell | Warum |
|---|---|---|
| Planen, Architektur, knifflige Logik | **Opus** | denkt gründlicher |
| Bauen, umschreiben, Dateien aufteilen | **Sonnet** | schnell + spart Kontingent |
| Kleinkram (Umbenennen, Formatieren) | **Haiku** | am sparsamsten |

**Fürs ganze Projekt gilt:** Standard = **Sonnet**. Opus nur in Session 0 (Kontext/Plan) und Session 4b (Logik-Review).

---

## Session 0 · Projekt-Gedächtnis anlegen  →  Modell: **Opus**

```
/model opus
```

Dann diesen Befehl eingeben:
```
/init
```
Claude Code legt eine `CLAUDE.md` an (das Langzeit-Gedächtnis fürs Projekt).

Danach **den kompletten Block "0 · Projekt-Kontext"** aus `claude-code-prompts.md` kopieren und mit diesem Satz davor einfügen:

> Speichere den folgenden Projekt-Kontext dauerhaft in CLAUDE.md, damit er in allen späteren Sessions gilt. Antworte danach nur kurz mit einer Bestätigung, baue noch nichts:

*(dann den Kontext-Block einfügen und Enter)*

**Danach:**
```
/clear
```

---

## Session 1 · Aufteilen in saubere Dateien  →  Modell: **Sonnet**

```
/model sonnet
```
Dann den Block **"Session 1"** aus der Prompt-Datei einfügen.

Läuft ein paar Minuten. Claude Code fragt zwischendurch nach Erlaubnis für Datei-Änderungen → mit **y** bestätigen.

**Am Ende prüfen:** In Git Bash (zweites Fenster) `ls` → es müssen `index.html`, `css/`, `js/` und `README.md` existieren.

```
/clear
```

---

## Session 2 · Lokal testen  →  Modell: **Sonnet**

Block **"Session 2"** einfügen.

Claude Code startet einen lokalen Server und nennt dir eine Adresse wie `http://localhost:8000`.
→ **Diese Adresse im Browser öffnen.** Hier funktioniert die echte Barcode-Suche zum ersten Mal!

**Selbst testen:** Barcode `3017624010701` (Nutella) eintippen. Kommt ein Ergebnis?
Falls etwas falsch aussieht, schreib es Claude Code direkt: *"Bei Produkt X fehlt/stimmt Y nicht, bitte korrigieren."*

Server stoppen: im Terminal **Strg + C**.

```
/clear
```

---

## Session 3 · Online stellen (HTTPS)  →  Modell: **Sonnet**

Block **"Session 3"** einfügen. Claude Code richtet Git ein und erklärt dir die GitHub-Schritte.

Was du dabei selbst tun musst:
1. Auf **github.com** einloggen (oder kostenlos registrieren).
2. Neues Repository anlegen, Name z. B. `nutriscan`, **Public**, ohne README.
3. Die `git push`-Befehle ausführen, die Claude Code dir gibt.
4. Im Repository: **Settings → Pages → Branch: main → Save**.
5. Nach ~2 Minuten bekommst du deine URL: `https://DEINNAME.github.io/nutriscan/`

**Diese URL auf iPad und Handy öffnen** — ab hier läuft alles: Suche und Kamera.

```
/clear
```

---

## Session 4 · iPad-Kamera robust machen  →  Modell: **Sonnet**

Block **"Session 4"** einfügen.

**Danach:** Auf dem iPad die URL öffnen, Kamera erlauben, echtes Produkt scannen.
Funktioniert etwas nicht, beschreib es Claude Code genau (*"iPad Safari: Kamerabild kommt, aber es erkennt keinen Code"*).

Nach jeder Änderung wieder hochladen:
```
git add . && git commit -m "Kamera-Fix" && git push
```

```
/clear
```

---

## Session 4b · Logik-Fehler suchen  →  Modell: **Opus**

```
/model opus
```
Block **"Session 4b"** einfügen. Das ist der Cola-Zero-Fix — hier lohnt sich Opus, weil es ums Durchdenken geht.

Claude Code listet dir auf, was jedes Ziel bewertet. **Lies das durch** und sag, wenn dir etwas komisch vorkommt.

```
/clear
```

---

## Session 5 · Politur & Erweiterungen  →  Modell: **Sonnet**

Erst wenn alles läuft. Block "Session 5" — **einzeln**, nicht alles auf einmal.

---

## Die wichtigsten Befehle

| Befehl | Was es tut |
|---|---|
| `/clear` | Kontext leeren (zwischen Sessions!) |
| `/model sonnet` | Modell wechseln |
| `/status` | Zeigt Abo/Modell/Verbrauch |
| `/help` | Alle Befehle |
| **Strg + C** | Laufenden Vorgang abbrechen |
| **Shift + Tab** | Plan-Modus (erst planen, dann bauen) |

## Wenn's klemmt

- **Claude Code macht zu viel auf einmal:** Strg+C, dann *"Mach nur Schritt X, sonst nichts."*
- **Etwas kaputt gegangen:** `git checkout .` macht ungespeicherte Änderungen rückgängig.
- **Kontingent knapp:** `/status` prüfen, auf Sonnet oder Haiku wechseln, öfter `/clear`.
- **Du verstehst eine Antwort nicht:** einfach fragen — *"Erklär mir das nochmal einfach."*
