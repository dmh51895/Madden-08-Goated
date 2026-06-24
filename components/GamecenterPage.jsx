"use client";
import React, { useState } from "react";

export default function GamecenterPage({ gameResults = [], teams, standings, navigateToTeam }) {
  const [selectedWeek, setSelectedWeek] = useState(1);

  const weekGames = (gameResults || []).filter((g) => g.week === selectedWeek);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: "bold", color: "#ff8800" }}>🎮 GAMECENTER</span>
        <div style={{ flex: 1 }} />
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          style={{ fontSize: 9, padding: "3px 6px", borderRadius: 6, border: "1px solid #333", background: "#111", color: "#ff8800", fontFamily: "inherit", outline: "none" }}
        >
          {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 12 }}>
        {weekGames.map((game) => {
          const homeWon = game.winner === game.home;
          return (
            <div
              key={game.id}
              style={{
                background: "#0c0c0c",
                borderRadius: 8,
                padding: 12,
                border: "1px solid #1a1a1a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 8, color: "#666" }}>FINAL</span>
                <span style={{ fontSize: 7, color: "#444" }}>Week {game.week}</span>
              </div>

              {/* Scoreboard */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{ fontSize: 11, fontWeight: "bold", color: homeWon ? "#00ff88" : "#aaa", cursor: "pointer" }}
                    onClick={() => navigateToTeam(game.home)}
                  >
                    {game.home}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: homeWon ? "#00ff88" : "#666" }}>
                    {game.homeScore}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#444" }}>@</div>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{ fontSize: 11, fontWeight: "bold", color: !homeWon ? "#00ff88" : "#aaa", cursor: "pointer" }}
                    onClick={() => navigateToTeam(game.away)}
                  >
                    {game.away}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: !homeWon ? "#00ff88" : "#666" }}>
                    {game.awayScore}
                  </div>
                </div>
              </div>

              {/* Game Stats */}
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#666" }}>Total Yards</div>
                    <div style={{ color: "#aaa" }}>
                      {game.gameStats.totalYards.home} - {game.gameStats.totalYards.away}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#666" }}>Turnovers</div>
                    <div style={{ color: "#aaa" }}>
                      {game.gameStats.turnovers.home} - {game.gameStats.turnovers.away}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#666" }}>Time of Poss</div>
                    <div style={{ color: "#aaa" }}>
                      {game.gameStats.timeOfPossession.home} - {game.gameStats.timeOfPossession.away}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {weekGames.length === 0 && (
        <div style={{ textAlign: "center", color: "#666", padding: 40 }}>
          No games played this week yet
        </div>
      )}
    </div>
  );
}
