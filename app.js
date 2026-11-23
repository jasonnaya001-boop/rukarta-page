/* Rukarta web: a small, free version of the app.
   Ten verbs, five prefix pairs from the ставить family. Sentences and translations come from the app's example data. */

(function () {
  'use strict';

  // ---------- Flashcard data: one entry per prefix pair ----------
  var FAMILY = [
    {
      prefix: 'по',
      imp: { lemma: 'ставить', meaning: 'to put, to set in place', form: 'ставлю',
        ru: 'Я всегда ставлю чашку на стол.', tr: 'I always put the cup on the table.' },
      pf:  { lemma: 'поставить', meaning: 'to put down, once', form: 'поставил',
        ru: 'Он выпил весь сок и поставил пустой стакан на стол.', tr: 'He drank all the juice and put the empty glass on the table.' }
    },
    {
      prefix: 'вы',
      imp: { lemma: 'выставлять', meaning: 'to put out, to exhibit', form: 'выставляла',
        ru: 'Девочка выставляла вперёд ногу и смешно позировала.', tr: 'The girl stuck her foot forward and posed comically.' },
      pf:  { lemma: 'выставить', meaning: 'to put out, to exhibit, once', form: 'выставить',
        ru: 'Музей решил выставить редкие золотые украшения скифов в главном зале.', tr: 'The museum decided to exhibit rare Scythian gold jewellery in the main hall.' }
    },
    {
      prefix: 'до',
      imp: { lemma: 'доставлять', meaning: 'to deliver, regularly', form: 'доставляет',
        ru: 'Служба доставки оперативно доставляет заказы покупателям на дом.', tr: 'The delivery service promptly delivers orders to customers’ homes.' },
      pf:  { lemma: 'доставить', meaning: 'to deliver, once', form: 'доставлю',
        ru: 'Я доставлю вам отчёт лично в руки завтра утром.', tr: 'I will deliver the report to you in person tomorrow morning.' }
    },
    {
      prefix: 'о',
      imp: { lemma: 'оставлять', meaning: 'to leave behind, as a rule', form: 'оставляй',
        ru: 'Не оставляй свечу гореть без присмотра в пустой комнате.', tr: 'Do not leave a candle burning unattended in an empty room.' },
      pf:  { lemma: 'оставить', meaning: 'to leave behind, once', form: 'оставлю',
        ru: 'Я оставлю тебе ключ.', tr: 'I’ll leave you a key.' }
    },
    {
      prefix: 'за',
      imp: { lemma: 'заставлять', meaning: 'to force, as a rule', form: 'заставляет',
        ru: 'Мама заставляет меня убирать комнату.', tr: 'Mom makes me clean my room.' },
      pf:  { lemma: 'заставить', meaning: 'to force, once', form: 'заставил',
        ru: 'Дождь заставил нас вернуться в палатку.', tr: 'The rain forced us to go back to the tent.' }
    }
  ];

  // ---------- Helpers ----------
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The page language. The Spanish page sets lang="es" and gets the Spanish tour copy and translations,
  // the same wording the app uses in Spanish.
  var LANG = document.documentElement.lang === 'es' ? 'es' : 'en';
  var COPY = {
    en: { process: 'PROCESS', result: 'RESULT', step: 'Step', of: 'of', back: 'Back', next: 'Next', replay: 'Replay', goTo: 'Go to step' },
    es: { process: 'PROCESO', result: 'RESULTADO', step: 'Paso', of: 'de', back: 'Atrás', next: 'Siguiente', replay: 'Repetir', goTo: 'Ir al paso' }
  }[LANG];
  // Spanish translations of the example sentences, keyed by the Russian, from the app's example data.
  var ES_TR = {
    'Я всегда ставлю чашку на стол.': 'Siempre pongo la taza en la mesa.',
    'Он выпил весь сок и поставил пустой стакан на стол.': 'Se bebió todo el zumo y dejó el vaso vacío sobre la mesa.',
    'Девочка выставляла вперёд ногу и смешно позировала.': 'La niña extendía una pierna hacia delante y posaba de forma graciosa.',
    'Музей решил выставить редкие золотые украшения скифов в главном зале.': 'El museo decidió exhibir las raras joyas de oro de los escitas en la sala principal.',
    'Она аккуратно выставила горшки с цветущей геранью на солнечный балкон.': 'Ella colocó con cuidado las macetas de geranios en flor en el balcón soleado.',
    'Служба доставки оперативно доставляет заказы покупателям на дом.': 'El servicio de reparto entrega con rapidez los pedidos a los clientes en su domicilio.',
    'Я доставлю вам отчёт лично в руки завтра утром.': 'Le entregaré el informe en persona mañana por la mañana.',
    'Не оставляй свечу гореть без присмотра в пустой комнате.': 'No dejes una vela encendida sin vigilancia en una habitación vacía.',
    'Я оставлю тебе ключ.': 'Te dejaré la llave.',
    'Мама заставляет меня убирать комнату.': 'Mamá me obliga a limpiar la habitación.',
    'Дождь заставил нас вернуться в палатку.': 'La lluvia nos obligó a volver a la tienda de campaña.'
  };

  // ---------- Guided tour ----------
  // The tour moves one phone screen through the app: topic, verb, prefix, flip, sentence, quiz.
  var PREFIXES = ['Ø', 'вы', 'до', 'о', 'за'];          // the prefix wheel, one entry per FAMILY pair
  var PF_PREFIX = ['по', 'вы', 'до', 'о', 'за'];         // the prefix on each perfective partner
  // A second real example, so the tour can swipe on to the next sentence.
  var EXTRA_PF = {
    1: { ru: 'Она аккуратно выставила горшки с цветущей геранью на солнечный балкон.',
         tr: 'She neatly put the pots with blooming geraniums out on the sunny balcony.', form: 'выставила' }
  };

  var STEPS = [
    { focus: 'header', state: { pair: 0, side: 'imp', sent: 0, drawer: false },
      title: 'Start with a topic',
      text: 'Verbs come in twelve practical topics, from everyday actions to abstract vocabulary. This one is Placing & holding.' },
    { focus: 'verbs', state: { pair: 0, side: 'imp', sent: 0, drawer: false },
      title: 'Choose a verb',
      text: 'Turn the verb wheel to pick a base verb. Easier verbs come first. Here: ставить, to put.' },
    { focus: 'prefix', state: { pair: 1, side: 'imp', sent: 0, drawer: false },
      title: 'Turn the prefix wheel',
      text: 'Pick вы- and ставить becomes выставлять, to put out or exhibit. Only the prefix changes the meaning.' },
    { focus: 'card', state: { pair: 1, side: 'pf', sent: 0, drawer: false },
      title: 'Flip the card',
      text: 'Flip to the perfective partner, выставить. The process becomes a completed result, and the prefix keeps its own space.' },
    { focus: 'sentence', state: { pair: 1, side: 'pf', sent: 1, drawer: false },
      title: 'Read it in a sentence',
      text: 'Every verb has example sentences with translations. Swipe for the next one. Prefix in purple, stem in orange.' },
    { focus: 'quiz', state: { pair: 1, side: 'pf', sent: 1, drawer: true },
      title: 'Test yourself',
      text: 'Choose the right verb in sets of 10 sentences. Misses come back as study reminders at 9 am and 7 pm.' }
  ];

  // The Spanish tour copy, one entry per step in STEPS.
  var ES_STEPS = [
    { title: 'Empieza por un tema',
      text: 'Los verbos se agrupan en doce temas prácticos, desde acciones cotidianas hasta vocabulario abstracto. Este es Colocar y sostener.' },
    { title: 'Elige un verbo',
      text: 'Gira la rueda de verbos para elegir un verbo base. Los más fáciles aparecen primero. Aquí: ставить, poner.' },
    { title: 'Gira la rueda de prefijos',
      text: 'Elige вы- y ставить se convierte en выставлять, exponer o exhibir. Solo el prefijo cambia el significado.' },
    { title: 'Voltea la tarjeta',
      text: 'Pasa a la pareja perfectiva, выставить. El proceso se convierte en un resultado terminado, y el prefijo conserva su propio espacio.' },
    { title: 'Léelo en una oración',
      text: 'Cada verbo tiene oraciones de ejemplo con traducciones. Desliza para ver la siguiente. Prefijo en morado, raíz en naranja.' },
    { title: 'Ponte a prueba',
      text: 'Elige el verbo correcto en series de 10 oraciones. Los fallos vuelven como recordatorios de estudio a las 9:00 y a las 19:00.' }
  ];

  var tour = document.querySelector('[data-tour]');
  if (tour) {
    var $ = function (role) { return tour.querySelector('[data-role="' + role + '"]'); };
    var screen = tour.querySelector('.screen');
    var kickEl = $('kick'), trackEl = $('track'), ruEl = $('sent-ru'), trEl = $('sent-tr');
    var morphEl = $('morph'), listEl = $('plist'), pfxLabel = $('pfx-label'), mkEl = $('mk'), mwEl = $('mw');
    var drawerEl = $('drawer'), coachEl = $('coach'), midEl = tour.querySelector('.app-mid');
    var stepnoEl = $('stepno'), dotsEl = $('dots'), titleEl = $('title'), textEl = $('text');
    var backBtn = $('back'), nextBtn = $('next');

    var stepIndex = 0;
    var shown = clone(STEPS[0].state);
    var timers = [];
    var running = [];

    function clone(s) { return { pair: s.pair, side: s.side, sent: s.sent, drawer: s.drawer }; }

    function sentences(pair, side) {
      if (side === 'imp') return [FAMILY[pair].imp];
      return [FAMILY[pair].pf].concat(EXTRA_PF[pair] ? [EXTRA_PF[pair]] : []);
    }

    // Colour the verb the way the app does: green for process, purple prefix and orange stem for result.
    function paintSentence(item, side, pair) {
      ruEl.textContent = '';
      var at = item.ru.indexOf(item.form);
      if (at < 0) { ruEl.textContent = item.ru; return; }
      ruEl.appendChild(document.createTextNode(item.ru.slice(0, at)));
      if (side === 'imp') {
        ruEl.appendChild(el('span', 'hl-imp', item.form));
      } else {
        var n = PF_PREFIX[pair].length;
        ruEl.appendChild(el('span', 'hl-pre', item.form.slice(0, n)));
        ruEl.appendChild(el('span', 'hl-stem', item.form.slice(n)));
      }
      ruEl.appendChild(document.createTextNode(item.ru.slice(at + item.form.length)));
    }

    // Draw the whole phone screen from the state in `shown`.
    function paint() {
      var pair = FAMILY[shown.pair];
      var result = shown.side === 'pf';
      var list = sentences(shown.pair, shown.side);
      var item = list[Math.min(shown.sent, list.length - 1)];
      screen.classList.toggle('is-result', result);
      kickEl.textContent = mkEl.textContent = result ? COPY.result : COPY.process;
      paintSentence(item, shown.side, shown.pair);
      trEl.textContent = LANG === 'es' ? (ES_TR[item.ru] || item.tr) : item.tr;
      mwEl.textContent = result ? pair.pf.lemma.slice(PF_PREFIX[shown.pair].length) : pair.imp.lemma;
      pfxLabel.textContent = PF_PREFIX[shown.pair];
      listEl.style.setProperty('--i', shown.pair);
      Array.prototype.forEach.call(listEl.children, function (node, i) {
        node.classList.toggle('is-cur', i === shown.pair);
      });
      drawerEl.classList.toggle('is-open', shown.drawer);
      placeCoach(shown.drawer);
    }

    // The coach card sits under the sentence, and moves under the answer choices while the quiz is open.
    function placeCoach(inDrawer) {
      var home = inDrawer ? drawerEl : midEl;
      if (coachEl.parentNode === home) return;
      var active = document.activeElement;
      var hadFocus = coachEl.contains(active);
      home.appendChild(coachEl);
      if (hadFocus && active && active.focus) active.focus({ preventScroll: true });
    }

    function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function anim(node, frames, ms, easing) {
      if (!node.animate) return null;
      var a = node.animate(frames, { duration: ms, easing: easing || 'ease-out' });
      running.push(a);
      return a;
    }
    function stop() {
      timers.forEach(clearTimeout); timers = [];
      running.forEach(function (a) { a.cancel(); }); running = [];
    }

    // The three moves the tour makes on the screen.
    function turnPrefix(pair) {
      shown.pair = pair; shown.sent = 0;
      listEl.style.setProperty('--i', pair);
      Array.prototype.forEach.call(listEl.children, function (node, i) { node.classList.toggle('is-cur', i === pair); });
      anim(mwEl, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-35%)' }], 170, 'ease-in');
      later(170, function () {
        paint();
        anim(mwEl, [{ opacity: 0, transform: 'translateY(35%)' }, { opacity: 1, transform: 'none' }], 240);
        anim(trackEl, [{ opacity: 0 }, { opacity: 1 }], 260);
      });
    }

    function flipCard(side) {
      var P = 'perspective(900px) ';
      morphEl.style.transformOrigin = '50% 50%';
      anim(morphEl, [{ transform: P + 'rotateY(0deg)' }, { transform: P + 'rotateY(90deg)' }], 220, 'cubic-bezier(.5, 0, 1, .6)');
      later(215, function () {
        shown.side = side; shown.sent = 0;
        paint();
        anim(morphEl, [{ transform: P + 'rotateY(-90deg)' }, { transform: P + 'rotateY(0deg)' }], 260, 'cubic-bezier(0, .5, .3, 1)');
        anim(trackEl, [{ opacity: 0 }, { opacity: 1 }], 300);
      });
    }

    function swipeSentence(idx) {
      var dir = idx > shown.sent ? 1 : -1;
      anim(trackEl, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + (-45 * dir) + '%)', opacity: 0 }], 190, 'ease-in');
      later(190, function () {
        shown.sent = idx;
        paint();
        anim(trackEl, [{ transform: 'translateX(' + (45 * dir) + '%)', opacity: 0 }, { transform: 'none', opacity: 1 }], 260);
      });
    }

    function nudgeVerbs() {
      var verb = tour.querySelector('.verbwheel');
      anim(verb, [{ transform: 'none' }, { transform: 'translateX(-5%)' }, { transform: 'none' }], 700, 'ease-in-out');
    }

    function go(i) {
      i = Math.max(0, Math.min(STEPS.length - 1, i));
      var from = STEPS[stepIndex].state;
      var step = STEPS[i];
      var to = step.state;

      // Land cleanly on the state the previous step was heading to, then move on from there.
      stop();
      shown = clone(from);
      paint();
      stepIndex = i;

      screen.querySelectorAll('[data-focus]').forEach(function (node) {
        node.classList.toggle('is-focus', node.getAttribute('data-focus') === step.focus);
      });
      var words = LANG === 'es' ? ES_STEPS[i] : step;
      stepnoEl.textContent = COPY.step + ' ' + (i + 1) + ' ' + COPY.of + ' ' + STEPS.length;
      titleEl.textContent = words.title;
      textEl.textContent = words.text;
      backBtn.disabled = i === 0;
      backBtn.textContent = COPY.back;
      nextBtn.textContent = i === STEPS.length - 1 ? COPY.replay : COPY.next;
      Array.prototype.forEach.call(dotsEl.children, function (dot, n) {
        if (n === i) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      });

      if (reduceMotion) { shown = clone(to); paint(); return; }

      var t = 0;
      if (!to.drawer && shown.drawer) { shown.drawer = false; drawerEl.classList.remove('is-open'); placeCoach(false); t = 350; }
      if (to.pair !== shown.pair) { (function (p) { later(t, function () { turnPrefix(p); }); })(to.pair); t += 520; }
      if (to.side !== shown.side) { (function (s) { later(t, function () { flipCard(s); }); })(to.side); t += 560; }
      if (to.sent !== shown.sent) { (function (n) { later(t, function () { swipeSentence(n); }); })(to.sent); t += 480; }
      if (to.drawer && !shown.drawer) { later(t, function () { shown.drawer = true; drawerEl.classList.add('is-open'); placeCoach(true); }); }
      if (step.focus === 'verbs') nudgeVerbs();
    }

    // Build the prefix wheel and the step dots, then show the first step.
    PREFIXES.forEach(function (label) { listEl.appendChild(el('div', 'pitem', label)); });
    STEPS.forEach(function (_, n) {
      var dot = el('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', COPY.goTo + ' ' + (n + 1));
      dot.addEventListener('click', function () { go(n); });
      dotsEl.appendChild(dot);
    });
    backBtn.addEventListener('click', function () { go(stepIndex - 1); });
    nextBtn.addEventListener('click', function () { go(stepIndex === STEPS.length - 1 ? 0 : stepIndex + 1); });

    stepIndex = 0;
    go(0);
  }

})();
