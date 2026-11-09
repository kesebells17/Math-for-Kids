// MathLand - Kid's Interactive Math Adventure
// Game logic, audio synthesizer, confetti particles, and pedagogical hints system

// --- Game State Variables ---
const state = {
  operator: 'addition',       // current mission: addition, subtraction, multiplication, division, random
  difficulty: 'easy',         // easy, medium, hard
  num1: 0,
  num2: 0,
  correctAnswer: 0,
  currentOpSymbol: '+',       // +, -, ×, ÷
  score: 0,                   // Stars
  streak: 0,                  // Hot streak
  bestStreak: 0,              // Best streak record
  isSoundOn: true,
  isTimerOn: false,
  timerInterval: null,
  timeRemaining: 20,
  totalTimeLimit: 20,         // seconds based on difficulty
  hasActiveProblem: false,
  selectedEmoji: '⭐',        // random cute emoji for hints
  audioContext: null
};

// Cute emojis database for pedagogical hints
const CUTE_EMOJIS = ['⭐', '🎈', '🍎', '🚀', '🍩', '🐠', '🦖', '🍬', '🦄', '🍓'];

// --- DOM Elements Cache ---
const elements = {
  cosmicCanvas: document.getElementById('cosmic-canvas'),
  confettiCanvas: document.getElementById('confetti-canvas'),
  opBtns: document.querySelectorAll('.op-btn'),
  diffTabs: document.querySelectorAll('.diff-tab'),
  scoreVal: document.getElementById('score-val'),
  streakVal: document.getElementById('streak-val'),
  bestStreakVal: document.getElementById('best-streak-val'),
  levelVal: document.getElementById('level-val'),
  rankProgress: document.getElementById('rank-progress'),
  toggleSound: document.getElementById('toggle-sound'),
  toggleTimer: document.getElementById('toggle-timer'),
  timerBarContainer: document.getElementById('timer-bar-container'),
  timerProgress: document.getElementById('timer-progress'),
  timerDisplay: document.getElementById('timer-display'),
  num1Card: document.getElementById('num-1'),
  num2Card: document.getElementById('num-2'),
  activeOp: document.getElementById('active-op'),
  answerInput: document.getElementById('answer-input'),
  btnCheck: document.getElementById('btn-check'),
  alertMsg: document.getElementById('alert-msg'),
  btnGenerate: document.getElementById('btn-generate'),
  questionBoard: document.getElementById('question-board')
};

// --- Rank Scaling Config ---
const RANKS = [
  { name: 'Novice Cadet 🧑‍🚀', minScore: 0, maxScore: 10 },
  { name: 'Math Apprentice 🧙‍♂️', minScore: 10, maxScore: 25 },
  { name: 'Number Ninja 🥷', minScore: 25, maxScore: 50 },
  { name: 'Galaxy Guardian 🛡️', minScore: 50, maxScore: 100 },
  { name: 'Cosmic Wizard 👑', minScore: 100, maxScore: Infinity }
];

// --- Audio Synthesizer (Web Audio API) ---
function initAudio() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
}

function playSynthesizedSound(type) {
  if (!state.isSoundOn) return;
  initAudio();
  const ctx = state.audioContext;
  if (!ctx) return;

  const now = ctx.currentTime;
  
  if (type === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } 
  else if (type === 'correct') {
    // Super Mario style coin collect sound: B5 (987.77Hz) then E6 (1318.51Hz)
    // Extremely kid-friendly and highly rewarding!
    const t = now;
    
    // Note 1: B5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, t);
    gain1.gain.setValueAtTime(0.15, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.09);
    
    // Note 2: E6
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, t + 0.08);
    gain2.gain.setValueAtTime(0.15, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.45);
  } 
  else if (type === 'wrong') {
    // Comical "Sad Trombone" sound: F3 (174.61Hz), E3 (164.81Hz), Eb3 (155.56Hz), D3 (146.83Hz) bending down
    // Highly kid-oriented, cartoonish, funny, and non-frustrating!
    const t = now;
    const duration = 0.18; // duration of first 3 notes
    const notes = [174.61, 164.81, 155.56];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * duration);
      
      // Brass filter to shape the tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, t + idx * duration);
      
      gain.gain.setValueAtTime(0.12, t + idx * duration);
      gain.gain.linearRampToValueAtTime(0.01, t + (idx + 1) * duration - 0.02);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(t + idx * duration);
      osc.stop(t + (idx + 1) * duration);
    });
    
    // The final bending D3 note with pitch-bend and vibrato
    const lastStart = t + 3 * duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(146.83, lastStart);
    // Slide frequency down to C#3 (130.00Hz)
    osc.frequency.linearRampToValueAtTime(130.00, lastStart + 0.6);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, lastStart);
    
    gain.gain.setValueAtTime(0.12, lastStart);
    gain.gain.linearRampToValueAtTime(0.001, lastStart + 0.6);
    
    // Add LFO for trombone vibrato (6Hz frequency wobble)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 4.5; // pitch shift deviation range
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    lfo.start(lastStart);
    osc.start(lastStart);
    
    lfo.stop(lastStart + 0.6);
    osc.stop(lastStart + 0.6);
  } 
  else if (type === 'levelup') {
    // Celebration fanfare
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    scale.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }
}

// --- Confetti Particles Engine ---
let confettiParticles = [];
const confettiCtx = elements.confettiCanvas.getContext('2d');

function resizeConfettiCanvas() {
  elements.confettiCanvas.width = window.innerWidth;
  elements.confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

class ConfettiParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 6;
    this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * -10 - 5;
    this.gravity = 0.35;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 8 - 4;
    this.opacity = 1;
    this.fade = Math.random() * 0.015 + 0.01;
  }
  update() {
    this.x += this.speedX;
    this.speedY += this.gravity;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.fade;
  }
  draw() {
    confettiCtx.save();
    confettiCtx.translate(this.x, this.y);
    confettiCtx.rotate((this.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = this.color;
    confettiCtx.globalAlpha = this.opacity;
    if (Math.random() > 0.5) {
      confettiCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, this.size/2, 0, Math.PI*2);
      confettiCtx.fill();
    }
    confettiCtx.restore();
  }
}

function triggerConfetti() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight * 0.7; 
  for (let i = 0; i < 80; i++) {
    confettiParticles.push(new ConfettiParticle(x, y));
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, elements.confettiCanvas.width, elements.confettiCanvas.height);
  confettiParticles = confettiParticles.filter(p => p.opacity > 0);
  confettiParticles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateConfetti);
}
animateConfetti();

// --- Interactive Bubbly Backdrop Canvas ---
const cosmicCtx = elements.cosmicCanvas.getContext('2d');
let bubbles = [];

function resizeCosmicCanvas() {
  elements.cosmicCanvas.width = window.innerWidth;
  elements.cosmicCanvas.height = window.innerHeight;
  initBubbles();
}
window.addEventListener('resize', resizeCosmicCanvas);

function initBubbles() {
  bubbles = [];
  const numBubbles = Math.floor((window.innerWidth * window.innerHeight) / 25000) + 12;
  for (let i = 0; i < numBubbles; i++) {
    bubbles.push({
      x: Math.random() * elements.cosmicCanvas.width,
      y: Math.random() * elements.cosmicCanvas.height + elements.cosmicCanvas.height, // start below the screen
      radius: Math.random() * 20 + 8,
      speedY: Math.random() * 0.6 + 0.2,
      wobbleSpeed: Math.random() * 0.015 + 0.005,
      wobbleAmount: Math.random() * 12 + 4,
      wobbleOffset: Math.random() * Math.PI * 2,
      color: `hsla(${Math.random() * 360}, 85%, 80%, 0.35)` // pastel colors
    });
  }
}

function animateBubbles() {
  cosmicCtx.clearRect(0, 0, elements.cosmicCanvas.width, elements.cosmicCanvas.height);
  
  bubbles.forEach(b => {
    b.y -= b.speedY;
    b.wobbleOffset += b.wobbleSpeed;
    
    const currentX = b.x + Math.sin(b.wobbleOffset) * b.wobbleAmount;
    
    // Draw soft translucent bubble
    cosmicCtx.beginPath();
    cosmicCtx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
    cosmicCtx.fillStyle = b.color;
    cosmicCtx.fill();
    
    // Inner highlight/reflection for 3D shine look
    cosmicCtx.beginPath();
    cosmicCtx.arc(currentX - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.22, 0, Math.PI * 2);
    cosmicCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    cosmicCtx.fill();

    // Soft border for the bubble
    cosmicCtx.beginPath();
    cosmicCtx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
    cosmicCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    cosmicCtx.lineWidth = 1.5;
    cosmicCtx.stroke();
    
    // Reset when bubble floats off the top
    if (b.y < -b.radius * 2) {
      b.y = elements.cosmicCanvas.height + b.radius * 2;
      b.x = Math.random() * elements.cosmicCanvas.width;
    }
  });

  requestAnimationFrame(animateBubbles);
}
resizeCosmicCanvas();
animateBubbles();

// --- Gamification State Logic ---
function loadProgress() {
  state.score = parseInt(localStorage.getItem('mathland_score')) || 0;
  state.streak = parseInt(localStorage.getItem('mathland_streak')) || 0;
  state.bestStreak = parseInt(localStorage.getItem('mathland_best_streak')) || 0;
  state.isSoundOn = localStorage.getItem('mathland_sound') !== 'false';
  state.isTimerOn = localStorage.getItem('mathland_timer') === 'true';
  state.difficulty = localStorage.getItem('mathland_difficulty') || 'easy';
  state.operator = localStorage.getItem('mathland_operator') || 'addition';

  elements.scoreVal.textContent = `⭐ ${state.score}`;
  elements.streakVal.textContent = `🔥 ${state.streak}`;
  elements.bestStreakVal.textContent = `🏆 ${state.bestStreak}`;

  updateRankDisplay();
  
  if (state.isSoundOn) {
    elements.toggleSound.classList.add('active');
    elements.toggleSound.querySelector('.btn-text').textContent = 'Sound ON';
  } else {
    elements.toggleSound.classList.remove('active');
    elements.toggleSound.querySelector('.btn-text').textContent = 'Sound OFF';
  }

  if (state.isTimerOn) {
    elements.toggleTimer.classList.add('active');
    elements.toggleTimer.querySelector('.btn-text').textContent = 'Timer ON';
    elements.timerBarContainer.style.display = 'flex';
  } else {
    elements.toggleTimer.classList.remove('active');
    elements.toggleTimer.querySelector('.btn-text').textContent = 'Timer OFF';
    elements.timerBarContainer.style.display = 'none';
  }

  elements.opBtns.forEach(btn => {
    if (btn.dataset.operator === state.operator) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  elements.diffTabs.forEach(tab => {
    if (tab.dataset.difficulty === state.difficulty) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

function saveProgress() {
  localStorage.setItem('mathland_score', state.score);
  localStorage.setItem('mathland_streak', state.streak);
  localStorage.setItem('mathland_best_streak', state.bestStreak);
  localStorage.setItem('mathland_sound', state.isSoundOn);
  localStorage.setItem('mathland_timer', state.isTimerOn);
  localStorage.setItem('mathland_difficulty', state.difficulty);
  localStorage.setItem('mathland_operator', state.operator);
}

function updateRankDisplay() {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];

  for (let i = 0; i < RANKS.length; i++) {
    if (state.score >= RANKS[i].minScore && state.score < RANKS[i].maxScore) {
      currentRank = RANKS[i];
      nextRank = RANKS[i+1] || null;
      break;
    }
  }

  if (state.score >= RANKS[RANKS.length - 1].minScore) {
    currentRank = RANKS[RANKS.length - 1];
    nextRank = null;
  }

  const prevRankName = elements.levelVal.dataset.rankName;
  elements.levelVal.textContent = currentRank.name;
  elements.levelVal.dataset.rankName = currentRank.name;

  if (prevRankName && prevRankName !== currentRank.name && state.score > 0) {
    playSynthesizedSound('levelup');
    triggerConfetti();
    elements.levelVal.style.animation = 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    setTimeout(() => { elements.levelVal.style.animation = ''; }, 1000);
  }

  if (nextRank) {
    const range = nextRank.minScore - currentRank.minScore;
    const progress = state.score - currentRank.minScore;
    const percentage = Math.min(100, Math.max(0, (progress / range) * 100));
    elements.rankProgress.style.width = `${percentage}%`;
  } else {
    elements.rankProgress.style.width = '100%';
  }
}

// --- Math Problems Generator ---
function getDifficultyBounds() {
  let bounds = { max: 10, multMax: 5 };
  if (state.difficulty === 'medium') {
    bounds.max = 20;
    bounds.multMax = 10;
  } else if (state.difficulty === 'hard') {
    bounds.max = 100;
    bounds.multMax = 12;
  }
  return bounds;
}

function generateProblem() {
  state.selectedEmoji = CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)];
  elements.questionBoard.classList.remove('shake');
  elements.answerInput.value = '';
  elements.answerInput.focus();

  const bounds = getDifficultyBounds();
  
  let activeOpType = state.operator;
  if (state.operator === 'random') {
    const ops = ['addition', 'subtraction', 'multiplication', 'division'];
    activeOpType = ops[Math.floor(Math.random() * ops.length)];
  }

  let a = 0;
  let b = 0;
  let opSymbol = '+';
  let ans = 0;

  switch (activeOpType) {
    case 'addition':
      a = Math.floor(Math.random() * (bounds.max + 1));
      b = Math.floor(Math.random() * (bounds.max + 1));
      ans = a + b;
      opSymbol = '+';
      break;

    case 'subtraction':
      a = Math.floor(Math.random() * (bounds.max + 1));
      b = Math.floor(Math.random() * (bounds.max + 1));
      if (a < b) {
        const temp = a;
        a = b;
        b = temp;
      }
      ans = a - b;
      opSymbol = '-';
      break;

    case 'multiplication':
      a = Math.floor(Math.random() * (bounds.multMax + 1));
      b = Math.floor(Math.random() * (bounds.multMax + 1));
      ans = a * b;
      opSymbol = '×';
      break;

    case 'division':
      b = Math.floor(Math.random() * bounds.multMax) + 1; 
      const q = Math.floor(Math.random() * (bounds.multMax + 1)); 
      a = b * q;
      ans = q;
      opSymbol = '÷';
      break;
  }

  state.num1 = a;
  state.num2 = b;
  state.correctAnswer = ans;
  state.currentOpSymbol = opSymbol;
  state.hasActiveProblem = true;

  elements.num1Card.textContent = a;
  elements.num2Card.textContent = b;
  elements.activeOp.textContent = opSymbol;

  elements.alertMsg.className = 'alert-message';
  elements.alertMsg.textContent = 'Can you solve this? 🌟';

  elements.btnGenerate.classList.remove('pulse-btn');
  elements.btnGenerate.textContent = 'Generate';

  if (state.isTimerOn) {
    startTimer();
  }
}

// --- Timer Control ---
function startTimer() {
  clearInterval(state.timerInterval);
  
  if (state.difficulty === 'easy') {
    state.totalTimeLimit = 25;
  } else if (state.difficulty === 'medium') {
    state.totalTimeLimit = 15;
  } else {
    state.totalTimeLimit = 10;
  }

  state.timeRemaining = state.totalTimeLimit;
  updateTimerUI();

  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    updateTimerUI();

    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// Update countdown UI
function updateTimerUI() {
  const percentage = (state.timeRemaining / state.totalTimeLimit) * 100;
  elements.timerProgress.style.width = `${percentage}%`;
  elements.timerDisplay.textContent = `${state.timeRemaining}s`;

  if (state.timeRemaining <= 3) {
    elements.timerProgress.style.backgroundColor = '#f87171'; 
  } else if (state.timeRemaining <= state.totalTimeLimit / 2) {
    elements.timerProgress.style.backgroundColor = '#fbbf24'; 
  } else {
    elements.timerProgress.style.backgroundColor = ''; 
  }
}

function handleTimeout() {
  playSynthesizedSound('wrong');
  state.streak = 0;
  elements.streakVal.textContent = `🔥 ${state.streak}`;
  saveProgress();

  elements.alertMsg.className = 'alert-message wrong';
  elements.alertMsg.textContent = `⏰ Out of time! The correct answer was ${state.correctAnswer}.`;
  
  state.hasActiveProblem = false;
  elements.answerInput.value = state.correctAnswer;
}

// --- Answer Validation ---
function checkAnswer() {
  if (!state.hasActiveProblem) {
    elements.alertMsg.textContent = 'Click "Generate" to generate a new quiz!';
    return;
  }

  const userInputValue = elements.answerInput.value.trim();

  if (userInputValue === '') {
    elements.alertMsg.textContent = 'Please enter an answer first! 🤔';
    return;
  }

  const userAnswer = parseInt(userInputValue, 10);
  clearInterval(state.timerInterval);

  if (userAnswer === state.correctAnswer) {
    playSynthesizedSound('correct');
    triggerConfetti();

    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) {
      state.bestStreak = state.streak;
    }

    elements.scoreVal.textContent = `⭐ ${state.score}`;
    elements.streakVal.textContent = `🔥 ${state.streak}`;
    elements.bestStreakVal.textContent = `🏆 ${state.bestStreak}`;
    
    updateRankDisplay();
    saveProgress();

    elements.alertMsg.className = 'alert-message correct';
    
    const responses = [
      'Correct! You are awesome! 🎉',
      'Splendid! Math Superstar! ⭐',
      'Yes! Super Math Powers! 🦸‍♂️',
      'Boom! Perfect math! 🚀',
      'Sensational! Keep it up! 👑'
    ];
    elements.alertMsg.textContent = responses[Math.floor(Math.random() * responses.length)];

    state.hasActiveProblem = false;
    
    // Auto advance
    setTimeout(() => {
      if (!state.hasActiveProblem && elements.answerInput.value !== '') {
        generateProblem();
      }
    }, 2500);

  } else {
    playSynthesizedSound('wrong');
    
    state.streak = 0;
    elements.streakVal.textContent = `🔥 ${state.streak}`;
    saveProgress();

    elements.questionBoard.classList.remove('shake');
    void elements.questionBoard.offsetWidth; 
    elements.questionBoard.classList.add('shake');

    elements.alertMsg.className = 'alert-message wrong';
    
    const wrongResponses = [
      'Oops! Let\'s try that one again. 🛠️',
      'Not quite. You can do it! 💪',
      'Almost! Check your counting. 🧮',
      'Not correct yet. Let\'s try again! 🎯'
    ];
    elements.alertMsg.textContent = wrongResponses[Math.floor(Math.random() * wrongResponses.length)];
    
    if (state.isTimerOn) {
      startTimer();
    }
  }
}

// --- Event Listeners and Triggers ---
function registerEventListeners() {
  
  elements.opBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSynthesizedSound('click');
      const targetOp = btn.dataset.operator;
      
      elements.opBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.operator = targetOp;
      saveProgress();
      generateProblem();
    });
  });

  elements.diffTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      playSynthesizedSound('click');
      const targetDiff = tab.dataset.difficulty;
      
      elements.diffTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      state.difficulty = targetDiff;
      saveProgress();

      if (state.isTimerOn) {
        clearInterval(state.timerInterval);
      }
      generateProblem();
    });
  });

  elements.toggleSound.addEventListener('click', () => {
    state.isSoundOn = !state.isSoundOn;
    if (state.isSoundOn) {
      elements.toggleSound.classList.add('active');
      elements.toggleSound.querySelector('.btn-text').textContent = 'Sound ON';
      playSynthesizedSound('click');
    } else {
      elements.toggleSound.classList.remove('active');
      elements.toggleSound.querySelector('.btn-text').textContent = 'Sound OFF';
    }
    saveProgress();
  });

  elements.toggleTimer.addEventListener('click', () => {
    state.isTimerOn = !state.isTimerOn;
    playSynthesizedSound('click');
    
    if (state.isTimerOn) {
      elements.toggleTimer.classList.add('active');
      elements.toggleTimer.querySelector('.btn-text').textContent = 'Timer ON';
      elements.timerBarContainer.style.display = 'flex';
      if (state.hasActiveProblem) {
        startTimer();
      }
    } else {
      elements.toggleTimer.classList.remove('active');
      elements.toggleTimer.querySelector('.btn-text').textContent = 'Timer OFF';
      elements.timerBarContainer.style.display = 'none';
      clearInterval(state.timerInterval);
    }
    saveProgress();
  });

  elements.btnCheck.addEventListener('click', checkAnswer);

  elements.answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });

  elements.btnGenerate.addEventListener('click', () => {
    playSynthesizedSound('click');
    generateProblem();
  });

  elements.questionBoard.addEventListener('click', (e) => {
    if (e.target !== elements.answerInput && e.target !== elements.btnCheck) {
      elements.answerInput.focus();
    }
  });

  document.body.addEventListener('click', () => {
    initAudio();
  }, { once: true });
}

// --- Initialize App ---
function init() {
  loadProgress();
  registerEventListeners();
  
  elements.num1Card.textContent = '?';
  elements.num2Card.textContent = '?';
  elements.activeOp.textContent = '🚀';
  elements.alertMsg.textContent = 'Welcome to MathLand! Click "Generate" to begin your mission!';
  elements.btnGenerate.textContent = '🚀 Generate';
}

window.onload = init;
