import { useNavigate } from "react-router-dom";

export default function AlreadyAttempted({ language = "en" }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-4">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        {language === "en"
          ? "⚠️ Quiz Already Attempted"
          : "⚠️ நீங்கள் இந்த வினாவை ஏற்கனவே முயற்சித்துள்ளீர்கள்"}
      </h1>
      <p className="text-gray-700 text-center mb-6">
        {language === "en"
          ? "You have already completed this quiz. Please try another chapter if available."
          : "நீங்கள் ஏற்கனவே இந்த வினாவை முடித்துள்ளீர்கள். கிடைத்தால் மற்றொரு அதிகாரத்தை முயற்சிக்கவும்."}
      </p>
      <button
        onClick={() => navigate("/")}
        className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
      >
        {language === "en" ? "Go Back to Home" : "மீண்டும் முகப்புக்கு செல்லவும்"}
      </button>
    </div>
  );
}
