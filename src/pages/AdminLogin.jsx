import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // ✅ Check role
      const role = data.user.user_metadata?.role;
      if (role !== "superadmin") {
        alert("Access denied: not an admin");
        await supabase.auth.signOut();
        return;
      }

      navigate("/admin");
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Admin Login
        </h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleAdminLogin}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
        >
          Back
        </button>
      </div>
    </div>
  );
}
