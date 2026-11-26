// The Rukarta Russian Verbs Exam: 80 questions per part, one at a time, entirely in Russian.
// Data comes from exam-data.js. The exam lives in the URL hash (#exam-1, #exam-2); progress is saved in
// localStorage so a refresh does not lose it. The score and the review of mistakes come at the end.
(function () {
  'use strict';

  var exams = window.RUKARTA_EXAMS || {};
  var root = document.querySelector('[data-course-exam]');
  if (!root) return;

  var text = {
    title: function (n) { return 'Экзамен Rukarta по русским глаголам. Часть ' + n; },
    count: function (n) { return n + ' вопросов'; },
    intro: 'В каждом вопросе шесть вариантов, правильный только один. Время не ограничено. Подсказок нет: правильные ответы и разбор вы увидите в конце.',
    start: 'Начать',
    resume: 'Продолжить',
    restart: 'Начать заново',
    question: function (i, n) { return 'Вопрос ' + i + ' из ' + n; },
    prev: 'Назад',
    next: 'Далее',
    finish: 'Завершить',
    unanswered: function (n) { return 'Без ответа: ' + n + '. Завершить всё равно?'; },
    result: 'Результат',
    score: function (a, b) { return a + ' из ' + b; },
    mistakes: 'Разбор ошибок',
    none: 'Ошибок нет.',
    yours: 'Ваш ответ',
    right: 'Правильный ответ',
    skipped: 'нет ответа',
    levels: [[90, 'Отлично'], [75, 'Очень хорошо'], [60, 'Хорошо'], [0, 'Нужно ещё поработать']],
    back: '\u2190 Все категории'
  };

  var current = null;   // { part, items, answers, index, done }

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function ru(tag, className, content) {
    var node = el(tag, className, content);
    node.lang = 'ru';
    return node;
  }

  function storageKey(part) { return 'rukarta-exam-' + part; }

  function load(part, length) {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey(part)) || 'null');
      if (saved && saved.answers && saved.answers.length === length) return saved;
    } catch (e) { /* storage unavailable: start fresh */ }
    return null;
  }

  function save() {
    try {
      window.localStorage.setItem(storageKey(current.part), JSON.stringify({
        answers: current.answers, index: current.index, done: current.done
      }));
    } catch (e) { /* storage unavailable: progress is kept in memory only */ }
  }

  function clearSaved(part) {
    try { window.localStorage.removeItem(storageKey(part)); } catch (e) { /* ignore */ }
  }

  function answeredCount() {
    return current.answers.filter(function (a) { return a !== null; }).length;
  }

  function header(withBack) {
    var wrap = el('div');
    var back = el('a', 'back', text.back);
    back.href = '#';
    wrap.appendChild(back);
    var h = el('h1', '', text.title(current.part));
    h.lang = 'ru';
    h.tabIndex = -1;
    h.dataset.focus = '1';
    wrap.appendChild(h);
    return wrap;
  }

  function show(node) {
    root.textContent = '';
    root.appendChild(node);
    var focus = node.querySelector('[data-focus]');
    if (focus) focus.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function renderIntro() {
    var page = el('div');
    page.appendChild(header());
    var intro = ru('p', '', text.intro);
    page.appendChild(intro);
    var meta = ru('p', 'exam-meta', text.count(current.items.length));
    page.appendChild(meta);
    var progress = answeredCount();
    var row = el('div', 'exam-actions');
    var start = ru('button', 'btn btn--mint', progress && !current.done ? text.resume : text.start);
    start.type = 'button';
    start.addEventListener('click', function () {
      if (current.done) { renderResult(); return; }
      renderQuestion();
    });
    row.appendChild(start);
    if (progress) {
      var again = ru('button', 'btn btn--line', text.restart);
      again.type = 'button';
      again.addEventListener('click', function () {
        clearSaved(current.part);
        current.answers = current.items.map(function () { return null; });
        current.index = 0;
        current.done = false;
        renderIntro();
      });
      row.appendChild(again);
    }
    page.appendChild(row);
    show(page);
  }

  function stemNode(item) {
    var p = ru('p', 'exam-stem');
    var parts = item.stem.split('___');
    parts.forEach(function (part, i) {
      if (i) p.appendChild(el('span', 'exam-blank', '\u2003'));
      p.appendChild(document.createTextNode(part));
    });
    return p;
  }

  function renderQuestion() {
    var items = current.items;
    var item = items[current.index];
    var page = el('div', 'exam-q');
    page.appendChild(header());

    var bar = el('div', 'exam-progress');
    var fill = el('span');
    fill.style.width = Math.round(((current.index + 1) / items.length) * 100) + '%';
    bar.appendChild(fill);
    page.appendChild(bar);
    page.appendChild(ru('p', 'exam-count', text.question(current.index + 1, items.length)));
    page.appendChild(stemNode(item));

    var list = el('div', 'exam-options');
    list.setAttribute('role', 'radiogroup');
    item.options.forEach(function (option, i) {
      var label = el('label', 'exam-option');
      var input = el('input');
      input.type = 'radio';
      input.name = 'q';
      input.value = String(i);
      input.checked = current.answers[current.index] === i;
      input.addEventListener('change', function () {
        current.answers[current.index] = i;
        save();
      });
      label.appendChild(input);
      label.appendChild(ru('span', '', option));
      list.appendChild(label);
    });
    page.appendChild(list);

    var nav = el('div', 'exam-actions');
    var prev = ru('button', 'btn btn--line', text.prev);
    prev.type = 'button';
    prev.disabled = current.index === 0;
    prev.addEventListener('click', function () { current.index -= 1; save(); renderQuestion(); });
    nav.appendChild(prev);
    var last = current.index === items.length - 1;
    var next = ru('button', 'btn btn--mint', last ? text.finish : text.next);
    next.type = 'button';
    next.addEventListener('click', function () {
      if (last) {
        var missing = items.length - answeredCount();
        if (missing && !window.confirm(text.unanswered(missing))) return;
        current.done = true;
        save();
        renderResult();
        return;
      }
      current.index += 1;
      save();
      renderQuestion();
    });
    nav.appendChild(next);
    page.appendChild(nav);
    show(page);
  }

  function renderResult() {
    var items = current.items;
    var right = 0;
    var wrong = [];
    items.forEach(function (item, i) {
      if (current.answers[i] === item.answer) right += 1;
      else wrong.push(i);
    });
    var percent = Math.round((right / items.length) * 100);
    var level = text.levels.filter(function (l) { return percent >= l[0]; })[0][1];

    var page = el('div');
    page.appendChild(header());
    page.appendChild(ru('h2', 'exam-score', text.result + ': ' + text.score(right, items.length)));
    page.appendChild(ru('p', 'exam-meta', percent + '% \u00b7 ' + level));

    var row = el('div', 'exam-actions');
    var again = ru('button', 'btn btn--line', text.restart);
    again.type = 'button';
    again.addEventListener('click', function () {
      clearSaved(current.part);
      current.answers = items.map(function () { return null; });
      current.index = 0;
      current.done = false;
      renderIntro();
    });
    row.appendChild(again);
    page.appendChild(row);

    page.appendChild(ru('h2', 'exam-review-h', text.mistakes));
    if (!wrong.length) page.appendChild(ru('p', '', text.none));
    wrong.forEach(function (i) {
      var item = items[i];
      var card = el('div', 'exam-review');
      card.appendChild(ru('p', 'exam-count', text.question(i + 1, items.length)));
      card.appendChild(stemNode(item));
      var mine = current.answers[i];
      var dl = el('dl');
      var yours = el('div', 'exam-bad');
      yours.appendChild(ru('dt', '', text.yours));
      yours.appendChild(ru('dd', '', mine === null ? text.skipped : item.options[mine]));
      var ok = el('div', 'exam-good');
      ok.appendChild(ru('dt', '', text.right));
      ok.appendChild(ru('dd', '', item.options[item.answer]));
      dl.appendChild(yours);
      dl.appendChild(ok);
      card.appendChild(dl);
      if (item.note) card.appendChild(ru('p', 'exam-note', item.note));
      page.appendChild(card);
    });
    show(page);
  }

  // Called by route(): opens the exam named by the hash, or returns false when the hash is not an exam.
  function route() {
    var match = /^exam-([12])$/.exec(decodeURIComponent(window.location.hash.slice(1)));
    root.hidden = !match;
    if (!match) return;
    var part = Number(match[1]);
    var items = exams[part] || [];
    if (!items.length) return;
    var saved = load(part, items.length);
    current = {
      part: part,
      items: items,
      answers: saved ? saved.answers : items.map(function () { return null; }),
      index: saved ? Math.min(saved.index || 0, items.length - 1) : 0,
      done: saved ? !!saved.done : false
    };
    document.title = text.title(part);
    renderIntro();
  }

  window.addEventListener('hashchange', route);
  route();
})();
