import { useState, useEffect } from "react";
import "../Game.css";

const EMOJI_CATEGORIES = {
  animals: ["🐶", "🐱", "🐵", "🐰"],
  food: ["🍕", "🍟", "🍔", "🍩"],
  sports: ["⚽", "🏀", "🏈", "🎾"],
  nature: ["🌹", "🌻", "🌴", "🌵"],
  faces: ["😀", "😎", "🤩", "😍"],
};

function Game() {
  const [gameState, setGameState] = useState("setup");
  const [board, setBoard] = useState(Array(9).fill(null));
  const [player1, setPlayer1] = useState({
    category: null,
    emojis: [],
    score: 0,
    emojiHistory: [], // Track order of emoji placements
  });
  const [player2, setPlayer2] = useState({
    category: null,
    emojis: [],
    score: 0,
    emojiHistory: [], // Track order of emoji placements
  });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [winningCells, setWinningCells] = useState([]);
  const [vanishingEmoji, setVanishingEmoji] = useState(null);
  const [recentEmoji, setRecentEmoji] = useState(null);

  // Start the game
  const startGame = (p1Category, p2Category) => {
    setPlayer1({
      ...player1,
      category: p1Category,
      emojis: [],
      emojiHistory: [],
    });
    setPlayer2({
      ...player2,
      category: p2Category,
      emojis: [],
      emojiHistory: [],
    });
    setGameState("playing");
    setCurrentPlayer(1);
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningCells([]);
  };

  // Handle cell click with perfect vanishing logic
  const handleCellClick = (index) => {
    if (gameState !== "playing" || board[index] !== null) return;

    const currentPlayerData = currentPlayer === 1 ? player1 : player2;
    const category = currentPlayerData.category;
    const emojiList = EMOJI_CATEGORIES[category];
    const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];

    let newEmojis = [...currentPlayerData.emojis];
    let newEmojiHistory = [...currentPlayerData.emojiHistory];
    let newBoard = [...board];

    // Check if player already has 3 emojis on the board
    if (newEmojis.length === 3) {
      // Get the oldest emoji (first in history)
      const oldestEmoji = newEmojiHistory[0];

      // Find its position on the board
      const oldestEmojiIndex = board.findIndex(
        (cell) =>
          cell &&
          cell.emoji === oldestEmoji.emoji &&
          cell.player === currentPlayer
      );

      // Only proceed if we found the oldest emoji and it's not in the same position we're trying to place
      if (oldestEmojiIndex !== -1 && oldestEmojiIndex !== index) {
        // Set vanishing emoji for animation
        setVanishingEmoji({
          index: oldestEmojiIndex,
          emoji: board[oldestEmojiIndex].emoji,
        });

        // Wait for animation to complete before updating state
        setTimeout(() => {
          // Update board - remove oldest emoji
          newBoard[oldestEmojiIndex] = null;
          setBoard(newBoard);

          // Remove from player's emoji list and history
          newEmojis = newEmojis.filter(
            (e) =>
              e.emoji !== oldestEmoji.emoji || e.position !== oldestEmojiIndex
          );
          newEmojiHistory = newEmojiHistory.slice(1);

          // Now add the new emoji
          updateGameState(
            newEmojis,
            newEmojiHistory,
            randomEmoji,
            index,
            newBoard
          );
        }, 300);
        return;
      } else if (oldestEmojiIndex === index) {
        // Can't place new emoji where oldest one was, show feedback
        setRecentEmoji({ index, emoji: "❌", player: currentPlayer });
        setTimeout(() => setRecentEmoji(null), 500);
        return;
      }
    }

    // If we're not at 3 emojis yet, just add the new one
    updateGameState(newEmojis, newEmojiHistory, randomEmoji, index, newBoard);
  };

  // Update game state after move
  const updateGameState = (
    newEmojis,
    newEmojiHistory,
    randomEmoji,
    index,
    newBoard
  ) => {
    const currentPlayerData = currentPlayer === 1 ? player1 : player2;

    // Add to emoji history (for FIFO tracking)
    const updatedEmojiHistory = [
      ...newEmojiHistory,
      { emoji: randomEmoji, position: index },
    ];
    const trimmedEmojiHistory = updatedEmojiHistory.slice(-3); // Keep only last 3

    const updatedPlayer = {
      ...currentPlayerData,
      emojis: [...newEmojis, { emoji: randomEmoji, position: index }].slice(-3), // Also keep only last 3
      emojiHistory: trimmedEmojiHistory,
    };

    if (currentPlayer === 1) {
      setPlayer1(updatedPlayer);
    } else {
      setPlayer2(updatedPlayer);
    }

    // Update board with new emoji
    newBoard[index] = { emoji: randomEmoji, player: currentPlayer };
    setBoard(newBoard);
    setRecentEmoji({ index, emoji: randomEmoji, player: currentPlayer });

    // Check for winner
    const winnerPattern = checkWinner(newBoard, currentPlayer);
    if (winnerPattern) {
      setWinningCells(winnerPattern);
      setTimeout(() => {
        setWinner(currentPlayer);
        // Update score with animation
        if (currentPlayer === 1) {
          setPlayer1({ ...updatedPlayer, score: updatedPlayer.score + 1 });
        } else {
          setPlayer2({ ...updatedPlayer, score: updatedPlayer.score + 1 });
        }
        setGameState("gameover");
      }, 500);
      return;
    }

    // Switch player with delay for smooth transition
    setTimeout(() => {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setRecentEmoji(null);
    }, 300);
  };

  // Check for winning condition
  const checkWinner = (board, player) => {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const pattern of winPatterns) {
      if (
        pattern.every((index) => {
          return board[index] !== null && board[index].player === player;
        })
      ) {
        return pattern;
      }
    }
    return null;
  };

  // Reset the game
  const playAgain = () => {
    setBoard(Array(9).fill(null));
    setPlayer1({ ...player1, emojis: [], emojiHistory: [] });
    setPlayer2({ ...player2, emojis: [], emojiHistory: [] });
    setCurrentPlayer(1);
    setWinner(null);
    setWinningCells([]);
    setGameState("playing");
  };

  // Return to setup screen
  const returnToSetup = () => {
    setGameState("setup");
  };

  return (
    <div className="app">
      <div className="game-wrapper">
        <h1 className="game-title">✨ Blink Tac Toe ✨</h1>

        <button
          className="help-button"
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Help"
        >
          {showHelp ? "✕ Close" : "❓ Help"}
        </button>

        {showHelp && (
          <div className="help-section slide-in">
            <h3>How to Play</h3>
            <ul>
              <li>Select different emoji categories</li>
              <li>Take turns placing random emojis</li>
              <li>Max 3 emojis per player on board</li>
              <li>4th emoji makes your 1st emoji vanish!</li>
              <li>Get 3 in a row to win!</li>
              <li>No draws - game continues until win</li>
            </ul>
          </div>
        )}

        {gameState === "setup" && (
          <div className="setup-screen fade-in">
            <h2>Select Emoji Categories</h2>
            <div className="player-selection">
              <div
                className={`player-setup ${player1.category ? "selected" : ""}`}
              >
                <h3>Player 1</h3>
                <div className="category-buttons">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={`p1-${category}`}
                      onClick={() => setPlayer1({ ...player1, category })}
                      className={`category-btn ${
                        player1.category === category ? "selected pulse" : ""
                      } ${player2.category === category ? "disabled" : ""}`}
                      disabled={player2.category === category}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {player1.category && (
                  <div className="emoji-preview bounce">
                    {EMOJI_CATEGORIES[player1.category].join(" ")}
                  </div>
                )}
              </div>

              <div
                className={`player-setup ${player2.category ? "selected" : ""}`}
              >
                <h3>Player 2</h3>
                <div className="category-buttons">
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={`p2-${category}`}
                      onClick={() => setPlayer2({ ...player2, category })}
                      className={`category-btn ${
                        player2.category === category ? "selected pulse" : ""
                      } ${player1.category === category ? "disabled" : ""}`}
                      disabled={player1.category === category}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {player2.category && (
                  <div className="emoji-preview bounce">
                    {EMOJI_CATEGORIES[player2.category].join(" ")}
                  </div>
                )}
              </div>
            </div>

            <button
              className="start-button glow"
              onClick={() => startGame(player1.category, player2.category)}
              disabled={!player1.category || !player2.category}
            >
              🎮 Start Game
            </button>
          </div>
        )}

        {(gameState === "playing" || gameState === "gameover") && (
          <div className="game-container scale-in">
            <div className="score-board">
              <div
                className={`player-score ${
                  currentPlayer === 1 && gameState === "playing"
                    ? "active pulse"
                    : ""
                }`}
              >
                <h3>Player 1</h3>
                <p className="score">⭐ {player1.score}</p>
                <p className="category">{player1.category}</p>
                <div className="emoji-count">
                  {player1.emojis.length}/3 emojis
                </div>
              </div>

              <div className="game-status">
                {gameState === "gameover" ? (
                  <h2 className="win-message zoom-in">
                    Player {winner} Wins! 🎉
                    <div className="confetti"></div>
                  </h2>
                ) : (
                  <h2 className="turn-message">
                    Player {currentPlayer}'s Turn
                    <div
                      className={`arrow ${
                        currentPlayer === 1 ? "left" : "right"
                      }`}
                    ></div>
                  </h2>
                )}
              </div>

              <div
                className={`player-score ${
                  currentPlayer === 2 && gameState === "playing"
                    ? "active pulse"
                    : ""
                }`}
              >
                <h3>Player 2</h3>
                <p className="score">⭐ {player2.score}</p>
                <p className="category">{player2.category}</p>
                <div className="emoji-count">
                  {player2.emojis.length}/3 emojis
                </div>
              </div>
            </div>

            <div className="board">
              {board.map((cell, index) => (
                <div
                  key={index}
                  className={`cell ${cell ? `player-${cell.player}` : ""} ${
                    gameState === "gameover" ? "game-over" : ""
                  } ${winningCells.includes(index) ? "winning-cell" : ""}`}
                  onClick={() => handleCellClick(index)}
                >
                  {cell ? (
                    <span
                      className={`emoji ${
                        vanishingEmoji?.index === index ? "vanishing" : "pop-in"
                      }`}
                    >
                      {cell.emoji}
                    </span>
                  ) : null}
                  {recentEmoji?.index === index && (
                    <span className="recent-emoji pop-in">
                      {recentEmoji.emoji}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {gameState === "gameover" && (
              <div className="game-over-actions fade-in">
                <button className="play-again-btn glow" onClick={playAgain}>
                  🔄 Play Again
                </button>
                <button
                  className="change-categories-btn"
                  onClick={returnToSetup}
                >
                  🎨 Change Categories
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
