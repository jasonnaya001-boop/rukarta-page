// The course page: pick a category, see its base verbs laid out as a day-by-day schedule.
// Data comes from course-data.js (generated from the app's verb wheels). The category lives in the URL hash,
// so the browser's Back button and a refresh both work.
(function () {
  'use strict';

  var categories = window.RUKARTA_COURSE || [];  var language = document.documentElement.lang === 'es' ? 'es' : 'en';

  var text = {
    en: {
      verbs: function (n) { return n + ' base verbs'; },
      summary: function (verbs, combos) {
        return verbs + ' base verbs and ' + combos + ' prefix combinations.';
      },
      days: function (n) { return n + (n === 1 ? ' day' : ' days') + ' of study, then the quiz.'; },
      day: function (n) { return 'Day ' + n; },
      prefixes: function (n) { return n + (n === 1 ? ' prefix' : ' prefixes'); },
      imperfective: 'Imperfective',
      perfective: 'Perfective',
      oneDirection: 'One direction',
      manyDirections: 'Many directions',
      baseTitle: 'Base verbs',
      baseText: 'Read the sentences for each verb in Rukarta. Three verb pairs a day (imperfective and perfective), no prefixes yet.',
      partNames: ['Part 1', 'Part 2'],
      part: function (name, weeks) { return name + ' \u00b7 about ' + weeks + ' weeks'; },
      prefixTitle: 'Prefixes',
      review: 'Review',
      prefixText: function () {
        return 'Learn the prefix combinations for each verb, up to 5 a day. Words marked Review have no prefix or only one, so you just review them.';
      },
      quizTitle: function (n) { return 'Day ' + n + ': quiz'; },
      quizText: 'Take the quiz several times today, in sets of 10 sentences. Review the verbs you miss between attempts.',
      title: function (name) { return 'Rukarta: ' + name; },
      examTitle: function (n) { return 'Rukarta Russian Verbs Exam \u00b7 Part ' + n; },
      examNote: '80 questions, entirely in Russian.',
      home: 'Rukarta Official Course'
    },
    es: {
      verbs: function (n) { return n + ' verbos base'; },
      summary: function (verbs, combos) {
        return verbs + ' verbos base y ' + combos + ' combinaciones de prefijos.';
      },
      days: function (n) { return n + (n === 1 ? ' d\u00eda' : ' d\u00edas') + ' de estudio y luego el examen.'; },
      day: function (n) { return 'D\u00eda ' + n; },
      prefixes: function (n) { return n + (n === 1 ? ' prefijo' : ' prefijos'); },
      imperfective: 'Imperfectivo',
      perfective: 'Perfectivo',
      oneDirection: 'Una dirección',
      manyDirections: 'Varias direcciones',
      baseTitle: 'Verbos base',
      baseText: 'Lee las oraciones de cada verbo en Rukarta. Tres pares de verbos al d\u00eda (imperfectivo y perfectivo), sin prefijos todav\u00eda.',
      partNames: ['Parte 1', 'Parte 2'],
      part: function (name, weeks) { return name + ' \u00b7 unas ' + weeks + ' semanas'; },
      prefixTitle: 'Prefijos',
      review: 'Repaso',
      prefixText: function () {
        return 'Aprende las combinaciones de prefijos de cada verbo, hasta 5 al d\u00eda. Las palabras marcadas Repaso no tienen prefijo o solo tienen uno, as\u00ed que solo las repasas.';
      },
      quizTitle: function (n) { return 'D\u00eda ' + n + ': examen'; },
      quizText: 'Haz el examen varias veces hoy, en series de 10 oraciones. Repasa los verbos que fallaste entre intentos.',
      title: function (name) { return 'Rukarta: ' + name; },
      examTitle: function (n) { return 'Examen Rukarta de verbos rusos \u00b7 Parte ' + n; },
      examNote: '80 preguntas, totalmente en ruso.',
      home: 'Curso oficial de Rukarta'
    }
  }[language];

  var home = document.querySelector('[data-course-home]');
  var view = document.querySelector('[data-course-cat]');
  var grid = document.querySelector('[data-role="cats"]');
  var heading = document.querySelector('[data-role="cat-title"]');
  var summary = document.querySelector('[data-role="cat-summary"]');
  var schedule = document.querySelector('[data-role="schedule"]');
  if (!home || !view || !grid || !schedule) return;

  function el(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  // Base verbs: a fixed number of new verbs per day, in the app's order.
  var BASE_PER_DAY = 3;
  // Prefix combinations: up to this many per day. A verb with more than fits in a day continues on the next day.
  var PREFIXES_PER_DAY = 5;
  // Categories per part of the course, in the list's order (fewest base verbs first).
  var SEMESTER_SIZES = [7, 5];

  function chunk(items, size) {
    var out = [];
    for (var at = 0; at < items.length; at += size) out.push(items.slice(at, at + size));
    return out;
  }

  // Packs each verb's prefix combinations into days. Each item is { verb, count } for the combinations studied that day.
  // Review words (no prefix, or one) add no prefix combinations, so they are spread over the prefix days, not added as days.
  function addReviews(days, reviews) {
    if (!reviews.length) return days;
    var out = days.length ? days : chunk(reviews, BASE_PER_DAY).map(function () { return []; });
    reviews.forEach(function (verb, index) {
      out[index % out.length].push({ verb: verb, count: 0 });
    });
    return out;
  }

  function packPrefixes(verbs, cap) {
    var days = [];
    var day = [];
    var room = cap;
    verbs.forEach(function (verb) {
      var left = verb.prefixes;
      while (left > 0) {
        if (room === 0) {
          days.push(day);
          day = [];
          room = cap;
        }
        var take = Math.min(left, room);
        // "from" is where this day's prefixes start in the verb's list, so each day gets its own part of it.
        day.push({ verb: verb, count: take, from: verb.prefixes - left });
        left -= take;
        room -= take;
      }
    });
    if (day.length) days.push(day);
    return days;
  }

  function ruWord(lemma) {
    var node = el('b', '', lemma);
    node.lang = 'ru';
    return node;
  }

  // The aspect partners, so each word is learned with its pair: the imperfective and the perfective.
  function pairLine(verb) {
    var line = el('span', 'pair');
    // A motion word's imperfective is already on its direction line (идти: one direction), so it is not repeated.
    var motionWords = verb.motion ? [verb.motion.oneDirection, verb.motion.manyDirections] : [];
    var showImperfective = verb.imperfective && motionWords.indexOf(verb.imperfective) === -1;
    if (showImperfective) {
      line.appendChild(el('span', '', text.imperfective + ': '));
      line.appendChild(ruWord(verb.imperfective));
    }
    if (showImperfective && verb.perfective) line.appendChild(el('span', 'pair__sep', ' \u00b7 '));
    if (verb.perfective) {
      line.appendChild(el('span', '', text.perfective + ': '));
      line.appendChild(ruWord(verb.perfective));
    }
    return line;
  }

  // Motion verbs come as two words: one direction (идти) and many directions (ходить).
  function motionLine(verb) {
    var line = el('span', 'pair');
    line.appendChild(el('span', '', text.oneDirection + ': '));
    line.appendChild(ruWord(verb.motion.oneDirection));
    line.appendChild(el('span', 'pair__sep', ' \u00b7 '));
    line.appendChild(el('span', '', text.manyDirections + ': '));
    line.appendChild(ruWord(verb.motion.manyDirections));
    return line;
  }

  // The prefixed forms studied on a day: each prefix with its imperfective and perfective.
  function prefixLine(verb, from, count) {
    var line = el('span', 'prefixes-line');
    verb.prefixList.slice(from, from + count).forEach(function (entry, index) {
      if (index) line.appendChild(el('span', 'pair__sep', ' \u00b7 '));
      line.appendChild(ruWord(entry.imperfective || entry.perfective));
      if (entry.imperfective && entry.perfective) {
        line.appendChild(el('span', '', ' / '));
        line.appendChild(ruWord(entry.perfective));
      }
    });
    return line;
  }

  // A single prefix is the same as no prefix, so no count is shown for it.
  function word(verb, withPrefixes, count, from) {
    var item = el('span', 'w');
    item.appendChild(ruWord(verb.lemma));
    // A word with no prefix or only one is a review: it needs no new prefix study.
    if (withPrefixes && verb.prefixes <= 1) item.appendChild(el('span', 'badge', text.review));
    // A split day with a single combination still shows "1 prefix" when the verb has more in total.
    var showCount = count > 1 || (count === 1 && verb.prefixes > 1);
    var note = withPrefixes ? (showCount ? text.prefixes(count) : null) : verb.gloss;
    if (note) item.appendChild(el('small', '', note));
    if (withPrefixes && count > 0 && verb.prefixList) item.appendChild(prefixLine(verb, from, count));
    if (verb.motion) item.appendChild(motionLine(verb));
    if (verb.imperfective || verb.perfective) item.appendChild(pairLine(verb));
    return item;
  }

  function stage(title, intro, days, firstDay, withPrefixes) {
    var block = el('section', 'stage');
    block.appendChild(el('h2', '', title));
    block.appendChild(el('p', '', intro));
    var list = el('ol', 'days');
    days.forEach(function (verbs, index) {
      var row = el('li');
      row.appendChild(el('span', 'day', text.day(firstDay + index)));
      var words = el('span', 'words');
      verbs.forEach(function (item) { words.appendChild(word(item.verb, withPrefixes, item.count, item.from)); });
      row.appendChild(words);
      list.appendChild(row);
    });
    block.appendChild(list);
    return block;
  }

  // The days a category takes: base days, prefix days, and the quiz day comes after them.
  function plan(category) {
    var verbs = category.verbs;
    var prefixed = verbs.filter(function (verb) { return verb.prefixes > 0; });
    var reviews = verbs.filter(function (verb) { return verb.prefixes === 0; });
    var baseDays = chunk(verbs, BASE_PER_DAY).map(function (group) {
      return group.map(function (verb) { return { verb: verb, count: null }; });
    });
    var prefixDays = addReviews(packPrefixes(prefixed, PREFIXES_PER_DAY), reviews);
    return { baseDays: baseDays, prefixDays: prefixDays, studyDays: baseDays.length + prefixDays.length };
  }

  function renderCategories() {
    // Fewest base verbs first; the sort is stable, so equal sizes keep the app's order.
    var ordered = categories.slice().sort(function (a, b) {
      return a.verbs.length - b.verbs.length;
    });
    var start = 0;
    SEMESTER_SIZES.forEach(function (size, semester) {
      var group = ordered.slice(start, start + size);
      if (!group.length) return;
      // A category's quiz day comes after its study days.
      var days = group.reduce(function (sum, category) { return sum + plan(category).studyDays + 1; }, 0);
      var weeks = Math.round(days / 7);
      var block = el('div', 'semester');
      block.appendChild(el('h3', 'semester__title', text.part(text.partNames[semester], weeks)));
      var cards = el('div', 'cats');
      group.forEach(function (category, offset) {
        var card = el('a', 'cat');
        card.href = '#' + category.id;
        card.appendChild(el('span', 'cat__num', String(start + offset + 1)));
        card.appendChild(el('span', 'cat__name', category[language]));
        card.appendChild(el('small', '', text.verbs(category.verbs.length)));
        cards.appendChild(card);
      });
      block.appendChild(cards);
      var exam = el('a', 'cat cat--exam');
      exam.href = '#exam-' + (semester + 1);
      exam.appendChild(el('span', 'cat__name', text.examTitle(semester + 1)));
      exam.appendChild(el('small', '', text.examNote));
      block.appendChild(exam);
      grid.appendChild(block);
      start += group.length;
    });
  }

  function renderCategory(category) {
    var verbs = category.verbs;
    var combos = verbs.reduce(function (sum, verb) { return sum + verb.prefixes; }, 0);
    var days = plan(category);
    var baseDays = days.baseDays;
    var prefixDays = days.prefixDays;
    var studyDays = days.studyDays;
    var quizDay = studyDays + 1;
    heading.textContent = category[language];
    summary.textContent = '';
    summary.appendChild(el('span', '', text.summary(verbs.length, combos)));
    summary.appendChild(el('br'));
    summary.appendChild(el('strong', '', text.days(studyDays)));
    schedule.textContent = '';
    schedule.appendChild(stage(text.baseTitle, text.baseText, baseDays, 1, false));
    schedule.appendChild(stage(text.prefixTitle, text.prefixText(), prefixDays, baseDays.length + 1, true));
    var quiz = el('section', 'stage');
    quiz.appendChild(el('h2', '', text.quizTitle(quizDay)));
    quiz.appendChild(el('p', '', text.quizText));
    schedule.appendChild(quiz);
    document.title = text.title(category[language]);
  }

  // Restarts the fade-in on a view, so it plays each time the view is shown.
  function fadeIn(node) {
    node.classList.remove('is-in');
    void node.offsetWidth;
    node.classList.add('is-in');
  }

  function route() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    // The exam pages (#exam-1, #exam-2) are drawn by exam.js, which shows and hides its own section.
    if (/^exam-[12]$/.test(id)) {
      home.hidden = true;
      view.hidden = true;
      return;
    }
    var category = categories.filter(function (item) { return item.id === id; })[0];
    home.hidden = !!category;
    view.hidden = !category;
    if (category) {
      renderCategory(category);
      fadeIn(view);
      heading.focus({ preventScroll: true });
    } else {
      document.title = text.home;
      fadeIn(home);
    }
    window.scrollTo(0, 0);
  }

  renderCategories();
  window.addEventListener('hashchange', route);
  route();
})();
