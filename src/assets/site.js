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
