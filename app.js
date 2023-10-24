const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server is Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayer = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertMatch = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

const convertDirectorName = (each) => {
  return {
    directorId: each.director_id,
    directorName: each.director_name,
  };
};

app.get("/players/", async (request, response) => {
  const playersQuery = `
        SELECT *
        FROM player_details;`;
  const playersArray = await database.all(playersQuery);
  response.send(playersArray.map((eachPlayer) => convertPlayer(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId};`;
  const playerReq = await database.get(playerQuery);
  response.send(convertPlayer(playerReq));
});

app.put("/players/:playerId/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const { playerId } = request.params;
  const updateQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await database.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchReq = await database.get(matchQuery);
  response.send(convertMatch(matchReq));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchId = `
        SELECT match_id
        FROM player_match_score
        WHERE player_id = '${playerId}';`;
  const matchIdReq = await database.get(matchId);
  const totalMatches = `
        SELECT *
        FROM match_details
        WHERE match_id = '${matchIdReq}'`;
  const totalMatchesReq = await database.all(totalMatches);
  response.send(totalMatchesReq.map((eachMatch) => convertMatch(eachMatch)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerId = `
        SELECT player_id
        FROM player_match_score
        WHERE match_id = '${matchId}';`;
  const playerIdReq = await database.get(playerId);
  const totalPlayers = `
        SELECT *
        FROM player_details
        WHERE player_id = '${playerIdReq}'`;
  const totalPlayersReq = await database.all(totalPlayers);
  response.send(totalPlayersReq.map((eachMatch) => convertPlayer(eachMatch)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const reqPlayer = `
        SELECT *
        FROM player_details
        WHERE player_id = '${playerId}';`;
  const reqPlayerRes = await database.get(reqPlayer);
  const totalScore = `
        SELECT 
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) As totalSixes
        FROM player_match_score
        WHERE player_id = '${reqPlayerRes}'`;
  const totalPlayersReq = await database.all(totalScore);
  response.send(`{
      playerId:${reqPlayerRes.playerId},
      playerName:${reqPlayerRes.playerName},
      totalScore: ${totalPlayersReq.totalScore},
      totalFours: ${totalPlayersReq.totalFours},
      totalSixes: ${totalPlayersReq.totalSixes},
  }`);
});

module.exports = app;
