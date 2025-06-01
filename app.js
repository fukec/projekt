// Anglina - Progressive Web App pro učení anglických slovíček
class AnglinaApp {
    constructor() {
        this.currentScreen = 'homeScreen';
        this.vocabulary = [];
        this.tests = [];
        this.settings = {
            theme: 'auto',
            defaultTestLength: 10
        };
        this.currentTest = null;
        this.currentFlashcards = [];
        this.currentFlashcardIndex = 0;
        this.isFlashcardFlipped = false;
        this.editingWordId = null;
        this.deferredPrompt = null;

        this.init();
    }

    init() {
        this.loadData();
        this.initServiceWorker();
        this.initTheme();
        this.bindEvents();
        this.updateUI();
        this.populateCategories();
        this.showScreen('homeScreen');
        this.initPWA();
    }

    // PWA Initialization
    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(this.createServiceWorker())
                .then(registration => {
                    console.log('Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('Service Worker registration failed');
                });
        }
    }

    createServiceWorker() {
        const swCode = `
            const CACHE_NAME = 'anglina-v1';
            const urlsToCache = [
                './',
                './index.html',
                './style.css',
                './app.js'
            ];

            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(urlsToCache))
                );
            });

            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request)
                        .then(response => {
                            return response || fetch(event.request);
                        })
                );
            });
        `;

        const blob = new Blob([swCode], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
    }

    initPWA() {
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installAppBtn').style.display = 'block';
        });

        document.getElementById('installAppBtn').addEventListener('click', () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted PWA install');
                    }
                    this.deferredPrompt = null;
                });
            }
        });
    }

    // Data Management
    loadData() {
        // Load vocabulary
        const savedVocabulary = localStorage.getItem('anglina-vocabulary');
        if (savedVocabulary) {
            this.vocabulary = JSON.parse(savedVocabulary);
        } else {
            // Initialize with sample data
            this.vocabulary = [
                {id: 1, english: "hello", czech: "ahoj", category: "základní", difficulty: 1, lastTested: null, timesCorrect: 0, timesWrong: 0},
                {id: 2, english: "goodbye", czech: "sbohem", category: "základní", difficulty: 1, lastTested: null, timesCorrect: 0, timesWrong: 0},
                {id: 3, english: "thank you", czech: "děkuji", category: "základní", difficulty: 1, lastTested: null, timesCorrect: 0, timesWrong: 0},
                {id: 4, english: "apple", czech: "jablko", category: "jídlo", difficulty: 1, lastTested: null, timesCorrect: 0, timesWrong: 0},
                {id: 5, english: "water", czech: "voda", category: "jídlo", difficulty: 1, lastTested: null, timesCorrect: 0, timesWrong: 0}
            ];
            this.saveVocabulary();
        }

        // Load tests
        const savedTests = localStorage.getItem('anglina-tests');
        if (savedTests) {
            this.tests = JSON.parse(savedTests);
        }

        // Load settings
        const savedSettings = localStorage.getItem('anglina-settings');
        if (savedSettings) {
            this.settings = {...this.settings, ...JSON.parse(savedSettings)};
        }
    }

    saveVocabulary() {
        localStorage.setItem('anglina-vocabulary', JSON.stringify(this.vocabulary));
    }

    saveTests() {
        localStorage.setItem('anglina-tests', JSON.stringify(this.tests));
    }

    saveSettings() {
        localStorage.setItem('anglina-settings', JSON.stringify(this.settings));
    }

    // Theme Management
    initTheme() {
        const savedTheme = this.settings.theme;
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
        } else if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            document.getElementById('themeToggle').textContent = '🌙';
        } else {
            document.documentElement.removeAttribute('data-color-scheme');
            document.getElementById('themeToggle').textContent = '🌙';
        }
        document.getElementById('themeSelect').value = savedTheme;
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-color-scheme', 'light');
            document.getElementById('themeToggle').textContent = '🌙';
            this.settings.theme = 'light';
        } else {
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
            this.settings.theme = 'dark';
        }
        document.getElementById('themeSelect').value = this.settings.theme;
        this.saveSettings();
    }

    // Event Binding
    bindEvents() {
        // Navigation
        document.querySelectorAll('[data-screen]').forEach(button => {
            button.addEventListener('click', (e) => {
                const screen = e.target.closest('[data-screen]').dataset.screen;
                this.showScreen(screen);
            });
        });

        document.querySelectorAll('[data-back]').forEach(button => {
            button.addEventListener('click', (e) => {
                const screen = e.target.closest('[data-back]').dataset.back;
                this.showScreen(screen);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.saveSettings();
            this.initTheme();
        });

        // Test events
        document.getElementById('startTest').addEventListener('click', () => this.startTest());
        document.getElementById('submitAnswer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('retakeTest').addEventListener('click', () => this.retakeTest());
        document.getElementById('backToHome').addEventListener('click', () => this.showScreen('homeScreen'));

        // Flashcard events
        document.getElementById('startFlashcards').addEventListener('click', () => this.startFlashcards());
        document.getElementById('flipCard').addEventListener('click', () => this.flipFlashcard());
        document.getElementById('prevFlashcard').addEventListener('click', () => this.previousFlashcard());
        document.getElementById('nextFlashcard').addEventListener('click', () => this.nextFlashcard());
        document.getElementById('exitFlashcards').addEventListener('click', () => this.exitFlashcards());

        // Word management
        document.getElementById('addWordBtn').addEventListener('click', () => this.showAddWordModal());
        document.getElementById('wordForm').addEventListener('submit', (e) => this.saveWord(e));
        document.getElementById('closeModal').addEventListener('click', () => this.hideWordModal());
        document.getElementById('cancelWordEdit').addEventListener('click', () => this.hideWordModal());
        document.getElementById('searchWords').addEventListener('input', (e) => this.filterWords(e.target.value));
        document.getElementById('filterCategory').addEventListener('change', (e) => this.filterWords());
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());

        // CSV Import
        document.getElementById('uploadArea').addEventListener('click', () => {
            document.getElementById('csvFileInput').click();
        });
        document.getElementById('csvFileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('confirmImport').addEventListener('click', () => this.confirmCSVImport());
        document.getElementById('cancelImport').addEventListener('click', () => this.cancelCSVImport());

        // Settings
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());

        // Enter key for answer input
        document.getElementById('userAnswer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Modal background click
        document.getElementById('wordModal').addEventListener('click', (e) => {
            if (e.target.id === 'wordModal') {
                this.hideWordModal();
            }
        });

        // Drag and drop for CSV
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processCSVFile(files[0]);
            }
        });
    }

    // Navigation
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        // Update UI for specific screens
        if (screenId === 'manageScreen') {
            this.updateWordsList();
        } else if (screenId === 'statsScreen') {
            this.updateStatistics();
        } else if (screenId === 'testScreen') {
            this.resetTest();
        } else if (screenId === 'flashcardsScreen') {
            this.resetFlashcards();
        }
    }

    // Test Functionality
    startTest() {
        const testType = document.getElementById('testType').value;
        const questionCount = document.getElementById('questionCount').value;
        const category = document.getElementById('testCategory').value;

        let filteredWords = this.vocabulary;
        if (category !== 'all') {
            filteredWords = this.vocabulary.filter(word => word.category === category);
        }

        if (filteredWords.length === 0) {
            alert('Žádná slovíčka k testování!');
            return;
        }

        // Shuffle and limit questions
        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
        const count = questionCount === 'all' ? shuffled.length : parseInt(questionCount);
        const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));

        this.currentTest = {
            type: testType,
            words: selectedWords,
            currentIndex: 0,
            correctAnswers: 0,
            answers: []
        };

        this.showTestQuestion();
    }

    showTestQuestion() {
        const test = this.currentTest;
        const word = test.words[test.currentIndex];

        // Hide setup, show question
        document.getElementById('testSetup').classList.add('hidden');
        document.getElementById('testProgress').classList.remove('hidden');
        document.getElementById('testQuestion').classList.remove('hidden');

        // Update progress
        const progress = ((test.currentIndex + 1) / test.words.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `Otázka ${test.currentIndex + 1} z ${test.words.length}`;

        // Setup question based on type
        if (test.type === 'en-cz') {
            document.getElementById('questionText').textContent = 'Přeložte do češtiny:';
            document.getElementById('questionWord').textContent = word.english;
            this.showTextInput();
        } else if (test.type === 'cz-en') {
            document.getElementById('questionText').textContent = 'Přeložte do angličtiny:';
            document.getElementById('questionWord').textContent = word.czech;
            this.showTextInput();
        } else if (test.type === 'multiple-choice') {
            document.getElementById('questionText').textContent = 'Vyberte správný překlad:';
            document.getElementById('questionWord').textContent = word.english;
            this.showMultipleChoice(word);
        }

        // Clear previous answer
        document.getElementById('userAnswer').value = '';
        document.getElementById('userAnswer').focus();
    }

    showTextInput() {
        document.getElementById('answerInput').classList.remove('hidden');
        document.getElementById('multipleChoice').classList.add('hidden');
    }

    showMultipleChoice(correctWord) {
        document.getElementById('answerInput').classList.add('hidden');
        document.getElementById('multipleChoice').classList.remove('hidden');

        // Get 3 wrong answers
        const wrongWords = this.vocabulary
            .filter(w => w.id !== correctWord.id && w.category === correctWord.category)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Combine with correct answer and shuffle
        const choices = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);

        const choiceButtons = document.getElementById('choiceButtons');
        choiceButtons.innerHTML = '';

        choices.forEach(word => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = word.czech;
            button.dataset.wordId = word.id;
            button.addEventListener('click', () => this.selectChoice(button, correctWord.id));
            choiceButtons.appendChild(button);
        });
    }

    selectChoice(button, correctId) {
        const selectedId = parseInt(button.dataset.wordId);
        const isCorrect = selectedId === correctId;

        // Disable all buttons and show results
        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.disabled = true;
            const btnWordId = parseInt(btn.dataset.wordId);
            if (btnWordId === correctId) {
                btn.classList.add('correct');
            } else if (btnWordId === selectedId && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        // Record answer and proceed
        this.currentTest.answers.push({
            correct: isCorrect,
            userAnswer: button.textContent,
            correctAnswer: this.vocabulary.find(w => w.id === correctId).czech
        });

        if (isCorrect) {
            this.currentTest.correctAnswers++;
        }

        setTimeout(() => this.nextQuestion(), 1500);
    }

    submitAnswer() {
        const userAnswer = document.getElementById('userAnswer').value.trim().toLowerCase();
        const test = this.currentTest;
        const word = test.words[test.currentIndex];

        let correctAnswer, isCorrect;

        if (test.type === 'en-cz') {
            correctAnswer = word.czech.toLowerCase();
            isCorrect = userAnswer === correctAnswer;
        } else if (test.type === 'cz-en') {
            correctAnswer = word.english.toLowerCase();
            isCorrect = userAnswer === correctAnswer;
        }

        test.answers.push({
            correct: isCorrect,
            userAnswer: document.getElementById('userAnswer').value,
            correctAnswer: test.type === 'en-cz' ? word.czech : word.english
        });

        if (isCorrect) {
            test.correctAnswers++;
            word.timesCorrect++;
        } else {
            word.timesWrong++;
        }

        word.lastTested = new Date().toISOString();
        this.saveVocabulary();

        this.nextQuestion();
    }

    nextQuestion() {
        this.currentTest.currentIndex++;

        if (this.currentTest.currentIndex >= this.currentTest.words.length) {
            this.showTestResults();
        } else {
            this.showTestQuestion();
        }
    }

    showTestResults() {
        const test = this.currentTest;
        const score = Math.round((test.correctAnswers / test.words.length) * 100);

        // Hide question, show results
        document.getElementById('testProgress').classList.add('hidden');
        document.getElementById('testQuestion').classList.add('hidden');
        document.getElementById('testResult').classList.remove('hidden');

        // Update result display
        document.getElementById('correctCount').textContent = test.correctAnswers;
        document.getElementById('wrongCount').textContent = test.words.length - test.correctAnswers;
        document.getElementById('scorePercentage').textContent = `${score}%`;

        // Save test result
        const testResult = {
            id: Date.now(),
            score: score,
            totalQuestions: test.words.length,
            correctAnswers: test.correctAnswers,
            date: new Date().toISOString(),
            type: test.type
        };

        this.tests.unshift(testResult);
        this.saveTests();
    }

    retakeTest() {
        this.resetTest();
        this.startTest();
    }

    resetTest() {
        this.currentTest = null;
        document.getElementById('testSetup').classList.remove('hidden');
        document.getElementById('testProgress').classList.add('hidden');
        document.getElementById('testQuestion').classList.add('hidden');
        document.getElementById('testResult').classList.add('hidden');
    }

    // Flashcards Functionality
    startFlashcards() {
        const category = document.getElementById('flashcardCategory').value;

        let words = this.vocabulary;
        if (category !== 'all') {
            words = this.vocabulary.filter(word => word.category === category);
        }

        if (words.length === 0) {
            alert('Žádná slovíčka k procvičování!');
            return;
        }

        this.currentFlashcards = [...words].sort(() => Math.random() - 0.5);
        this.currentFlashcardIndex = 0;
        this.isFlashcardFlipped = false;

        document.getElementById('flashcardSetup').classList.add('hidden');
        document.getElementById('flashcardContainer').classList.remove('hidden');

        this.showCurrentFlashcard();
    }

    showCurrentFlashcard() {
        const word = this.currentFlashcards[this.currentFlashcardIndex];
        
        document.getElementById('flashcardCounter').textContent = 
            `${this.currentFlashcardIndex + 1} z ${this.currentFlashcards.length}`;
        
        document.getElementById('flashcardFront').textContent = word.english;
        document.getElementById('flashcardBack').textContent = word.czech;

        // Reset flip state
        this.isFlashcardFlipped = false;
        document.getElementById('flashcard').classList.remove('flipped');

        // Update navigation buttons
        document.getElementById('prevFlashcard').disabled = this.currentFlashcardIndex === 0;
        document.getElementById('nextFlashcard').disabled = 
            this.currentFlashcardIndex === this.currentFlashcards.length - 1;
    }

    flipFlashcard() {
        this.isFlashcardFlipped = !this.isFlashcardFlipped;
        const flashcard = document.getElementById('flashcard');
        
        if (this.isFlashcardFlipped) {
            flashcard.classList.add('flipped');
        } else {
            flashcard.classList.remove('flipped');
        }
    }

    previousFlashcard() {
        if (this.currentFlashcardIndex > 0) {
            this.currentFlashcardIndex--;
            this.showCurrentFlashcard();
        }
    }

    nextFlashcard() {
        if (this.currentFlashcardIndex < this.currentFlashcards.length - 1) {
            this.currentFlashcardIndex++;
            this.showCurrentFlashcard();
        }
    }

    exitFlashcards() {
        this.resetFlashcards();
    }

    resetFlashcards() {
        this.currentFlashcards = [];
        this.currentFlashcardIndex = 0;
        this.isFlashcardFlipped = false;
        
        document.getElementById('flashcardSetup').classList.remove('hidden');
        document.getElementById('flashcardContainer').classList.add('hidden');
    }

    // Word Management
    updateWordsList() {
        const category = document.getElementById('filterCategory').value;
        const search = document.getElementById('searchWords').value.toLowerCase();

        let filteredWords = this.vocabulary;

        if (category !== 'all') {
            filteredWords = filteredWords.filter(word => word.category === category);
        }

        if (search) {
            filteredWords = filteredWords.filter(word => 
                word.english.toLowerCase().includes(search) ||
                word.czech.toLowerCase().includes(search)
            );
        }

        const wordsList = document.getElementById('wordsList');
        wordsList.innerHTML = '';

        filteredWords.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.innerHTML = `
                <div class="word-info">
                    <div class="word-text">${word.english}</div>
                    <div class="word-text">${word.czech}</div>
                    <span class="word-category">${word.category}</span>
                </div>
                <div class="word-actions">
                    <button class="btn btn--outline edit-word" data-id="${word.id}">✏️</button>
                    <button class="btn btn--outline delete-word" data-id="${word.id}">🗑️</button>
                </div>
            `;
            
            wordsList.appendChild(wordItem);
        });

        // Bind edit and delete events
        document.querySelectorAll('.edit-word').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wordId = parseInt(e.target.dataset.id);
                this.editWord(wordId);
            });
        });

        document.querySelectorAll('.delete-word').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wordId = parseInt(e.target.dataset.id);
                this.deleteWord(wordId);
            });
        });
    }

    filterWords() {
        this.updateWordsList();
    }

    showAddWordModal() {
        this.editingWordId = null;
        document.getElementById('modalTitle').textContent = 'Přidat slovíčko';
        document.getElementById('englishInput').value = '';
        document.getElementById('czechInput').value = '';
        document.getElementById('categoryInput').value = '';
        document.getElementById('wordModal').classList.remove('hidden');
        document.getElementById('englishInput').focus();
    }

    editWord(wordId) {
        const word = this.vocabulary.find(w => w.id === wordId);
        if (!word) return;

        this.editingWordId = wordId;
        document.getElementById('modalTitle').textContent = 'Upravit slovíčko';
        document.getElementById('englishInput').value = word.english;
        document.getElementById('czechInput').value = word.czech;
        document.getElementById('categoryInput').value = word.category;
        document.getElementById('wordModal').classList.remove('hidden');
        document.getElementById('englishInput').focus();
    }

    saveWord(e) {
        e.preventDefault();
        
        const english = document.getElementById('englishInput').value.trim();
        const czech = document.getElementById('czechInput').value.trim();
        const category = document.getElementById('categoryInput').value.trim();

        if (!english || !czech || !category) {
            alert('Vyplňte všechna pole!');
            return;
        }

        if (this.editingWordId) {
            // Edit existing word
            const word = this.vocabulary.find(w => w.id === this.editingWordId);
            if (word) {
                word.english = english;
                word.czech = czech;
                word.category = category;
            }
        } else {
            // Add new word
            const newWord = {
                id: Date.now(),
                english,
                czech,
                category,
                difficulty: 1,
                lastTested: null,
                timesCorrect: 0,
                timesWrong: 0
            };
            this.vocabulary.push(newWord);
        }

        this.saveVocabulary();
        this.populateCategories();
        this.updateWordsList();
        this.hideWordModal();
    }

    deleteWord(wordId) {
        if (confirm('Opravdu chcete smazat toto slovíčko?')) {
            this.vocabulary = this.vocabulary.filter(w => w.id !== wordId);
            this.saveVocabulary();
            this.populateCategories();
            this.updateWordsList();
        }
    }

    hideWordModal() {
        document.getElementById('wordModal').classList.add('hidden');
    }

    // CSV Import/Export
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processCSVFile(file);
        }
    }

    processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const csv = e.target.result;
            this.parseCSV(csv);
        };
        reader.readAsText(file);
    }

    parseCSV(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            alert('CSV soubor musí obsahovat alespoň hlavičku a jeden řádek dat!');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        if (headers.length < 3 || headers[0] !== 'english' || headers[1] !== 'czech' || headers[2] !== 'category') {
            alert('Nesprávný formát CSV! Očekávané sloupce: english,czech,category');
            return;
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 3 && values[0] && values[1] && values[2]) {
                data.push({
                    english: values[0],
                    czech: values[1],
                    category: values[2]
                });
            }
        }

        if (data.length === 0) {
            alert('Žádná platná data k importu!');
            return;
        }

        this.showCSVPreview(data);
    }

    showCSVPreview(data) {
        const previewTable = document.getElementById('previewTable');
        let html = `
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Anglicky</th>
                        <th>Česky</th>
                        <th>Kategorie</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(row => {
            html += `
                <tr>
                    <td>${row.english}</td>
                    <td>${row.czech}</td>
                    <td>${row.category}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        previewTable.innerHTML = html;

        this.csvImportData = data;
        document.getElementById('csvPreview').classList.remove('hidden');
    }

    confirmCSVImport() {
        if (!this.csvImportData) return;

        let importedCount = 0;
        const maxId = Math.max(...this.vocabulary.map(w => w.id), 0);

        this.csvImportData.forEach((row, index) => {
            // Check for duplicates
            const exists = this.vocabulary.some(w => 
                w.english.toLowerCase() === row.english.toLowerCase() &&
                w.czech.toLowerCase() === row.czech.toLowerCase()
            );

            if (!exists) {
                const newWord = {
                    id: maxId + index + 1,
                    english: row.english,
                    czech: row.czech,
                    category: row.category,
                    difficulty: 1,
                    lastTested: null,
                    timesCorrect: 0,
                    timesWrong: 0
                };
                this.vocabulary.push(newWord);
                importedCount++;
            }
        });

        this.saveVocabulary();
        this.populateCategories();
        alert(`Úspěšně importováno ${importedCount} slovíček!`);
        this.cancelCSVImport();
    }

    cancelCSVImport() {
        this.csvImportData = null;
        document.getElementById('csvPreview').classList.add('hidden');
        document.getElementById('csvFileInput').value = '';
    }

    exportCSV() {
        if (this.vocabulary.length === 0) {
            alert('Žádná slovíčka k exportu!');
            return;
        }

        const csv = ['english,czech,category'];
        this.vocabulary.forEach(word => {
            csv.push(`${word.english},${word.czech},${word.category}`);
        });

        this.downloadCSV(csv.join('\n'), 'slovicka.csv');
    }

    exportAllData() {
        const allData = {
            vocabulary: this.vocabulary,
            tests: this.tests,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const csv = ['type,data'];
        csv.push(`vocabulary,"${JSON.stringify(this.vocabulary).replace(/"/g, '""')}"`);
        csv.push(`tests,"${JSON.stringify(this.tests).replace(/"/g, '""')}"`);
        csv.push(`settings,"${JSON.stringify(this.settings).replace(/"/g, '""')}"`);

        this.downloadCSV(csv.join('\n'), 'anglina-zaloha.csv');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearAllData() {
        if (confirm('Opravdu chcete vymazat všechna data? Tato akce je nevratná!')) {
            localStorage.removeItem('anglina-vocabulary');
            localStorage.removeItem('anglina-tests');
            localStorage.removeItem('anglina-settings');
            location.reload();
        }
    }

    // Statistics
    updateStatistics() {
        // Total words
        document.getElementById('totalWords').textContent = this.vocabulary.length;

        // Total tests
        document.getElementById('totalTests').textContent = this.tests.length;

        // Average score
        const avgScore = this.tests.length > 0 
            ? Math.round(this.tests.reduce((sum, test) => sum + test.score, 0) / this.tests.length)
            : 0;
        document.getElementById('avgScore').textContent = `${avgScore}%`;

        // Total categories
        const categories = [...new Set(this.vocabulary.map(w => w.category))];
        document.getElementById('totalCategories').textContent = categories.length;

        // Recent tests
        const recentTestsList = document.getElementById('recentTestsList');
        if (this.tests.length === 0) {
            recentTestsList.innerHTML = '<p>Zatím žádné testy</p>';
        } else {
            const recentTests = this.tests.slice(0, 5);
            recentTestsList.innerHTML = recentTests.map(test => `
                <div class="test-history-item">
                    <div>
                        <div>${this.getTestTypeName(test.type)}</div>
                        <div class="test-date">${new Date(test.date).toLocaleDateString('cs-CZ')}</div>
                    </div>
                    <div class="test-score">${test.score}%</div>
                    <div>${test.correctAnswers}/${test.totalQuestions}</div>
                </div>
            `).join('');
        }
    }

    getTestTypeName(type) {
        switch (type) {
            case 'en-cz': return 'EN → CZ';
            case 'cz-en': return 'CZ → EN';
            case 'multiple-choice': return 'Výběr z možností';
            default: return type;
        }
    }

    // UI Updates
    populateCategories() {
        const categories = [...new Set(this.vocabulary.map(w => w.category))].sort();
        
        const selects = [
            'testCategory',
            'flashcardCategory', 
            'filterCategory'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            const currentValue = select.value;
            
            // Clear existing options except "all"
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                if (option.value !== 'all') {
                    option.remove();
                }
            });

            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });

            // Restore selection if still valid
            if (categories.includes(currentValue)) {
                select.value = currentValue;
            }
        });
    }

    updateUI() {
        this.updateStatistics();
        if (this.currentScreen === 'manageScreen') {
            this.updateWordsList();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.anglinaApp = new AnglinaApp();
});