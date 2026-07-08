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
}

// Comment form submission (posts to the live Google Apps Script endpoint, no-cors)
var COMMENT_ENDPOINT = "https://script.google.com/macros/s/AKfycbw3SZ_0PwaMoL046HK9589piUfm9iwevJOceXGlMmzGGxfSYvjX31yEkKNS3UERGGKqIA/exec";

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
    }).catch(function(){
      errorEl.textContent = 'Something went wrong — please try again.';
    }).finally(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Comment';
    });
  });
}

// Priority ranking widget (1-20 slider, average fetched from the same
// Google Apps Script endpoint used for comments).  One ranking per browser
// per issue, tracked in localStorage -- not bulletproof against a cleared
// cache, but reasonable for this use case.
function initPriorityRanking(issueId){
  var wrap = document.getElementById('priorityRank');
  if(!wrap) return;
  var slider = document.getElementById('priorityRankSlider');
  var valueEl = document.getElementById('priorityRankValue');
  var submitBtn = document.getElementById('priorityRankSubmit');
  var thanksEl = document.getElementById('priorityRankThanks');
  var thanksValueEl = document.getElementById('priorityRankThanksValue');
  var avgEl = document.getElementById('priorityRankAvg');
  var countEl = document.getElementById('priorityRankCount');
  var storageKey = 'rank_' + issueId;

  function renderAverage(count, average){
    if(count > 0 && average !== null){
      avgEl.textContent = average.toFixed(1);
      countEl.textContent = '(' + count + ' ranking' + (count === 1 ? '' : 's') + ' so far)';
    } else {
      avgEl.textContent = '11';
      countEl.textContent = '(starting point -- no rankings yet)';
    }
  }

  function fetchAverage(){
    fetch(COMMENT_ENDPOINT + '?action=avg&issueId=' + encodeURIComponent(issueId))
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(data && data.success){ renderAverage(data.count, data.average); }
      })
      .catch(function(){ /* leave the default "11" display in place */ });
  }

  function lockAsSubmitted(rank){
    slider.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Ranking Submitted';
    thanksValueEl.textContent = rank;
    thanksEl.classList.add('show');
  }

  var already = localStorage.getItem(storageKey);
  if(already){
    slider.value = already;
    valueEl.textContent = already;
    lockAsSubmitted(already);
  }

  slider.addEventListener('input', function(){
    valueEl.textContent = slider.value;
  });

  submitBtn.addEventListener('click', function(){
    if(localStorage.getItem(storageKey)) return;
    var rank = parseInt(slider.value, 10);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    fetch(COMMENT_ENDPOINT, {
      method: 'POST', mode: 'no-cors',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({ action: 'rank', issueId: issueId, rank: rank })
    }).then(function(){
      localStorage.setItem(storageKey, String(rank));
      lockAsSubmitted(rank);
      fetchAverage();
    }).catch(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit My Ranking';
    });
  });

  fetchAverage();
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
