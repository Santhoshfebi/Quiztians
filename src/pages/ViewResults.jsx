import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ViewResults() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const { data, error } = await supabase
                    .from("results")
                    .select("*")
                    .order("score", { ascending: false })
                    .order("created_at", { ascending: true });
                if (error) throw error;
                setResults(data);
            } catch (err) {
                console.error(err);
                alert("Failed to fetch results");
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const handleExportCSV = () => {
        const filtered = results.filter((r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.place.toLowerCase().includes(search.toLowerCase()) ||
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

    const filteredResults = results.filter((r) => {
        if (!r) return false; // skip null/undefined
        const name = r.name?.toLowerCase() || "";
        const phone = r.phone || "";
        const place = r.place?.toLowerCase() || "";
        const chapter = r.chapter?.toLowerCase() || "";
        const term = search.toLowerCase();

        return name.includes(term) || place.includes(term) || phone.includes(term) || chapter.includes(term);
    });


    if (loading)
        return <p className="text-center mt-20">Loading results...</p>;

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-blue-700">Quiz Results</h1>
                    <button
                        onClick={() => navigate("/admin")}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                    >
                        Back to Admin Panel
                    </button>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Search by name, phone, place or chapter"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-3 py-2 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                        Download CSV
                    </button>
                </div>

                <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-100">
                            <tr>
                                <th className="p-2 border">#</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Phone</th>
                                <th className="p-2 border">Place</th>
                                <th className="p-2 border">Score</th>
                                <th className="p-2 border">Total</th>
                                <th className="p-2 border">Chapter</th>
                                <th className="p-2 border">Submitted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.map((r, idx) => (
                                <tr key={r.id} className="odd:bg-gray-50 even:bg-gray-100">
                                    <td className="p-2 border">{idx + 1}</td>
                                    <td className="p-2 border">{r.name}</td>
                                    <td className="p-2 border">{r.phone}</td>
                                    <td className="p-2 border">{r.place}</td>
                                    <td className="p-2 border">{r.score}</td>
                                    <td className="p-2 border">{r.total}</td>
                                    <td className="p-2 border">{r.chapter}</td>
                                    <td className="p-2 border">
                                        {new Date(r.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredResults.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-gray-500">
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
