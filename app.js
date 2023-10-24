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
  const getPlayerQuery = `
        SELECT *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE player_id = ${playerId};`;
  const getPlayerQueryRes = await database.all(getPlayerQuery);
  response.send(getPlayerQueryRes.map((eachMatch) => convertMatch(eachMatch)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const getMatchPlayersRes = await database.all(getMatchPlayersQuery);
  response.send(getMatchPlayersRes.map((eachMatch) => convertPlayer(eachMatch))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const respond = await database.get(getPlayerScored);
  response.send(`{
      playerId:${respond.playerId},
      playerName:${respond.playerName},
      totalScore: ${respond.totalScore},
      totalFours: ${respond.totalFours},
      totalSixes: ${respond.totalSixes},
  }`);
});


module.exports = app;
