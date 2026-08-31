// DEV NOTE (for AI/human editors): this site preserves the "two spaces after a
// sentence" typing convention in prose text by writing "sentence.&nbsp; Next
// sentence" in the HTML -- a literal &nbsp; entity followed by a normal space --
// instead of two plain spaces, which HTML collapses to one when rendered.
// This file doesn't generate that prose itself, but keep it in mind if you add
// any JS that writes user-facing text into the page.

// Nav menu toggle
function initNav(){
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var issuesToggle = document.getElementById('navIssuesToggle');
  var submenu = document.getElementById('navSubmenu');
  var issuesArrow = document.getElementById('navIssuesArrow');
  if(toggle){
    toggle.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      toggle.textContent = open ? '✕' : '☰';
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if(!open){ submenu.classList.remove('open'); issuesArrow.textContent='▼'; }
    });
  }
  if(issuesToggle){
    issuesToggle.addEventListener('click', function(){
      var open = submenu.classList.toggle('open');
      issuesArrow.textContent = open ? '▲' : '▼';
    });
  }
  // Collapsible Issues sub-lists inside the hamburger tree (Domestic/Foreign
  // Policy's individual issues stay hidden until their arrow is clicked --
  // saves vertical space, since most visitors don't need every issue listed
  // inline every time they open the menu).
  var treeToggles = document.querySelectorAll('.tree-toggle');
  treeToggles.forEach(function(btn){
    btn.addEventListener('click', function(){
      var sublist = btn.nextElementSibling;
      var collapsed = sublist.classList.toggle('tree-collapsed');
      btn.textContent = collapsed ? '▶' : '▼';
    });
  });
}

// Comment form submission (posts to the live Google Apps Script endpoint, no-cors)
var COMMENT_ENDPOINT = "https://script.google.com/macros/s/AKfycbzQPrKBRSVamuF9Ddn2JLYtxnWl3GxihUS4XujNWstAVvAM8qIPc45DdQuXUkTKO85XfA/exec";

// Persistent anonymous visitor ID (localStorage) -- lets the spreadsheet show
// that multiple rows came from the same visitor over time, without any login.
function _getVisitorId(){
  var key = 'visitorId';
  var id = localStorage.getItem(key);
  if(!id){
    id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, id);
  }
  return id;
}

function initCommentForm(issueId){
  var form = document.getElementById('commentForm');
  if(!form) return;
  var emailInput = form.querySelector('[name="email"]');
  var notifyWrap = document.getElementById('notifyWrap');
  var notifyCheckbox = form.querySelector('[name="notify"]');
  var yesBtn = document.getElementById('cfYes');
  var noBtn = document.getElementById('cfNo');
  var postPublic = null;
  var errorEl = document.getElementById('cfError');
  var successEl = document.getElementById('cfSuccess');
  var submitBtn = document.getElementById('cfSubmit');
  var commentInput = form.querySelector('[name="comment"]');

  // Priority-ranking slider (present on issue pages only; speeches have no
  // slider, so all of this is skipped gracefully if the elements aren't there)
  var rankSlider = document.getElementById('cfRankSlider');
  var rankValueEl = document.getElementById('cfRankValue');
  var rankAvgEl = document.getElementById('cfRankAvg');
  var rankCountEl = document.getElementById('cfRankCount');

  function renderAverage(count, average){
    if(!rankAvgEl) return;
    if(count > 0 && average !== null){
      rankAvgEl.textContent = average.toFixed(1);
      rankCountEl.textContent = '(' + count + ' ranking' + (count === 1 ? '' : 's') + ' so far)';
    } else {
      rankAvgEl.textContent = '11';
      rankCountEl.textContent = '(starting point -- no rankings yet)';
    }
  }

  function fetchAverage(){
    if(!rankAvgEl) return;
    fetch(COMMENT_ENDPOINT + '?action=avg&issueId=' + encodeURIComponent(issueId))
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(data && data.success){ renderAverage(data.count, data.average); }
      })
      .catch(function(){ /* leave the default "11" display in place */ });
  }

  if(rankSlider){
    rankSlider.addEventListener('input', function(){
      rankValueEl.textContent = rankSlider.value;
    });
    fetchAverage();
  }

  emailInput.addEventListener('input', function(){
    if(emailInput.value.trim()){ notifyWrap.classList.add('show'); }
    else { notifyWrap.classList.remove('show'); notifyCheckbox.checked = false; }
  });

  function selectYesNo(val){
    postPublic = val;
    yesBtn.classList.toggle('selected', val === true);
    noBtn.classList.toggle('selected', val === false);
  }
  yesBtn.addEventListener('click', function(){ selectYesNo(true); });
  noBtn.addEventListener('click', function(){ selectYesNo(false); });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    errorEl.textContent = '';
    if(!commentInput.value.trim()){
      errorEl.textContent = 'Please enter a comment.';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    var payload = {
      issueId: issueId,
      visitorId: _getVisitorId(),
      rank: rankSlider ? parseInt(rankSlider.value, 10) : undefined,
      name: form.querySelector('[name="name"]').value.trim() || 'Anonymous',
      email: emailInput.value.trim() || null,
      notify: notifyCheckbox.checked,
      region: form.querySelector('[name="region"]').value || null,
      lineOfWork: form.querySelector('[name="work"]').value.trim() || null,
      mayPost: postPublic === true ? 'Yes' : postPublic === false ? 'No' : '',
      comment: commentInput.value.trim()
    };
    fetch(COMMENT_ENDPOINT, {
      method: 'POST', mode: 'no-cors',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(payload)
    }).then(function(){
      form.reset();
      notifyWrap.classList.remove('show');
      selectYesNo(null);
      successEl.classList.add('show');
      setTimeout(function(){ successEl.classList.remove('show'); }, 4000);
      if(rankSlider){
        rankSlider.value = 11;
        rankValueEl.textContent = '11';
        fetchAverage();
      }
    }).catch(function(){
      errorEl.textContent = 'Something went wrong — please try again.';
    }).finally(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Comment';
    });
  });
}

// Generic tab switching (used by Endorsements page)
function initTabs(){
  var buttons = document.querySelectorAll('[data-tab-btn]');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-tab-btn');
      document.querySelectorAll('[data-tab-btn]').forEach(function(b){ b.classList.remove('active'); });
      document.querySelectorAll('[data-tab-panel]').forEach(function(p){ p.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelector('[data-tab-panel="' + target + '"]').classList.add('active');
    });
  });
}

// Video modal (used by Speeches pages) - opens an embedded video full-screen-capable
// player in a pop-up overlay; click backdrop, the close button, or Escape to dismiss.
function initVideoModal(){

// ---------------------------------------------------------------------------
// Listen Button — Web Speech API text-to-speech
// ---------------------------------------------------------------------------
// Automatically places listen buttons on content pages:
//   - Issue pages (three-layer): one above Key Points, one inside Deeper Dive
//   - Other content pages: one at the top of .content-wrap
//   - Excluded: pages with no .content-wrap, 404, sitemap, contact form
//
// Each button reads only the text within its target container, skipping
// script tags, style tags, and other non-content elements.

function initListenButtons(){
  if(!('speechSynthesis' in window)) return;  // browser doesn't support TTS

  // Don't add listen buttons to these pages
  var skip = document.querySelector('.page-contact') ||
             document.querySelector('.sitemap-page') ||
             document.title.indexOf('404') !== -1;
  if(skip) return;

  var wrap = document.querySelector('.content-wrap');
  if(!wrap) return;

  // Utility: extract readable text from an element, skipping scripts/styles
  function getReadableText(el){
    var clone = el.cloneNode(true);
    // Remove scripts, styles, buttons (including our own listen buttons)
    var remove = clone.querySelectorAll('script, style, .listen-btn-wrap, .comment-form-section, .share-form');
    for(var i = 0; i < remove.length; i++){ remove[i].remove(); }
    // Get text, collapse whitespace
    var text = clone.textContent || clone.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // Create a listen button element
  function createListenBtn(label){
    var btnWrap = document.createElement('div');
    btnWrap.className = 'listen-btn-wrap';
    var btn = document.createElement('button');
    btn.className = 'listen-btn';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = '<span class="listen-icon">&#9654;</span> ' + label;
    btnWrap.appendChild(btn);
    return { wrap: btnWrap, btn: btn };
  }

  // Speak text, toggle button state
  function attachSpeech(btn, getTextFn){
    var speaking = false;
    btn.addEventListener('click', function(){
      if(speaking){
        speechSynthesis.cancel();
        speaking = false;
        btn.innerHTML = btn.innerHTML.replace('&#9724;', '&#9654;').replace('◼', '►');
        btn.classList.remove('listening');
        return;
      }
      var text = getTextFn();
      if(!text) return;
      // Split into chunks at sentence boundaries (speechSynthesis has length limits)
      var sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
      var chunks = [];
      var current = '';
      for(var i = 0; i < sentences.length; i++){
        if((current + sentences[i]).length > 200){
          if(current) chunks.push(current);
          current = sentences[i];
        } else {
          current += sentences[i];
        }
      }
      if(current) chunks.push(current);

      speaking = true;
      btn.innerHTML = btn.innerHTML.replace('&#9654;', '&#9724;').replace('►', '◼');
      btn.innerHTML = btn.innerHTML.replace('Listen', 'Stop');
      btn.classList.add('listening');

      var idx = 0;
      function speakNext(){
        if(idx >= chunks.length || !speaking){
          speaking = false;
          btn.innerHTML = btn.innerHTML.replace('&#9724;', '&#9654;').replace('◼', '►');
          btn.innerHTML = btn.innerHTML.replace('Stop', 'Listen');
          btn.classList.remove('listening');
          return;
        }
        var utterance = new SpeechSynthesisUtterance(chunks[idx]);
        utterance.rate = 1.0;
        utterance.onend = function(){ idx++; speakNext(); };
        utterance.onerror = function(){ speaking = false; btn.classList.remove('listening'); };
        speechSynthesis.speak(utterance);
      }
      speakNext();
    });
  }

  // Detect page type
  var keyPoints = wrap.querySelector('.key-points');
  var atAGlance = wrap.querySelector('.at-a-glance');
  var deeperDive = wrap.querySelector('.deeper-dive');

  if(keyPoints && deeperDive){
    // Issue page: two buttons
    // Button 1: above key points, reads key-points + at-a-glance
    var btn1 = createListenBtn('Listen to Summary');
    var firstChild = wrap.firstChild;
    // Insert before the first block-level child (often revision-note or key-points parent)
    var insertBefore = wrap.querySelector('.revision-note') || wrap.querySelector('.block') || keyPoints.parentElement || firstChild;
    if(insertBefore && insertBefore.parentNode === wrap){
      wrap.insertBefore(btn1.wrap, insertBefore);
    } else {
      wrap.insertBefore(btn1.wrap, firstChild);
    }
    attachSpeech(btn1.btn, function(){
      var text = '';
      if(keyPoints) text += getReadableText(keyPoints.closest('.block') || keyPoints);
      if(atAGlance) text += ' ' + getReadableText(atAGlance);
      return text;
    });

    // Button 2: inside deeper-dive, after the summary/toggle
    var btn2 = createListenBtn('Listen to Full Policy');
    var ddToggle = deeperDive.querySelector('.deeper-dive-toggle');
    if(ddToggle){
      ddToggle.insertAdjacentElement('afterend', btn2.wrap);
    } else {
      deeperDive.insertBefore(btn2.wrap, deeperDive.firstChild);
    }
    attachSpeech(btn2.btn, function(){
      return getReadableText(deeperDive);
    });

  } else {
    // Non-issue page: single button at top of content-wrap
    var btn = createListenBtn('Listen to This Page');
    wrap.insertBefore(btn.wrap, wrap.firstChild);
    attachSpeech(btn.btn, function(){
      return getReadableText(wrap);
    });
  }
}

// Cancel speech on navigation away
window.addEventListener('beforeunload', function(){
  if('speechSynthesis' in window){ speechSynthesis.cancel(); }
});

// Auto-init listen buttons on DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initListenButtons);
} else {
  initListenButtons();
}

// ---------------------------------------------------------------------------
  var overlay = document.getElementById('videoModalOverlay');
  if(!overlay) return;
  var body = document.getElementById('videoModalBody');
  var closeBtn = document.getElementById('videoModalClose');
  var buttons = document.querySelectorAll('.watch-video-btn');

  function openModal(src){
    if(!src) return;
    body.innerHTML = '<iframe src="' + src + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen frameborder="0"></iframe>';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    overlay.classList.remove('open');
    body.innerHTML = '';
    document.body.style.overflow = '';
  }
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      openModal(btn.getAttribute('data-video-src'));
    });
  });
  if(closeBtn){ closeBtn.addEventListener('click', closeModal); }
  overlay.addEventListener('click', function(e){
    if(e.target === overlay){ closeModal(); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && overlay.classList.contains('open')){ closeModal(); }
  });
}
