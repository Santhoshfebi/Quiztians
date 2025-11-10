import { useLocation, useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function AlreadyAttempted() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const name = state?.name || "Participant";
  const chapter = state?.chapter || "Unknown Chapter";
  const language = state?.language || "en";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* 🎉 Animation */}
      <div className="w-48 h-48 mb-4">
        <DotLottieReact
          src="https://lottie.host/8a11e132-45a1-41ce-8f37-36d4fa986e1a/ffHoXhho0s.lottie"
          loop
          autoplay
        />
      </div>

      {/* 🧾 Card */}
      <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md w-full border border-blue-100">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          {language === "en"
            ? "🎉 Quiz Already Completed"
            : "🎉 வினாத்தாள் ஏற்கனவே முடிக்கப்பட்டது"}
        </h1>

        <p className="text-gray-700 mb-6 leading-relaxed">
          {language === "en" ? (
            <>
              Hi <span className="font-semibold text-indigo-600">{name}</span>, you’ve already
              completed the quiz for{" "}
              <span className="font-semibold text-indigo-600">{chapter}</span>.
            </>
          ) : (
            <>
              <span className="font-semibold text-indigo-600">{name}</span>, நீங்கள்{" "}
              <span className="font-semibold text-indigo-600">{chapter}</span> அதிகாரத்தின் வினாவை
              ஏற்கனவே முடித்துவிட்டீர்கள்.
            </>
          )}
        </p>

        <p className="text-gray-600 mb-8">
          {language === "en"
            ? "You can view your result or return to the home page."
            : "நீங்கள் உங்கள் முடிவை பார்க்கலாம் அல்லது முகப்புப் பக்கத்திற்குச் செல்லலாம்."}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/result", { state })}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            {language === "en" ? "View My Result" : "எனது முடிவைப் பார்க்கவும்"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-all"
          >
            {language === "en" ? "Go Home" : "முகப்புக்குச் செல்லவும்"}
          </button>
        </div>
      </div>
    </div>
  );
}
