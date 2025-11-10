import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

export default function AlreadyAttempted() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const participant = state || {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 text-center">
      {/* Card container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full"
      >
        <div className="flex justify-center mb-4">
          <Lock className="w-16 h-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-blue-700 mb-2">
          Quiz Already Attempted!
        </h1>

        <p className="text-gray-700 mb-4">
          Hi <span className="font-semibold text-indigo-700">{participant.name || "Participant"}</span>, 
          it looks like you’ve already completed the quiz for{" "}
          <span className="font-semibold text-indigo-700">
            {participant.chapter || "this chapter"}
          </span>.
        </p>

        <p className="text-gray-500 mb-6">
          You can only attempt a quiz once per chapter to keep it fair for all participants.
        </p>

        <div className="flex flex-col items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all"
          >
            🏠 Go Back Home
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center text-green-600 text-sm mt-2"
          >
            <CheckCircle2 className="mr-2" size={18} />
            <span>Your previous attempt is safely recorded.</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

