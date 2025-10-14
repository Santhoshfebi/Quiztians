import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [results, setResults] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            const currentUser = data.session?.user;
            if (!currentUser) {
                navigate("/admin-login");
                return;
            }
            const role = currentUser.user_metadata?.role;
            if (role !== "admin" && role !== "superadmin") {
                alert("Access denied: admin only");
                await supabase.auth.signOut();
                navigate("/admin-login");
                return;
            }
            setUser(currentUser);
            setLoading(false);
        };
        checkSession();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/admin-login");
    };

    const fetchResults = async () => {
        try {
            const { data, error } = await supabase
                .from("results")
                .select("*")
                .order("score", { ascending: false })
                .order("created_at", { ascending: true });
            if (error) throw error;
            setResults(data);
            setShowResultsModal(true);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch results");
        }
    };

    const handleExportCSV = () => {
        const filtered = results.filter((r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.phone.includes(search) ||
            r.chapter.toLowerCase().includes(search.toLowerCase())
        );

        const csv = [
            ["Name", "Phone", "Place", "Score", "Total", "Chapter", "Submitted At"],
            ...filtered.map((p) => [
                p.name,
                p.phone,
                p.place,
                p.score,
                p.total,
                p.chapter,
                p.created_at,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "quiz_results.csv");
        link.click();
    };

    if (loading) return <p className="text-center mt-20">Loading admin panel...</p>;

    const filteredResults = results.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        r.chapter.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-blue-700">Admin Panel</h1>
                    <div className="flex items-center gap-4">
                        <span className="font-medium">{user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* 3 Main Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div
                        onClick={() => navigate("/admin/add-questions")}
                        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
                    >
                        <h2 className="text-2xl font-bold mb-2">Add Questions</h2>
                        <p className="text-center">Create new questions and assign chapters</p>
                    </div>

                    <div
                        onClick={() => navigate("/admin/quiz-config")}
                        className="cursor-pointer bg-green-500 hover:bg-green-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
                    >
                        <h2 className="text-2xl font-bold mb-2">Quiz Configuration</h2>
                        <p className="text-center">Set quiz duration, start time, and active chapters</p>
                    </div>

                    <div
                        onClick={() => navigate("/admin/view-results")}
                        className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105"
                    >
                        <h2 className="text-2xl font-bold mb-2">View / Download Results</h2>
                        <p className="text-center">Preview participants scores and export CSV</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
