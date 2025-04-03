const dungeons = [
  {
    id: 14938,
    challenge_mode_id: 500,
    slug: "the-rookery",
    name: "The Rookery",
    short_name: "ROOK",
  },
  {
    id: 12841,
    challenge_mode_id: 382,
    slug: "theater-of-pain",
    name: "Theater of Pain",
    short_name: "TOP",
  },
  {
    id: 14882,
    challenge_mode_id: 504,
    slug: "darkflame-cleft",
    name: "Darkflame Cleft",
    short_name: "DFC",
  },
  {
    id: 8064,
    challenge_mode_id: 247,
    slug: "the-motherlode",
    name: "The MOTHERLODE!!",
    short_name: "ML",
  },
  {
    id: 800002,
    challenge_mode_id: 370,
    slug: "mechagon-workshop",
    name: "Mechagon Workshop",
    short_name: "WORK",
  },
  {
    id: 15103,
    challenge_mode_id: 506,
    slug: "cinderbrew-meadery",
    name: "Cinderbrew Meadery",
    short_name: "BREW",
  },
  {
    id: 14954,
    challenge_mode_id: 499,
    slug: "priory-of-the-sacred-flame",
    name: "Priory of the Sacred Flame",
    short_name: "PSF",
  },
  {
    id: 15452,
    challenge_mode_id: 525,
    slug: "operation-floodgate",
    name: "Operation: Floodgate",
    short_name: "FLOOD",
  },
];

const keyScores = {
  2: 165,
  3: 180,
  4: 205,
  5: 220,
  6: 235,
  7: 265,
  8: 280,
  9: 295,
  10: 320,
  11: 335,
  12: 365,
  13: 380,
  14: 395,
  15: 410,
  16: 425,
  17: 440,
  18: 455,
  19: 470,
  20: 485,
  21: 500,
  22: 515,
  23: 530,
  24: 545,
  25: 560,
  26: 575,
  27: 590,
  28: 605,
  29: 620,
  30: 635,
};

const STORAGE_KEY = "mythic_plus_team_urls";
const MODE_STORAGE_KEY = "mythic_plus_active_mode"; // Add new storage key

let api_url = "";
let data;
let currentMode = localStorage.getItem(MODE_STORAGE_KEY) || "solo"; // Get stored mode or default to solo
const dungeon_scores = {}; // For solo mode
let team_data = []; // For team mode
const team_dungeon_scores = {}; // Combined scores for team mode
const team_dungeon_counts = {}; // Count of players with scores for each dungeon
const numberOfCol = 8;
const MAX_TEAM_SIZE = 5;
const activeTab = "solo"; // Default active tab

// Initialize dungeon scores
dungeons.forEach((dungeon) => {
  dungeon_scores[dungeon.id.toString()] = 0;
  team_dungeon_scores[dungeon.id.toString()] = 0;
  team_dungeon_counts[dungeon.id.toString()] = 0;
});

document.addEventListener("DOMContentLoaded", () => {
  // Set up mode switching
  setupModeSwitching();

  // Set up form submissions
  document.getElementById("rioForm").addEventListener("submit", (e) => {
    e.preventDefault();
    getURLInput();
  });

  document.getElementById("teamForm").addEventListener("submit", (e) => {
    e.preventDefault();
    getTeamURLs();
  });

  // Set up add player button
  document
    .getElementById("addPlayerBtn")
    .addEventListener("click", addPlayerInput);

  // Set up initial remove player buttons
  setupRemovePlayerButtons();

  // Check for URL parameter
  const queryString = window.location.search;
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    const rioURL = urlParams.get("rio");

    if (rioURL) {
      // Set the input value
      document.getElementById("raiderioUrl").value = rioURL;
      getURLInput();
    }
  }

  const savedUrls = loadTeamUrlsFromStorage();
  if (savedUrls.length > 0) {
    // Switch to team mode
    document.getElementById("teamModeBtn").click();

    // Populate the inputs
    populateTeamInputs(savedUrls);

    // Process the saved team URLs
    processTeamUrls(savedUrls);
  }
});

function saveTeamUrlsToStorage(urls) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

function loadTeamUrlsFromStorage() {
  const savedUrls = localStorage.getItem(STORAGE_KEY);
  return savedUrls ? JSON.parse(savedUrls) : [];
}

function populateTeamInputs(urls) {
  // Add inputs for each saved URL
  urls.forEach((url, index) => {
    if (index === 0) {
      // Update the first default input
      document.querySelector(".team-url").value = url;
    } else {
      // Add new inputs for additional URLs
      addPlayerInput();
      const inputs = document.querySelectorAll(".team-url");
      inputs[index].value = url;
    }
  });
}

function setupModeSwitching() {
  const soloModeBtn = document.getElementById("soloModeBtn");
  const teamModeBtn = document.getElementById("teamModeBtn");
  const soloForm = document.getElementById("rioForm");
  const teamForm = document.getElementById("teamForm");

  // Set initial state based on stored mode
  if (currentMode === "team") {
    teamModeBtn.classList.add("active");
    soloModeBtn.classList.remove("active");
    teamForm.classList.add("active");
    soloForm.classList.remove("active");
  } else {
    soloModeBtn.classList.add("active");
    teamModeBtn.classList.remove("active");
    soloForm.classList.add("active");
    teamForm.classList.remove("active");
  }

  soloModeBtn.addEventListener("click", () => {
    if (currentMode === "solo") return;

    currentMode = "solo";
    localStorage.setItem(MODE_STORAGE_KEY, currentMode); // Store the mode
    soloModeBtn.classList.add("active");
    teamModeBtn.classList.remove("active");
    soloForm.classList.add("active");
    teamForm.classList.remove("active");

    // If we have solo data, display it
    if (data) {
      displaySoloProfile();
    }
  });

  teamModeBtn.addEventListener("click", () => {
    if (currentMode === "team") return;

    currentMode = "team";
    localStorage.setItem(MODE_STORAGE_KEY, currentMode); // Store the mode
    teamModeBtn.classList.add("active");
    soloModeBtn.classList.remove("active");
    teamForm.classList.add("active");
    soloForm.classList.remove("active");

    // If we have team data, display it
    if (team_data.length > 0) {
      displayTeamProfile();
    }
  });
}

function setupRemovePlayerButtons() {
  document.querySelectorAll(".remove-player").forEach((button) => {
    button.addEventListener("click", function () {
      const inputGroup = this.closest(".team-input");
      if (inputGroup) {
        inputGroup.remove();
        updatePlayerNumbers();
      }
    });
  });
}

function updatePlayerNumbers(shouldUpdateScores = true) {
  const inputs = document.querySelectorAll(".team-url");
  inputs.forEach((input, index) => {
    input.placeholder = `Enter Raider.io URL for player ${index + 1}`;
  });

  // Show/hide remove buttons based on number of inputs
  const removeButtons = document.querySelectorAll(".remove-player");
  if (removeButtons.length === 1) {
    removeButtons[0].classList.add("hidden");
  } else {
    removeButtons.forEach((button) => button.classList.remove("hidden"));
  }

  // Disable add button if max team size reached
  const addButton = document.getElementById("addPlayerBtn");
  if (inputs.length >= MAX_TEAM_SIZE) {
    addButton.disabled = true;
  } else {
    addButton.disabled = false;
  }

  // Only update team data and recalculate scores if we have team data and we should update scores
  if (team_data.length > 0 && shouldUpdateScores) {
    // Get current URLs
    const currentUrls = Array.from(inputs)
      .map((input) => input.value.trim())
      .filter((url) => url !== "");

    if (currentUrls.length > 0) {
      // Filter team_data to only include players whose URLs are still present
      const oldTeamSize = team_data.length;
      team_data = team_data.filter((player) => {
        return currentUrls.some((url) => {
          try {
            const urlArray = url.split("/");
            const urlIndex = urlArray.indexOf("characters");
            if (urlIndex === -1) return false;

            const urlRegion = urlArray[urlIndex + 1];
            const urlRealm = urlArray[urlIndex + 2];
            const urlName = urlArray[urlIndex + 3];

            return (
              player.region.toLowerCase() === urlRegion.toLowerCase() &&
              player.realm.toLowerCase() === urlRealm.toLowerCase() &&
              player.name.toLowerCase() === urlName.toLowerCase()
            );
          } catch (e) {
            return false;
          }
        });
      });

      // Only recalculate if team composition changed
      if (oldTeamSize !== team_data.length) {
        // Save the current URLs to storage
        saveTeamUrlsToStorage(currentUrls);

        // Recalculate team scores and update display if we're in team mode
        if (team_data.length > 0) {
          calculateTeamScores();
          if (currentMode === "team") {
            displayTeamProfile();
          }
        } else {
          // If no team data left, clear the display
          document.getElementById("characterInfo").classList.add("hidden");
          document.getElementById("welcomeCard").classList.remove("hidden");
        }
      }
    }
  }
}

function addPlayerInput() {
  const teamInputs = document.getElementById("teamInputs");
  const inputCount = teamInputs.querySelectorAll(".team-input").length;

  if (inputCount >= MAX_TEAM_SIZE) return;

  const newInput = document.createElement("div");
  newInput.className = "form-group team-input";
  newInput.innerHTML = `
    <div class="input-container">
      <div class="input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input type="text" class="input team-url" placeholder="Enter Raider.io URL for player ${
        inputCount + 1
      }">
    </div>
    <button type="button" class="button button-icon remove-player">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  teamInputs.appendChild(newInput);

  // Add event listener to the new remove button
  const removeButton = newInput.querySelector(".remove-player");
  removeButton.addEventListener("click", () => {
    newInput.remove();
    updatePlayerNumbers(true); // Update scores when removing a player
  });

  updatePlayerNumbers(false); // Don't update scores when just adding an input
}

function getURLInput() {
  const inputUrl = document.getElementById("raiderioUrl").value;
  if (!inputUrl) return;

  // Show loading state
  setLoading(true, "solo");

  // Update URL with query parameter
  const newUrl =
    window.location.origin +
    window.location.pathname +
    "?rio=" +
    encodeURIComponent(inputUrl);
  window.history.pushState({ path: newUrl }, "", newUrl);

  splitUrl(inputUrl);
  clearTable();
  getBestScore();
}

function getTeamURLs() {
  const teamUrls = Array.from(document.querySelectorAll(".team-url"))
    .map((input) => input.value)
    .filter((url) => url.trim() !== "");

  if (teamUrls.length === 0) {
    alert("Please enter at least one valid Raider.io URL");
    return;
  }

  // Save URLs to localStorage
  saveTeamUrlsToStorage(teamUrls);

  // Show loading state
  setLoading(true, "team");

  // Reset team data
  team_data = [];

  // Reset team dungeon scores and counts
  dungeons.forEach((dungeon) => {
    team_dungeon_scores[dungeon.id.toString()] = 0;
    team_dungeon_counts[dungeon.id.toString()] = 0;
  });

  // Process each URL
  processTeamUrls(teamUrls);
}

async function processTeamUrls(urls) {
  try {
    // Fetch data for each URL
    const promises = urls.map((url) => {
      try {
        const apiUrl = createApiUrl(url);
        return fetch(apiUrl).then((response) => response.json());
      } catch (error) {
        console.error("Error processing URL:", url, error);
        return null;
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(promises);

    // Filter out null results (failed requests)
    const validResults = results.filter((result) => result !== null);

    if (validResults.length === 0) {
      throw new Error("No valid player data could be retrieved");
    }

    // Process the results
    team_data = validResults;

    // Calculate team scores
    calculateTeamScores();

    // Show team info and build table if in team mode
    if (currentMode === "team") {
      displayTeamProfile();
    }
  } catch (error) {
    console.error("Error fetching team data:", error);
    alert(
      "Error fetching data from Raider.io. Please check your URLs and try again."
    );
  } finally {
    setLoading(false, "team");
  }
}

function createApiUrl(url) {
  const urlArray = url.split("/");
  const urlIndex = urlArray.indexOf("characters");

  if (urlIndex === -1) {
    throw new Error("Invalid Raider.io URL");
  }

  const region = urlArray[urlIndex + 1];
  const realm = urlArray[urlIndex + 2];
  const name = urlArray[urlIndex + 3];

  return (
    "https://raider.io/api/v1/characters/profile?region=" +
    region +
    "&realm=" +
    realm +
    "&name=" +
    name +
    "&fields=mythic_plus_best_runs:all,mythic_plus_scores_by_season:current"
  );
}

function calculateTeamScores() {
  // Reset team dungeon scores and counts
  dungeons.forEach((dungeon) => {
    team_dungeon_scores[dungeon.id.toString()] = 0;
    team_dungeon_counts[dungeon.id.toString()] = 0;
  });

  // Create a map to store best scores per player per dungeon
  const playerDungeonScores = new Map(); // dungeonId -> Map(playerId -> score)

  // Process each player's runs
  team_data.forEach((playerData) => {
    const playerId = `${playerData.region}-${playerData.realm}-${playerData.name}`;

    // Process best runs
    if (playerData.mythic_plus_best_runs) {
      playerData.mythic_plus_best_runs.forEach((run) => {
        const dungeonID = String(run.zone_id);
        if (!playerDungeonScores.has(dungeonID)) {
          playerDungeonScores.set(dungeonID, new Map());
        }
        playerDungeonScores.get(dungeonID).set(playerId, run.score);
      });
    }

    // Process alternate runs
    if (playerData.mythic_plus_alternate_runs) {
      playerData.mythic_plus_alternate_runs.forEach((run) => {
        const dungeonID = String(run.zone_id);
        const currentBestScore =
          playerDungeonScores.get(dungeonID)?.get(playerId) || 0;

        // Only use alternate run if it's better than the best run
        if (run.score > currentBestScore) {
          if (!playerDungeonScores.has(dungeonID)) {
            playerDungeonScores.set(dungeonID, new Map());
          }
          playerDungeonScores.get(dungeonID).set(playerId, run.score);
        }
      });
    }
  });

  // Calculate average scores for each dungeon
  dungeons.forEach((dungeon) => {
    const dungeonID = dungeon.id.toString();
    const dungeonScores = playerDungeonScores.get(dungeonID);

    if (dungeonScores && dungeonScores.size > 0) {
      const scores = Array.from(dungeonScores.values());
      team_dungeon_scores[dungeonID] = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
      team_dungeon_counts[dungeonID] = scores.length;
    }
  });

  // Calculate total team score (sum of all dungeon averages)
  const totalScore = Object.values(team_dungeon_scores).reduce(
    (sum, score) => sum + score,
    0
  );
  document.getElementById("teamScore").textContent =
    totalScore.toLocaleString();

  // Set score color class
  const scoreElement = document.getElementById("teamScore");
  scoreElement.className = "score-value " + getScoreQualityClass(totalScore);
}

function displayTeamMembers() {
  const teamMembersDisplay = document.getElementById("teamMembersDisplay");
  teamMembersDisplay.innerHTML = "";

  team_data.forEach((playerData) => {
    const memberElement = document.createElement("div");
    memberElement.className = "team-member";

    const seasonScore = playerData.mythic_plus_scores_by_season[0].scores.all;

    memberElement.innerHTML = `
      <img class="team-member-avatar" src="${playerData.thumbnail_url}" alt="${
      playerData.name
    }">
      <div class="team-member-info">
        <div class="team-member-name">${playerData.name} - ${
      playerData.realm
    }</div>
        <div class="team-member-score ${getScoreQualityClass(
          seasonScore
        )}">${seasonScore.toLocaleString()} points</div>
      </div>
    `;

    teamMembersDisplay.appendChild(memberElement);
  });
}

function setLoading(isLoading, mode = "solo") {
  if (mode === "solo") {
    const spinner = document.getElementById("loadingSpinner");
    const submitText = document.getElementById("submitText");
    const submitButton = document.getElementById("submitURL");

    if (isLoading) {
      spinner.classList.remove("hidden");
      submitText.textContent = "Loading...";
      submitButton.disabled = true;
    } else {
      spinner.classList.add("hidden");
      submitText.textContent = "Submit";
      submitButton.disabled = false;
    }
  } else {
    const spinner = document.getElementById("teamLoadingSpinner");
    const submitText = document.getElementById("teamSubmitText");
    const submitButton = document.getElementById("submitTeam");

    if (isLoading) {
      spinner.classList.remove("hidden");
      submitText.textContent = "Loading...";
      submitButton.disabled = true;
    } else {
      spinner.classList.add("hidden");
      submitText.textContent = "Calculate Team Score";
      submitButton.disabled = false;
    }
  }
}

function clearTable() {
  // Clear table headers except first two
  const headerRow = document.getElementById("tb_headers");
  while (headerRow.children.length > 2) {
    headerRow.removeChild(headerRow.lastChild);
  }

  // Clear table body
  document.getElementById("dungeonTableBody").innerHTML = "";

  // Reset dungeon scores
  for (var key in dungeon_scores) {
    dungeon_scores[key] = 0;
  }
}

function splitUrl(url) {
  var urlArray = url.split("/");
  var urlIndex = urlArray.indexOf("characters");

  if (urlIndex === -1) {
    alert("Invalid Raider.io URL");
    setLoading(false);
    return;
  }

  var region = urlArray[urlIndex + 1];
  var realm = urlArray[urlIndex + 2];
  var name = urlArray[urlIndex + 3];

  api_url =
    "https://raider.io/api/v1/characters/profile?region=" +
    region +
    "&realm=" +
    realm +
    "&name=" +
    name +
    "&fields=mythic_plus_best_runs:all,mythic_plus_scores_by_season:current";
}

async function getBestScore() {
  try {
    var response = await fetch(api_url);
    data = await response.json();

    // Update character info
    document.getElementById("characterNameDisplay").textContent =
      data.name + " - " + data.realm;
    document.getElementById("characterThumbnail").src = data.thumbnail_url;
    document.getElementById("profileLink").href = data.profile_url;

    // Process best runs
    if (data.mythic_plus_best_runs) {
      for (const dun of data.mythic_plus_best_runs) {
        var dungeonID = String(dun.zone_id);
        var dungeonScore = dun.score;
        dungeon_scores[dungeonID] = Math.max(
          dungeon_scores[dungeonID] || 0,
          dungeonScore
        );
      }
    }

    // Get alternate runs if available
    if (data.mythic_plus_alternate_runs) {
      for (const dun of data.mythic_plus_alternate_runs) {
        const dungeonID = String(dun.zone_id);
        const dungeonScore = dun.score;
        dungeon_scores[dungeonID] = Math.max(
          dungeon_scores[dungeonID] || 0,
          dungeonScore
        );
      }
    }

    // Get season score
    var seasonScore = data.mythic_plus_scores_by_season[0].scores.all;
    document.getElementById("characterScore").textContent =
      seasonScore.toLocaleString();

    // Set score color class
    const scoreElement = document.getElementById("characterScore");
    scoreElement.className = "score-value " + getScoreQualityClass(seasonScore);

    // Show character info and build table
    if (currentMode === "solo") {
      displaySoloProfile();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Error fetching data from Raider.io");
  } finally {
    setLoading(false, "solo");
  }
}

function getScoreQualityClass(score) {
  if (score >= 2800) return "quality-legendary";
  if (score >= 2400) return "quality-epic";
  if (score >= 2000) return "quality-rare";
  if (score >= 1600) return "quality-uncommon";
  if (score >= 1200) return "quality-common";
  return "quality-poor";
}

function getKeyByScore(score) {
  let keyLevel = 0;
  for (const [key, value] of Object.entries(keyScores)) {
    if (value < score) {
      keyLevel = Number.parseInt(key);
    }
  }
  return Math.max(2, keyLevel);
}

function getLowestKey(mode = "solo") {
  const scores = mode === "solo" ? dungeon_scores : team_dungeon_scores;
  var lowestScore = Number.POSITIVE_INFINITY;
  var highestScore = 0;

  for (var dungeonID in scores) {
    var dungeonScore = scores[dungeonID];
    if (dungeonScore > 0) {
      lowestScore = Math.min(lowestScore, dungeonScore);
    }
    highestScore = Math.max(highestScore, dungeonScore);
  }

  // If all scores are 0, default to key level 2
  if (lowestScore === Number.POSITIVE_INFINITY) lowestScore = 0;

  var startingKey = Math.max(
    getKeyByScore(lowestScore),
    getKeyByScore(highestScore) - numberOfCol + 2
  );
  return Math.max(startingKey, 2);
}

function getArrayPoints(startingKey, baseScore) {
  var arraySize = numberOfCol;
  var tablePoints = [];
  var currentScore = baseScore;

  for (var i = 0; i < arraySize; i++) {
    var newKeyScore = keyScores[startingKey + i] || 0;
    var newScore = Math.max(newKeyScore, currentScore);
    tablePoints.push(
      Math.round(Math.max(0, newScore - currentScore) * 10) / 10
    );
  }

  return tablePoints;
}

function getScoreBadgeClass(score) {
  if (score === 0) return "score-0";
  if (score >= 350) return "score-max";
  if (score >= 300) return "score-very-high";
  if (score >= 250) return "score-high";
  if (score >= 200) return "score-medium";
  return "score-low";
}

// Updated to use consistent thresholds with positive progression
function getPointsBadgeClass(points) {
  // Use consistent global thresholds for all rows
  if (points <= 0) return "badge-points-none";
  if (points <= 15) return "badge-points-low";
  if (points <= 30) return "badge-points-medium";
  if (points <= 45) return "badge-points-high";
  return "badge-points-very-high"; // 46+ points
}

function buildTable(mode = "solo") {
  // Get starting key level
  const startingKey = getLowestKey(mode);
  const scores = mode === "solo" ? dungeon_scores : team_dungeon_scores;

  // Add key level headers
  const headerRow = document.getElementById("tb_headers");
  // Clear existing headers (except first two)
  while (headerRow.children.length > 2) {
    headerRow.removeChild(headerRow.lastChild);
  }

  for (let i = 0; i < numberOfCol; i++) {
    const keyLevel = startingKey + i;
    const th = document.createElement("th");
    th.className = "text-center";
    th.textContent = "+" + keyLevel;
    headerRow.appendChild(th);
  }

  // Build dungeon rows
  const tableBody = document.getElementById("dungeonTableBody");
  tableBody.innerHTML = "";

  // Create a sorted copy of dungeons array based on scores (lowest to highest)
  const sortedDungeons = [...dungeons].sort((a, b) => {
    const scoreA = scores[a.id.toString()] || 0;
    const scoreB = scores[b.id.toString()] || 0;
    return scoreA - scoreB;
  });

  sortedDungeons.forEach((dungeon) => {
    const dungeonID = dungeon.id.toString();
    const dungeonScore = scores[dungeonID] || 0;
    const pointsArray = getArrayPoints(startingKey, dungeonScore);

    const row = document.createElement("tr");

    // Dungeon name cell with fixed width abbreviation for alignment
    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
          <div class="dungeon-name">
              <span class="dungeon-abbr">${dungeon.short_name}</span>
              <span class="dungeon-full-name">${dungeon.name}</span>
          </div>
      `;
    row.appendChild(nameCell);

    // Score cell
    const scoreCell = document.createElement("td");
    scoreCell.className = "text-center";

    // For team mode, add the count of players with scores
    let scoreText = dungeonScore.toString();
    if (mode === "team" && team_dungeon_counts[dungeonID] > 0) {
      scoreText = `${dungeonScore} (${team_dungeon_counts[dungeonID]})`;
    }

    scoreCell.innerHTML = `
          <span class="badge ${getScoreBadgeClass(dungeonScore)}">
              ${scoreText}
          </span>
      `;
    row.appendChild(scoreCell);

    // Points cells
    pointsArray.forEach((points) => {
      const pointsCell = document.createElement("td");
      pointsCell.className = "text-center";
      pointsCell.innerHTML = `
              <span class="badge ${getPointsBadgeClass(points)}">
                  ${points > 0 ? "+" + points : "-"}
              </span>
          `;
      row.appendChild(pointsCell);
    });

    tableBody.appendChild(row);
  });
}

function displaySoloProfile() {
  document.getElementById("characterInfo").classList.remove("hidden");
  document.getElementById("welcomeCard").classList.add("hidden");
  document.getElementById("soloProfile").classList.remove("hidden");
  document.getElementById("teamProfile").classList.add("hidden");
  buildTable("solo");
}

function displayTeamProfile() {
  document.getElementById("characterInfo").classList.remove("hidden");
  document.getElementById("welcomeCard").classList.add("hidden");
  document.getElementById("soloProfile").classList.add("hidden");
  document.getElementById("teamProfile").classList.remove("hidden");
  displayTeamMembers();
  buildTable("team");
}
