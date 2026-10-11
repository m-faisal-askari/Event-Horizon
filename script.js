const totalRows = 8;

// DOM Elements
const gameBoard = document.querySelector(".game-grid");
const participantNumberEl = document.querySelectorAll(".participant-numbers");
const numberRow = document.querySelector(".number-row");
numberRow.classList.add("grid-row");

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
//                      Board Position Selection
// ===========================================================================

for (const element of allElements) {
  element.addEventListener("click", () => {
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

const numberSelector = document.querySelector(".number-selector");
const allNumbers = numberSelector.querySelectorAll(".row-element");
const submitBtn = numberSelector.querySelector("button");

for (const number of allNumbers) {
  number.addEventListener("click", () => {
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
    gameState.selectedNumber = parseInt(number.textContent);
  });
}

// ===========================================================================
//                      Move Validation & Execution
// ===========================================================================

function canMakeMove(owner, position, value) {
  if (position === null) return false;
  if (value === null) return false;
  if (gameState.board[position].value !== null) return false;
  if (gameState[`${owner}Numbers`][value] === 0) return false;
  if (gameState.currentTurn !== owner) return false;

  return true;
}

function makeMove() {
  const selectedValue = gameState.selectedNumber;
  const selectedPos = gameState.selectedPosition;

  // Update game state
  gameState.board[selectedPos].value = selectedValue;
  gameState.board[selectedPos].owner = "player";
  gameState.playerNumbers[selectedValue] -= 1;
  gameState.playerMoves += 1;
  gameState.totalMoves += 1;

  // Update board UI
  const boardEl = document.getElementById(selectedPos);
  const elValue = boardEl.querySelector(".element-number");
  elValue.textContent = selectedValue;
  boardEl.classList.add("selected-disabled");
  boardEl.classList.remove("empty-selected");

  // Update player moves display
  document.getElementById("player-moves").textContent = gameState.playerMoves;

  // Update player number inventory display
  const playerNumbersEl = document.querySelectorAll(".participant-numbers")[0];
  const quotaElements = playerNumbersEl.querySelectorAll(".number-quota");
  quotaElements[selectedValue - 1].textContent =
    gameState.playerNumbers[selectedValue];

  // Clear number selector visual state
  const selectedNumberEl = numberSelector.querySelector(".selected");
  if (selectedNumberEl) {
    selectedNumberEl.classList.remove("selected");
    selectedNumberEl.classList.add("selected-enabled");
  }

  // Reset selection state
  gameState.selectedPosition = null;
  gameState.selectedNumber = null;

  // Update number selector (disable depleted numbers)
  updateNumberSelector();

  return true;
}

function updateNumberSelector() {
  for (const number of allNumbers) {
    const value = parseInt(number.textContent);
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

const turnIndicator = document.querySelector(".turn-indicator");

function turnTransition() {
  if (gameState.currentTurn === "player") {
    gameState.currentTurn = "computer";
    turnIndicator.textContent = "Computer's turn";
  } else {
    gameState.currentTurn = "player";
    turnIndicator.textContent = "Your turn";
  }
}

// ===========================================================================
//                      Submit Button
// ===========================================================================

// submitBtn.addEventListener("click", async () => {
//   const targetPos = gameState.selectedPosition;
//   const targetVal = gameState.selectedNumber;

//   if (canMakeMove("player", targetPos, targetVal)) {
//     const moveMade = makeAnyMove("player", targetPos, targetVal);

//     if (moveMade) {
//       turnTransition();

//       await handleComputerMove();
//     }
//   }
// });

// ===========================================================================
//                      Initialize Display
// ===========================================================================

updateNumberSelector();
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
  // console.log(allMoves)

  for (const move in allMoves) {
    // console.log(move)
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
  const allNumbers = gameState.computerNumbers;
  const availableNumbers = {};

  for (const number in allNumbers) {
    if (allNumbers[number] !== 0) {
      availableNumbers[number] = allNumbers[number];
    }
  }

  return availableNumbers;
}

function makeComputerMove() {
  const legalMoves = getLegalMoves();
  const computerNumbers = getAvailableNumbers();
  const keys = Object.keys(computerNumbers);
  const randomKeyIdx = Math.floor(Math.random() * keys.length);

  const randomIdx = Math.floor(Math.random() * legalMoves.length);
  const randomKey = keys[randomKeyIdx];

  const randomMove = legalMoves[randomIdx];

  // console.log(randomKey);
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
  boardEl.classList.add(`${owner}-placed`); // Useful for styling player vs computer cells

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

const delay = (seconds) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

async function handleComputerMove() {
  computerState.innerHTML = `Thinking... <small>Analyzing the board</small>`;

  await delay(2);

  const moveMade = makeComputerMove();

  if (moveMade) {
    turnTransition();
    computerState.innerHTML = `Waiting... <small></small>`;
    return true;
  } else {
    computerState.textContent = "Great Game!";
    return;
  }
}

const computerState = document.querySelector("#computer-state");

function checkBlackhole() {
  const legalMoves = getLegalMoves();

  if (legalMoves.length === 1) {
    const lastPos = legalMoves[0];

    const blackHole = assignBlackhole(lastPos);

    // console.log(gameState.board[lastPos].specialState);
    // console.log(lastPos);

    return {
      position: lastPos,
      state: blackHole,
    };
  } else return false;
}

function assignBlackhole(position) {
  const blackHoleTarget = gameState.board[position];

  blackHoleTarget.specialState = "blackhole";
  // console.log(blackHoleTarget);
  return blackHoleTarget;
}

function updateBlackholeUi(blackhole) {
  const blackholeId = blackhole.position;
  const blackholeEl = document.getElementById(blackholeId);

  blackholeEl.classList.add("blackhole");
}

async function simulateGame() {
  while (getLegalMoves().length > 1) {
    if (gameState.currentTurn === "player") {
      const legalMoves = getLegalMoves();
      const availableNumbers = getAvailableNumbers();

      const randomPosition =
        legalMoves[Math.floor(Math.random() * legalMoves.length)];

      const keys = Object.keys(gameState.playerNumbers).filter(
        (key) => gameState.playerNumbers[key] > 0,
      );

      const randomNumber = keys[Math.floor(Math.random() * keys.length)];

      makeAnyMove("player", randomPosition, randomNumber);
      // await delay(0.2)
    } else {
      makeComputerMove();
      // await delay(0.2)
    }

    turnTransition();
  }

  handleBlackhole();
}

// simulateGame();

function getNearestElements(blackholePos) {
  const [rowPart, colPart] = blackholePos.split("-");

  const rowNum = parseInt(rowPart.replace("r", ""), 10);
  const colNum = parseInt(colPart.replace("c", ""), 10);

  const rawNeighboringPositions = calculateNeighboringPositions(rowNum, colNum);
  const gamePositions = Object.keys(gameState.board);
  const finalNeighboringPositions = [];

  for (const position of rawNeighboringPositions) {
    // if (gamePositions.includes(position)) {
    if (gameState.board[position]) {
      finalNeighboringPositions.push(position);
    }
  }

  // console.log(finalNeighboringPositions)
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
  // console.log(blackHole);
  const nearestPositions = getNearestElements(blackHole.position);
  for (const position of nearestPositions) {
    const positionEl = document.getElementById(position);
    const positionRect = positionEl.getBoundingClientRect();
    const positionCenterX = positionRect.left + positionRect.width / 2;
    const positionCenterY = positionRect.top + positionRect.height / 2;
    const pullX = blackholeCenterX - positionCenterX;
    const pullY = blackholeCenterY - positionCenterY;

    // console.log(positionCenterX, positionCenterY);
    // console.log(position, pullX, pullY);
    // console.log(positionRect)
    // 1. Inject the pull distances as CSS variables on the specific element
    positionEl.style.setProperty("--pull-x", `${pullX}px`);
    positionEl.style.setProperty("--pull-y", `${pullY}px`);

    // 2. Trigger the CSS animation by appending the class
    positionEl.classList.add("blackhole-consumed");

    const positionElState = gameState.board[position];

    if (positionElState.owner === "computer") {
      computerScore += parseInt(positionElState.value);
    } else if (positionElState.owner === "player") {
      playerScore += parseInt(positionElState.value);
    }

    // console.log(gameState.board[position]);
  }

  // console.log(computerScore);
  // console.log(playerScore);

  gameState.playerScore = playerScore;
  gameState.computerScore = computerScore;

  showEndGameModal();

  // console.log(blackholeCenterX, blackholeCenterY);
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
  await delay(1.3);
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
    localStorage.setItem("lastWinner", null);
  }

  // 3. Unhide the overlay block visually
  overlay.classList.remove("overlay-hidden");
}

const winner = localStorage.getItem("lastWinner");

gameState.gameWinner = winner;
console.log(gameState.gameWinner);

const playerScoreEl = document.getElementById("player-score");
const coomputerScoreEl = document.getElementById("computer-score");

let playerWins = parseInt(localStorage.getItem("playerWins")) || 0;
let computerWins = parseInt(localStorage.getItem("computerWins")) || 0;

if (winner === "player") {
  playerWins += 1;
  localStorage.setItem("playerWins", playerWins);
} else if (winner === "computer") {
  computerWins += 1;
  localStorage.setItem("computerWins", computerWins);
}

console.log(localStorage.getItem("computerWins"));
console.log(localStorage.getItem("playerWins"));

playerScoreEl.textContent = localStorage.getItem("playerWins");
coomputerScoreEl.textContent = localStorage.getItem("computerWins");

function initGame() {
  // const winner = localStorage.getItem("lastWinner");

  if (winner === "player" || winner === null) {
    submitBtn.addEventListener("click", async () => {
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
  } else {
    gameState.currentTurn = "computer";
    handleComputerMove();
  }
}

function getWinner() {
  let winner = null;
  if (gameState.playerScore > gameState.computerScore) {
    winner = "player";
  } else if (gameState.computerScore > gameState.playerScore) {
    winner = "computer";
  } else {
    winner = null;
  }
  return winner;
}

initGame();
// simulateGame()

function resetGame() {
  localStorage.setItem("playerWins", 0);
  localStorage.setItem("computerWins", 0);
  localStorage.setItem("lastWinner", null);
}

function getPossibleComputerMoves() {
  const legalPositions = getLegalMoves();
  const availableNumbers = getAvailableNumbers();

  const possibleMoves = [];

  for (const position of legalPositions) {
    for (const number in availableNumbers) {
      possibleMoves.push({
        position: position,
        value: Number(number),
      });
    }
  }

  return possibleMoves;
}

function evaluateMove(move) {
  return move.value;
}
const possibleMoves = getPossibleComputerMoves();

for (const move of possibleMoves) {
  // console.log(move, evaluateMove(move));
}

function chooseBestMove(moves) {
  let bestMove = moves[0];

  for (const move of moves) {
    if (evaluateMove(move) > evaluateMove(bestMove)) {
      bestMove = move;
    }
  }

  return bestMove;
}

const bestMove = chooseBestMove(possibleMoves);

console.log(bestMove);

function simulateMove(move) {
  const simulatedBoard = structuredClone(gameState.board);

  simulatedBoard[move.position].value = move.value;
  simulatedBoard[move.position].owner = "computer";

  return simulatedBoard;
}

function evaluateMove(move) {
  const simulatedBoard = simulateMove(move);

  let score = move.value;

  for (const position in simulatedBoard) {
    if (simulatedBoard[position].owner === "computer") {
      score += simulatedBoard[position].value;
    }
  }

  return score;
}