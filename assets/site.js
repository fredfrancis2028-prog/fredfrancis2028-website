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
