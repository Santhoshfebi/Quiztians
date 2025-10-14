import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function CreateAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ Only allow superadmin
  useEffect(() => {
    const checkSuperadmin = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;

      if (!currentUser || currentUser.user_metadata?.role !== "superadmin") {
        alert("Access denied: superadmin only");
        navigate("/admin-login");
        return;
      }

      setUser(currentUser);
    };

    checkSuperadmin();
  }, []);

  const handleCreateAdmin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // ✅ Create new admin user with role "admin"
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });

      if (error) throw error;

      alert(`Admin account created: ${email}`);
      setEmail("");
      setPassword("");
    } catch (err) {
      alert(err.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="text-center mt-20">Checking superadmin...</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Create Admin Account
        </h1>
        <input
          type="email"
          placeholder="Admin Email"
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
          onClick={handleCreateAdmin}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white transition-all ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Creating..." : "Create Admin"}
        </button>
        <button
          onClick={() => navigate("/admin")}
          className="w-full py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
        >
          Back to Admin Panel
        </button>
      </div>
    </div>
  );
}
