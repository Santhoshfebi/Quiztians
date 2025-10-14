import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Confetti from "react-confetti";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { name, phone, place, score, total, chapter } = state || {};
  const [topPlayers, setTopPlayers] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch leaderboard and calculate rank
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: allPlayers, error } = await supabase
          .from("results")
          .select("*")
          .order("score", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;

        const playerIndex = allPlayers.findIndex(
          (p) =>
            p.name === name &&
            p.phone === phone &&
            p.place === place &&
            p.score === score &&
            p.chapter === chapter
        );
        setRank(playerIndex >= 0 ? playerIndex + 1 : "N/A");

        setTopPlayers(allPlayers.slice(0, 5));

        // 🎉 Trigger confetti for 5 seconds when results load
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 10000);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [name, phone, place, score, chapter]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DotLottieReact
          src="https://lottie.host/3695126e-4a51-4de3-84e9-b5b77db17695/TP1TtYQU4O.lottie"
          loop
          autoplay
        />
      </div>
    );

  return (
    <>
      {/* 🎉 Confetti */}
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} style={{ pointerEvents: "none" }} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg space-y-6">
          <h1 className="text-3xl font-bold text-center">🎉 Quiz Completed!</h1>
          <p className="text-center text-gray-600">
            Thank you for participating! May you be blessed with knowledge.
          </p>

          {/* Participant Info */}
          <div className="text-center">
            <p className="text-lg font-semibold">
              {name} ({place})
            </p>
            <p className="text-lg font-semibold mt-1">
              🏆 Your Rank:{" "}
              <span className="text-blue-600">
                {rank !== "N/A" ? `#${rank}` : "Unranked"}
              </span>
            </p>
          </div>

          {/* Score */}
          <p className="text-2xl font-bold text-green-600 text-center">
            Score: {score} / {total}
          </p>

          {/* Top 5 Leaderboard */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner mt-4">
            <h4 className="text-lg font-semibold text-center mb-2 text-yellow-600">
              🏆 Top Scorers
            </h4>
            <div className="space-y-2">
              {topPlayers.map((player, idx) => {
                const badge =
                  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅";
                return (
                  <div
                    key={player.id}
                    className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{badge}</span>
                      <span className="font-medium">
                        {player.name} ({player.place})
                      </span>
                    </div>
                    <span className="font-semibold">{player.score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() =>
                window.open(
                  "https://chat.whatsapp.com/GEnGf9jl2SP7EfBRpCnqva?mode=wwt",
                  "_blank"
                )
              }
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
            >
              💬 Join WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
