# Anglina - Progressive Web App pro učení anglických slovíček

Modern Progressive Web Application pro učení anglických slovíček s podporou CSV importu a offline funkcionality.

## ✨ Hlavní funkce

### 🎯 Učení slovíček
- **Různé typy testů**: Angličtina → Čeština, Čeština → Angličtina, Multiple Choice
- **Flashcards**: Interaktivní kartičky pro procvičování
- **Kategorizace**: Organizace slovíček podle kategorií (základní, jídlo, transport, práce, volný čas)
- **Statistiky pokroku**: Sledování úspěšnosti a pokroku

### 📊 CSV Import/Export
- **Hromadný import**: Nahrajte slovíčka pomocí CSV souboru
- **Formát CSV**: `english,czech,category`
- **Validace dat**: Kontrola formátu před importem
- **Export dat**: Zálohování slovíček do CSV

### 📱 PWA (Progressive Web App)
- **Instalace do mobilu**: Aplikaci lze nainstalovat jako nativní aplikaci
- **Offline funkčnost**: Plně funkční bez internetového připojení
- **Responzivní design**: Optimalizováno pro všechna zařízení
- **Fast loading**: Service Worker pro rychlé načítání

## 🚀 Instalace a spuštění

### GitHub Pages
1. Nahrajte všechny soubory do vašeho GitHub repozitáře
2. Aktivujte GitHub Pages v nastavení repozitáře
3. Aplikace bude dostupná na `https://username.github.io/repository-name`

### Lokální spuštění
1. Stáhněte nebo klonujte repozitář
2. Otevřete `index.html` v prohlížeči
3. Pro PWA funkcionalitu doporučujeme spustit na lokálním serveru:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (s http-server)
   npx http-server
   ```

## 📖 Použití

### Přidání slovíček
1. **Manuálně**: Přes "Správa slovíček" → "Přidat nové slovíčko"
2. **CSV import**: Přes "Správa slovíček" → "Importovat CSV"

### CSV formát
Vytvořte CSV soubor s následující strukturou:
```csv
english,czech,category
hello,ahoj,základní
goodbye,sbohem,základní
apple,jablko,jídlo
car,auto,transport
```

### Spuštění testu
1. Zvolte "Test" z hlavního menu
2. Nastavte počet otázek (5-50)
3. Vyberte směr překladu
4. Vyberte typ testu
5. Začněte test

### PWA instalace
**Na Android:**
1. Otevřete aplikaci v Chrome
2. Klikněte na "Přidat na plochu" nebo použijte menu → "Přidat na plochu"

**Na iOS:**
1. Otevřete aplikaci v Safari
2. Klikněte na ikonu "Sdílet"
3. Vyberte "Přidat na plochu"

**Na Desktop:**
1. V Chrome se zobrazí ikona instalace v adresním řádku
2. Klikněte na ikonu a potvrďte instalaci

## 🛠️ Technické detaily

### Technologie
- **Vanilla JavaScript** - Bez externích závislostí
- **CSS Grid & Flexbox** - Moderní responzivní layout
- **Service Worker** - Offline funkčnost a caching
- **LocalStorage** - Perzistentní ukládání dat
- **File API** - CSV import/export

### Kompatibilita
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

### Struktura dat
```javascript
// Slovíčko
{
  id: number,
  english: string,
  czech: string,
  category: string,
  difficulty: number,
  lastTested: date,
  timesCorrect: number,
  timesWrong: number
}

// Test
{
  id: number,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  date: date,
  type: string
}
```

## 🎨 Přizpůsobení

### Změna barev
Upravte CSS proměnné v souboru `style.css`:
```css
:root {
  --color-primary: rgba(33, 128, 141, 1);
  --color-background: rgba(252, 252, 249, 1);
  /* ... další barvy */
}
```

### Přidání kategorií
Upravte pole `categories` v souboru `app.js`:
```javascript
this.categories = ["základní", "jídlo", "transport", "práce", "volný čas", "nová kategorie"];
```

## 🔧 Vývoj a přispívání

### Struktura projektu
```
anglina/
├── index.html          # Hlavní HTML soubor
├── style.css           # Styly aplikace
├── app.js              # Hlavní logika aplikace
├── manifest.json       # PWA manifest (generovaný)
├── service-worker.js   # Service Worker (generovaný)
└── README.md           # Dokumentace
```

### Přidání nových funkcí
1. Forkněte repozitář
2. Vytvořte novou větev pro vaši funkci
3. Implementujte změny
4. Otestujte na různých zařízeních
5. Vytvořte Pull Request

### Testování PWA
1. Otevřete Dev Tools (F12)
2. Přejděte na záložku "Application"
3. Zkontrolujte "Manifest" a "Service Workers"
4. Otestujte offline funkčnost v záložce "Network" (Offline mode)

## 📝 Licence

MIT License - můžete svobodně používat, upravovat a distribuovat.

## 🐛 Hlášení chyb

Pokud najdete chybu nebo máte návrh na vylepšení:
1. Vytvořte nový Issue na GitHubu
2. Popište problém nebo návrh
3. Přiložte screenshot nebo kód (pokud je relevantní)

## 📞 Podpora

- GitHub Issues pro technické problémy
- Dokumentace v tomto README
- Komentáře v kódu pro vývojáře

---

**Vytvořeno s ❤️ pro efektivní učení anglických slovíček**