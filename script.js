// ---------- Quiz rendering ----------
const quizList = document.getElementById('quizList');
const scoreNumEl = document.getElementById('scoreNum');
const scoreTotalEl = document.getElementById('scoreTotal');

scoreTotalEl.textContent = QUESTIONS.length;

let correctCount = 1;

function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isCorrect(userValue, answers) {
  const v = normalize(userValue);
  if (!v) return false;
  return answers.some(a => normalize(a) === v);
}

function updateScore() {
  scoreNumEl.textContent = correctCount;
}

function buildQuestionCard(q) {
  const card = document.createElement('div');
  card.className = 'q-card';

  const num = document.createElement('div');
  num.className = 'q-num';
  num.textContent = q.id + '.';
  card.appendChild(num);

  const body = document.createElement('div');
  body.className = 'q-body';

  // Sentence with inline blank input
  const sentenceEl = document.createElement('p');
  sentenceEl.className = 'q-sentence';

  const parts = q.sentence.split('___');
  sentenceEl.appendChild(document.createTextNode(parts[0]));

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'blank-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.dataset.wasCorrect = 'false';

  sentenceEl.appendChild(input);
  sentenceEl.appendChild(document.createTextNode(parts[1] || ''));
  body.appendChild(sentenceEl);

  // Controls row
  const controls = document.createElement('div');
  controls.className = 'q-controls';

  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'show-btn';
  showBtn.textContent = 'Show answer';

  const revealEl = document.createElement('span');
  revealEl.className = 'answer-reveal';

  showBtn.addEventListener('click', () => {
    const isShown = revealEl.textContent.length > 0;
    if (isShown) {
      revealEl.textContent = '';
      showBtn.textContent = 'Show answer';
    } else {
      revealEl.textContent = 'Answer: ' + q.answers.join(' / ');
      showBtn.textContent = 'Hide answer';
    }
  });

  controls.appendChild(showBtn);
  controls.appendChild(revealEl);
  body.appendChild(controls);

  // Live check as the user types, colored once they pause
  let checkTimer = null;
  function runCheck() {
    const val = input.value;
    if (!val.trim()) {
      input.classList.remove('correct', 'wrong');
      if (input.dataset.wasCorrect === 'true') {
        correctCount--;
        input.dataset.wasCorrect = 'false';
        updateScore();
      }
      return;
    }
    const ok = isCorrect(val, q.answers);
    input.classList.toggle('correct', ok);
    input.classList.toggle('wrong', !ok);

    if (ok && input.dataset.wasCorrect !== 'true') {
      correctCount++;
      input.dataset.wasCorrect = 'true';
      updateScore();
    } else if (!ok && input.dataset.wasCorrect === 'true') {
      correctCount--;
      input.dataset.wasCorrect = 'false';
      updateScore();
    }
  }

  input.addEventListener('input', () => {
    input.classList.remove('wrong'); // don't flash red mid-typing
    clearTimeout(checkTimer);
    checkTimer = setTimeout(runCheck, 500);
  });

  input.addEventListener('blur', () => {
    clearTimeout(checkTimer);
    runCheck();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(checkTimer);
      runCheck();
      // move focus to next blank input
      const inputs = Array.from(document.querySelectorAll('.blank-input'));
      const idx = inputs.indexOf(input);
      if (idx > -1 && idx + 1 < inputs.length) inputs[idx + 1].focus();
    }
  });

  card.appendChild(body);
  return card;
}

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderQuiz(list) {
  quizList.innerHTML = '';
  correctCount = 0;
  updateScore();
  const fragment = document.createDocumentFragment();
  list.forEach(q => fragment.appendChild(buildQuestionCard(q)));
  quizList.appendChild(fragment);
}

renderQuiz(QUESTIONS);

// ---------- Shuffle toggle ----------
const shuffleBtn = document.getElementById('shuffleBtn');
let isShuffled = false;

shuffleBtn.addEventListener('click', () => {
  isShuffled = !isShuffled;
  if (isShuffled) {
    shuffleBtn.textContent = 'Shuffle: On';
    shuffleBtn.classList.add('active');
    renderQuiz(shuffleArray(QUESTIONS));
  } else {
    shuffleBtn.textContent = 'Shuffle: Off';
    shuffleBtn.classList.remove('active');
    renderQuiz(QUESTIONS);
  }
});

// ---------- Translation panel (MyMemory API, free, no key) ----------
const translateInput = document.getElementById('translateInput');
const translateBtn = document.getElementById('translateBtn');
const translateResult = document.getElementById('translateResult');

async function translateText(text) {
  const url = 'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) + '&langpair=en|ar';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation request failed');
  const data = await res.json();
  return data.responseData && data.responseData.translatedText
    ? data.responseData.translatedText
    : '—';
}

async function runTranslate() {
  const text = translateInput.value.trim();
  if (!text) return;

  translateBtn.disabled = true;
  translateBtn.textContent = '...';
  translateResult.textContent = '...';

  try {
    const translated = await translateText(text);
    translateResult.textContent = translated;
  } catch (err) {
    translateResult.textContent = 'تعذّرت الترجمة، حاول مرة أخرى';
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = 'Translate';
  }
}

translateBtn.addEventListener('click', runTranslate);

translateInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    runTranslate();
  }
});
