// ===========================================================================
//                             Event Horizon
// ===========================================================================

const totalRows = 8;

// DOM Elements
const gameBoard = document.querySelector(".game-grid");
const participantNumberEl = document.querySelectorAll(".participant-numbers");
const numberRow = document.querySelector(".number-row");
numberRow.classList.add("grid-row");

const numberSelector = document.querySelector(".number-selector");
const allNumbers = numberSelector.getElementsByClassName("row-element");
const submitBtn = document.getElementById("submit-move");
const turnIndicator = document.querySelector(".turn-indicator");
const turnProfileImg = document.getElementById("turn-img") || document.querySelector(".turn-status .profile-img");
const computerState = document.querySelector("#computer-state");

// Header, Overlays & Controls
const resumeBtn = document.getElementById("resume-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const pauseResumeBtn = document.getElementById("pause-resume-btn");
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameStatusText = document.getElementById("game-status-text");
const pausePlayerScore = document.getElementById("pause-player-score");
const pauseComputerScore = document.getElementById("pause-computer-score");
const rotatePrompt = document.getElementById("rotate-device-prompt");
const dismissRotateBtn = document.getElementById("dismiss-rotate-btn");

const playerScoreEl = document.getElementById("player-score");
const computerScoreEl = document.getElementById("computer-score");

// ===========================================================================
//                      Board & UI Generation
// ===========================================================================

function createGameGrid() {
  let row = 1;

  while (row <= totalRows) {
    const gridRow = document.createElement("div");
    gridRow.classList.add("grid-row");
    gameBoard.appendChild(gridRow);

    let elementCount = 1;
    while (elementCount <= row) {
      const element = createGridElement(gridRow);
      element.id = `r${row}-c${elementCount}`;
      elementCount += 1;
    }

    row += 1;
  }
}

function createGridElement(row) {
  const rowElement = document.createElement("div");
  rowElement.classList.add("row-element");
  rowElement.classList.add("empty");

  row.appendChild(rowElement);

  const elementNumber = document.createElement("p");
  elementNumber.classList.add("element-number");
  rowElement.appendChild(elementNumber);

  return rowElement;
}

function getParticipantNumber(participant) {
  const numberElementGrid = document.createElement("div");
  numberElementGrid.classList.add("grid-row");
  participant.appendChild(numberElementGrid);

  let i = 1;
  while (i <= 9) {
    const elementBox = document.createElement("div");
    elementBox.classList.add("element-box");

    const gridEl = createGridElement(numberElementGrid);
    gridEl.classList.remove("empty");
    gridEl.classList.add("selected-enabled");
    elementBox.appendChild(gridEl);

    const numberQuota = document.createElement("small");
    numberQuota.classList.add("number-quota");
    elementBox.appendChild(numberQuota);
    numberQuota.textContent = 2;

    const elementNumber = gridEl.querySelector(".element-number");
    elementNumber.textContent = i;
    i += 1;

    numberElementGrid.appendChild(elementBox);
  }
}

function getNumberSelector() {
  let i = 1;
  while (i <= 9) {
    const gridEl = createGridElement(numberRow);
    gridEl.classList.remove("empty");
    gridEl.classList.add("selected-enabled");

    const elementNumber = gridEl.querySelector(".element-number");
    elementNumber.textContent = i;
    i += 1;
  }
}

// Generate participant number inventories, game grid, and number selector
for (const participant of participantNumberEl) {
  getParticipantNumber(participant);
}

createGameGrid();

const allElements = gameBoard.querySelectorAll(".row-element");

getNumberSelector();

// ===========================================================================
//                      Game State
// ===========================================================================

const gameState = {
  currentTurn: "player",
  playerScore: 0,
  computerScore: 0,
  playerMoves: 0,
  computerMoves: 0,
  totalMoves: 0,
  selectedPosition: null,
  selectedNumber: null,
  gameWinner: null,
  playerWins: 0,
  computerWins: 0,
  isPaused: false,
  isGameOver: false,
};

function createNumbersObj() {
  let i = 1;
  const participantNumbers = {};

  while (i <= 9) {
    participantNumbers[i] = 2;
    i += 1;
  }

  return participantNumbers;
}

gameState.playerNumbers = createNumbersObj();
gameState.computerNumbers = createNumbersObj();

function createElementIds() {
  const elementIds = [];
  let rowCount = 1;
  while (rowCount <= totalRows) {
    let elementCount = 1;
    while (elementCount <= rowCount) {
      const elementId = `r${rowCount}-c${elementCount}`;
      elementIds.push(elementId);
      elementCount += 1;
    }
    rowCount += 1;
  }

  return elementIds;
}

function createBoardState() {
  const positions = {};
  const elementIds = createElementIds();
  for (const id of elementIds) {
    positions[id] = {
      value: null,
      owner: null,
    };
  }

  return positions;
}

gameState.board = createBoardState();

// ===========================================================================
//                      Pausable Timer System
// ===========================================================================

/**
 * Tracks in-flight delay so it can be suspended when paused
 * and resumed with the exact remaining duration when unpaused.
 */
let activePausableTimer = null;

function pausableDelay(seconds) {
  return new Promise((resolve) => {
    const durationMs = seconds * 1000;
    let remainingMs = durationMs;
    let startTime = Date.now();
    let timeoutId = null;

    const start = () => {
      startTime = Date.now();
      timeoutId = setTimeout(() => {
        activePausableTimer = null;
        resolve();
      }, remainingMs);
    };

    const pause = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
        remainingMs -= Date.now() - startTime;
        if (remainingMs < 0) remainingMs = 0;
      }
    };

    const resume = () => {
      if (timeoutId === null && remainingMs > 0) {
        start();
      } else if (remainingMs <= 0) {
        activePausableTimer = null;
        resolve();
      }
    };

    activePausableTimer = { pause, resume };

    if (gameState.isPaused) {
      pause();
    } else {
      start();
    }
  });
}

// Fallback alias for non-gameplay standard delays
const delay = (seconds) => pausableDelay(seconds);

// ===========================================================================
//                      Pause & Resume Management
// ===========================================================================

function pauseGame() {
  if (gameState.isGameOver || gameState.isPaused) return;

  gameState.isPaused = true;
  document.body.classList.add("game-paused");

  // Keep score indicators in pause overlay up to date
  if (pausePlayerScore) pausePlayerScore.textContent = gameState.playerScore;
  if (pauseComputerScore) pauseComputerScore.textContent = gameState.computerScore;

  if (gameStatusText) gameStatusText.textContent = "Game Paused";

  // Suspend any in-progress timers (e.g. computer thinking)
  if (activePausableTimer) {
    activePausableTimer.pause();
  }

  // Show pause overlay
  if (pauseOverlay) {
    pauseOverlay.classList.remove("overlay-hidden");
  }
}

function resumeGame() {
  if (gameState.isGameOver || !gameState.isPaused) return;

  gameState.isPaused = false;
  document.body.classList.remove("game-paused");

  if (gameStatusText) gameStatusText.textContent = "Game in Progress";

  // Hide pause overlay
  if (pauseOverlay) {
    pauseOverlay.classList.add("overlay-hidden");
  }

  // Resume suspended timers from where they left off
  if (activePausableTimer) {
    activePausableTimer.resume();
  }
}

// Top-left corner Resume button toggles pause/resume during gameplay
if (resumeBtn) {
  resumeBtn.addEventListener("click", () => {
    if (gameState.isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  });
}

// Pause Overlay "Resume Game" action button
if (pauseResumeBtn) {
  pauseResumeBtn.addEventListener("click", () => {
    resumeGame();
  });
}

// Keyboard shortcut (Escape or P) for accessible pause toggle
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    if (!gameState.isGameOver) {
      if (gameState.isPaused) {
        resumeGame();
      } else {
        pauseGame();
      }
    }
  }
});

// Rotate Device Prompt dismissal button
if (dismissRotateBtn && rotatePrompt) {
  dismissRotateBtn.addEventListener("click", () => {
    rotatePrompt.classList.add("dismissed");
  });
}

// ===========================================================================
//                      Board Position Selection
// ===========================================================================

for (const element of allElements) {
  element.addEventListener("click", () => {
    // Block interactions while paused or game over
    if (gameState.isPaused || gameState.isGameOver) return;

    // Don't allow selection during computer's turn
    if (gameState.currentTurn !== "player") return;

    // Don't allow selecting occupied positions
    if (gameState.board[element.id].value !== null) return;

    const previouslySelected = document.querySelector(".empty-selected");

    // Clicking the currently selected position — deselect it
    if (gameState.selectedPosition === element.id) {
      element.classList.remove("empty-selected");
      element.classList.add("empty");
      gameState.selectedPosition = null;
      return;
    }

    // Remove selection from previously selected position
    if (previouslySelected) {
      previouslySelected.classList.remove("empty-selected");
      previouslySelected.classList.add("empty");
    }

    // Select the new position
    element.classList.remove("empty");
    element.classList.add("empty-selected");
    gameState.selectedPosition = element.id;
  });
}

// ===========================================================================
//                      Number Selection
// ===========================================================================

const numberSelectorElements = numberSelector.querySelectorAll(".number-row .row-element");

for (const number of numberSelectorElements) {
  number.addEventListener("click", () => {
    // Block interactions while paused or game over
    if (gameState.isPaused || gameState.isGameOver) return;

    // Don't allow selection during computer's turn
    if (gameState.currentTurn !== "player") return;

    // Don't allow selecting disabled numbers
    if (number.classList.contains("selected-disabled")) return;

    const selectedEl = numberSelector.querySelector(".selected");

    // Clicking the currently selected number — deselect it
    if (selectedEl === number) {
      number.classList.remove("selected");
      number.classList.add("selected-enabled");
      gameState.selectedNumber = null;
      return;
    }

    // Remove selection from previously selected number
    if (selectedEl) {
      selectedEl.classList.remove("selected");
      selectedEl.classList.add("selected-enabled");
    }

    // Select the new number
    number.classList.remove("selected-enabled");
    number.classList.add("selected");
    gameState.selectedNumber = parseInt(number.textContent, 10);
  });
}

// ===========================================================================
//                      Move Validation & Execution
// ===========================================================================

function canMakeMove(owner, position, value) {
  if (gameState.isPaused || gameState.isGameOver) return false;
  if (position === null) return false;
  if (value === null) return false;
  if (gameState.board[position].value !== null) return false;
  if (gameState[`${owner}Numbers`][value] === 0) return false;
  if (gameState.currentTurn !== owner) return false;

  return true;
}

function makeMove() {
  // Maintained for backward compatibility
  return makeAnyMove("player", gameState.selectedPosition, gameState.selectedNumber);
}

function updateNumberSelector() {
  for (const number of numberSelectorElements) {
    const value = parseInt(number.textContent, 10);
    const remaining = gameState.playerNumbers[value];

    number.classList.remove(
      "selected",
      "selected-disabled",
      "selected-enabled",
    );

    if (remaining === 0) {
      number.classList.add("selected-disabled");
    } else {
      number.classList.add("selected-enabled");
    }
  }
}

// ===========================================================================
//                      Turn System
// ===========================================================================

function updateTurnIndicator() {
  const isPlayer = gameState.currentTurn === "player";
  turnIndicator.textContent = isPlayer ? "Your turn" : "Computer's turn";

  if (turnProfileImg) {
    turnProfileImg.style.backgroundColor = isPlayer ? "#6D28D9" : "#B45309";
    turnProfileImg.classList.toggle("player-turn", isPlayer);
    turnProfileImg.classList.toggle("computer-turn", !isPlayer);
  }
}

function turnTransition() {
  gameState.currentTurn = gameState.currentTurn === "player" ? "computer" : "player";
  updateTurnIndicator();
}

// ===========================================================================
//                      Initialize Display
// ===========================================================================

updateNumberSelector();
updateTurnIndicator();
document.getElementById("player-score").textContent = gameState.playerScore;
document.getElementById("computer-score").textContent = gameState.computerScore;
document.getElementById("player-moves").textContent = gameState.playerMoves;
document.getElementById("computer-moves").textContent = gameState.computerMoves;

// ===========================================================================
//                      Computer Move
// ===========================================================================

function getLegalMoves() {
  const legalMoves = [];
  const allMoves = gameState.board;

  for (const move in allMoves) {
    if (
      gameState.board[move].value === null &&
      gameState.board[move].owner === null
    ) {
      legalMoves.push(move);
    }
  }
  return legalMoves;
}

function getAvailableNumbers() {
  const allNumbersObj = gameState.computerNumbers;
  const availableNumbers = {};

  for (const number in allNumbersObj) {
    if (allNumbersObj[number] !== 0) {
      availableNumbers[number] = allNumbersObj[number];
    }
  }

  return availableNumbers;
}

function makeComputerMove() {
  const legalMoves = getLegalMoves();
  const computerNumbers = getAvailableNumbers();
  const keys = Object.keys(computerNumbers);
  if (keys.length === 0 || legalMoves.length === 0) return false;

  const randomKeyIdx = Math.floor(Math.random() * keys.length);
  const randomIdx = Math.floor(Math.random() * legalMoves.length);
  const randomKey = parseInt(keys[randomKeyIdx], 10);
  const randomMove = legalMoves[randomIdx];

  if (canMakeMove("computer", randomMove, randomKey)) {
    makeAnyMove("computer", randomMove, randomKey);
  }

  return true;
}

function makeAnyMove(owner, position, value) {
  // 1. Update core game state
  gameState.board[position].value = value;
  gameState.board[position].owner = owner; // Can be "player" or "computer"
  gameState.totalMoves += 1;

  // Track inventory and move counts conditionally based on owner
  if (owner === "player") {
    gameState.playerNumbers[value] -= 1;
    gameState.playerMoves += 1;
    document.getElementById("player-moves").textContent = gameState.playerMoves;

    // Update player number inventory UI
    const playerNumbersEl = document.querySelectorAll(
      ".participant-numbers",
    )[0];
    const quotaElements = playerNumbersEl.querySelectorAll(".number-quota");
    quotaElements[value - 1].textContent = gameState.playerNumbers[value];
  } else {
    gameState.computerNumbers[value] -= 1;
    gameState.computerMoves += 1;
    document.getElementById("computer-moves").textContent =
      gameState.computerMoves;

    // Update computer number inventory UI
    const computerNumbersEl = document.querySelectorAll(
      ".participant-numbers",
    )[1];
    const quotaElements = computerNumbersEl.querySelectorAll(".number-quota");
    quotaElements[value - 1].textContent = gameState.computerNumbers[value];
  }

  // 2. Update board UI (Shared by both)
  const boardEl = document.getElementById(position);
  const elValue = boardEl.querySelector(".element-number");
  elValue.textContent = value;

  boardEl.classList.remove("empty-selected");
  boardEl.classList.add("selected-disabled");
  boardEl.classList.add(`${owner}-placed`);

  // 3. Clear player-specific UI controls if it was a player move
  if (owner === "player") {
    const selectedNumberEl = numberSelector.querySelector(".selected");
    if (selectedNumberEl) {
      selectedNumberEl.classList.remove("selected");
      selectedNumberEl.classList.add("selected-enabled");
    }

    // Reset temporary selection state
    gameState.selectedPosition = null;
    gameState.selectedNumber = null;

    // Refresh player's selector tray
    updateNumberSelector();
  }

  const blackHole = checkBlackhole();

  if (blackHole) {
    handleBlackhole(blackHole);
    return false;
  }

  return true;
}

async function handleComputerMove() {
  computerState.innerHTML = `Thinking... <small>Analyzing the board</small>`;

  // Suspends safely if the game is paused during computer turn
  await pausableDelay(2);

  const moveMade = makeComputerMove();

  if (moveMade) {
    turnTransition();
    computerState.innerHTML = `Waiting... <small></small>`;
    return true;
  } else {
    computerState.textContent = "Great Game!";
    return false;
  }
}

// ===========================================================================
//                      Black Hole & End Game Logic
// ===========================================================================

function checkBlackhole() {
  const legalMoves = getLegalMoves();

  if (legalMoves.length === 1) {
    const lastPos = legalMoves[0];
    const blackHole = assignBlackhole(lastPos);

    return {
      position: lastPos,
      state: blackHole,
    };
  }
  return false;
}

function assignBlackhole(position) {
  const blackHoleTarget = gameState.board[position];
  blackHoleTarget.specialState = "blackhole";
  return blackHoleTarget;
}

function updateBlackholeUi(blackhole) {
  const blackholeId = blackhole.position;
  const blackholeEl = document.getElementById(blackholeId);
  blackholeEl.classList.add("blackhole");
}

function getNearestElements(blackholePos) {
  const [rowPart, colPart] = blackholePos.split("-");

  const rowNum = parseInt(rowPart.replace("r", ""), 10);
  const colNum = parseInt(colPart.replace("c", ""), 10);

  const rawNeighboringPositions = calculateNeighboringPositions(rowNum, colNum);
  const finalNeighboringPositions = [];

  for (const position of rawNeighboringPositions) {
    if (gameState.board[position]) {
      finalNeighboringPositions.push(position);
    }
  }

  return finalNeighboringPositions;
}

function handleBlackhole(blackHole) {
  if (!blackHole) return;
  const blackholeEl = document.getElementById(blackHole.position);
  const blackholeRect = blackholeEl.getBoundingClientRect();
  const blackholeCenterX = blackholeRect.left + blackholeRect.width / 2;
  const blackholeCenterY = blackholeRect.top + blackholeRect.height / 2;

  let computerScore = 0;
  let playerScore = 0;

  updateBlackholeUi(blackHole);
  const nearestPositions = getNearestElements(blackHole.position);

  for (const position of nearestPositions) {
    const positionEl = document.getElementById(position);
    const positionRect = positionEl.getBoundingClientRect();
    const positionCenterX = positionRect.left + positionRect.width / 2;
    const positionCenterY = positionRect.top + positionRect.height / 2;
    const pullX = blackholeCenterX - positionCenterX;
    const pullY = blackholeCenterY - positionCenterY;

    // 1. Inject the pull distances as CSS variables on the specific element
    positionEl.style.setProperty("--pull-x", `${pullX}px`);
    positionEl.style.setProperty("--pull-y", `${pullY}px`);

    // 2. Trigger the CSS animation by appending the class
    positionEl.classList.add("blackhole-consumed");

    const positionElState = gameState.board[position];

    if (positionElState.owner === "computer") {
      computerScore += parseInt(positionElState.value, 10);
    } else if (positionElState.owner === "player") {
      playerScore += parseInt(positionElState.value, 10);
    }
  }

  gameState.playerScore = playerScore;
  gameState.computerScore = computerScore;

  showEndGameModal();
}

function calculateNeighboringPositions(row, col) {
  const neighboringPositions = [];

  // Same Row
  const sameRowPos1 = `r${row}-c${col - 1}`;
  const sameRowPos2 = `r${row}-c${col + 1}`;

  // Row Above
  const rowAbovePos1 = `r${row - 1}-c${col - 1}`;
  const rowAbovePos2 = `r${row - 1}-c${col}`;

  // Row Below
  const rowBelowPos1 = `r${row + 1}-c${col}`;
  const rowBelowPos2 = `r${row + 1}-c${col + 1}`;

  neighboringPositions.push(
    sameRowPos1,
    sameRowPos2,
    rowAbovePos1,
    rowAbovePos2,
    rowBelowPos1,
    rowBelowPos2,
  );

  return neighboringPositions;
}

async function showEndGameModal() {
  gameState.isGameOver = true;

  // Ensure pause overlay is dismissed when game ends
  if (pauseOverlay) {
    pauseOverlay.classList.add("overlay-hidden");
  }

  if (gameStatusText) {
    gameStatusText.textContent = "Game Over";
  }

  await pausableDelay(1.3);

  const overlay = document.getElementById("game-over-overlay");
  const winnerTitle = document.getElementById("winner-announcement");
  const finalPlayer = document.getElementById("final-player-score");
  const finalComputer = document.getElementById("final-computer-score");

  // 1. Inject the data straight from game state
  finalPlayer.textContent = gameState.playerScore;
  finalComputer.textContent = gameState.computerScore;

  // 2. Determine who won based on score checks
  if (gameState.playerScore > gameState.computerScore) {
    winnerTitle.textContent = "🏆 Player Wins!";
    winnerTitle.style.color = "#4caf50"; // Green accent
    localStorage.setItem("lastWinner", "player");
  } else if (gameState.computerScore > gameState.playerScore) {
    winnerTitle.textContent = "🤖 Computer Wins!";
    winnerTitle.style.color = "#f44336"; // Red accent
    localStorage.setItem("lastWinner", "computer");
  } else {
    winnerTitle.textContent = "🤝 It's a Tie!";
    winnerTitle.style.color = "#ffeb3b"; // Yellow accent
    localStorage.setItem("lastWinner", "tie");
  }

  // 3. Unhide the overlay block visually
  overlay.classList.remove("overlay-hidden");
}

// ===========================================================================
//                      Persistent Win Tracking
// ===========================================================================

const winner = localStorage.getItem("lastWinner");
gameState.gameWinner = winner;

let playerWins = parseInt(localStorage.getItem("playerWins"), 10) || 0;
let computerWins = parseInt(localStorage.getItem("computerWins"), 10) || 0;

if (winner === "player") {
  playerWins += 1;
  localStorage.setItem("playerWins", playerWins);
} else if (winner === "computer") {
  computerWins += 1;
  localStorage.setItem("computerWins", computerWins);
}

playerScoreEl.textContent = localStorage.getItem("playerWins") || 0;
computerScoreEl.textContent = localStorage.getItem("computerWins") || 0;

// ===========================================================================
//                      Game Initialization & Reset
// ===========================================================================

function initGame() {
  // Always register submit button handler
  submitBtn.addEventListener("click", async () => {
    if (gameState.isPaused || gameState.isGameOver) return;

    const targetPos = gameState.selectedPosition;
    const targetVal = gameState.selectedNumber;

    if (canMakeMove("player", targetPos, targetVal)) {
      const moveMade = makeAnyMove("player", targetPos, targetVal);

      if (moveMade) {
        turnTransition();
        await handleComputerMove();
      }
    }
  });

  // If computer was previous winner, computer starts first
  if (winner === "computer") {
    gameState.currentTurn = "computer";
    updateTurnIndicator();
    handleComputerMove();
  } else {
    updateTurnIndicator();
  }
}

function getWinner() {
  if (gameState.playerScore > gameState.computerScore) {
    return "player";
  } else if (gameState.computerScore > gameState.playerScore) {
    return "computer";
  }
  return null;
}

function resetGame() {
  localStorage.setItem("playerWins", 0);
  localStorage.setItem("computerWins", 0);
  localStorage.setItem("lastWinner", "");
}
window.resetGame = resetGame;

// Start game
initGame();