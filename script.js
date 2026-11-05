
const openButton = document.getElementById('openInvitation');
const envelope = document.querySelector('.envelope');
const cover = document.getElementById('page-cover');

const weddingAudio = document.getElementById('weddingAudio');
const musicToggle = document.getElementById('musicToggle');

let isMusicPlaying = false;

// Open invitation and start music
openButton.addEventListener('click', () => {
  envelope.classList.add('open');
  openButton.disabled = true;
  openButton.innerHTML = '<span>កំពុងបើកធៀប...</span>';

  // Start background music
  playWeddingMusic();

  setTimeout(() => showPage('page-invitation'), 1500);
});

// Show page
function showPage(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const target = document.getElementById(id);
  target.classList.add('active');

  window.scrollTo({top: 0, behavior: 'smooth'});
  setTimeout(observeReveals, 100);
}

// Navigate pages
document.querySelectorAll('[data-go]').forEach(button => {
  button.addEventListener('click', () => showPage(button.dataset.go));
});

document.querySelector('.back-button').addEventListener('click', () => {
  showPage('page-invitation');
});

// Countdown
const weddingDate = new Date('2027-03-15T17:00:00+07:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const distance = weddingDate - now;

  const values = distance <= 0
    ? [0, 0, 0, 0]
    : [
        Math.floor(distance / 86400000),
        Math.floor((distance % 86400000) / 3600000),
        Math.floor((distance % 3600000) / 60000),
        Math.floor((distance % 60000) / 1000)
      ];

  ['days','hours','minutes','seconds'].forEach((id, i) => {
    document.getElementById(id).textContent =
      String(values[i]).padStart(i === 0 ? 3 : 2, '0');
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Reveal elements
let revealObserver;

function observeReveals() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});

  document.querySelectorAll('.active .reveal:not(.visible)')
    .forEach(el => revealObserver.observe(el));
}

observeReveals();

// =================================
// BACKGROUND MUSIC
// =================================

async function playWeddingMusic() {
  try {
    await weddingAudio.play();
    isMusicPlaying = true;
    updateMusicButton();
  } catch (error) {
    isMusicPlaying = false;
    updateMusicButton();
    console.log('Music playback failed:', error);
  }
}

function pauseWeddingMusic() {
  weddingAudio.pause();
  isMusicPlaying = false;
  updateMusicButton();
}

function updateMusicButton() {
  musicToggle.innerHTML = isMusicPlaying
    ? '♫ <small>Music On</small>'
    : '♫ <small>Music Off</small>';

  musicToggle.classList.toggle('playing', isMusicPlaying);
}

// Music ON / OFF
musicToggle.addEventListener('click', () => {
  if (isMusicPlaying) {
    pauseWeddingMusic();
  } else {
    playWeddingMusic();
  }
});

// Handle audio errors
weddingAudio.addEventListener('error', () => {
  console.error('Cannot load wedding music file.');
});

updateMusicButton();

const params = new URLSearchParams(window.location.search);

const name1 = params.get('name1');
const name2 = params.get('name2');

if (name1?.trim()) {
  const firstName = escapeHTML(name1.trim());
  const secondName = name2?.trim()
    ? escapeHTML(name2.trim())
    : '';

  const namesHTML = secondName
    ? `${firstName} <span>&</span> ${secondName}`
    : firstName;

  document.getElementById('coverNames').innerHTML = namesHTML;
  document.getElementById('coupleNames').innerHTML = namesHTML;
}

function escapeHTML(text) {
  const element = document.createElement('span');
  element.textContent = text;
  return element.innerHTML;
}
