import { useState } from "react";
import { api, MemoryEntryResult } from "../api";

export function StateViewer() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MemoryEntryResult[]>([]);
    const [newMemory, setNewMemory] = useState("");
    const [status, setStatus] = useState("");

    const search = async () => {
        try {
            const res = await api.searchMemory({ query });
            setResults(res);
            setStatus(`Found ${res.length} entries`);
        } catch (e) {
            setStatus("Error searching: " + String(e));
        }
    };

    const save = async () => {
        try {
            await api.saveMemory({ text: newMemory, metadata: { created_by: "frontend" } });
            setStatus("Saved!");
            setNewMemory("");
            search();
        } catch (e) {
            setStatus("Error saving: " + String(e));
        }
    };

    const deleteMem = async (id: string) => {
        try {
            await api.deleteMemory(id);
            setStatus("Deleted " + id);
            search();
        } catch (e) {
            setStatus("Error deleting: " + String(e));
        }
    };

    return (
        <div className="p-4 bg-gray-800 text-white mt-4 border-t border-gray-700">
            <h3 className="font-bold mb-2">Memory / State</h3>
            <div className="flex gap-2 mb-2">
                <input
                    className="flex-1 bg-gray-700 p-1 rounded"
                    placeholder="Search query..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                />
                <button className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500" onClick={search}>Search</button>
            </div>

            <div className="flex gap-2 mb-4">
                 <input
                    className="flex-1 bg-gray-700 p-1 rounded"
                    placeholder="Add new memory..."
                    value={newMemory}
                    onChange={e => setNewMemory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && save()}
                />
                <button className="bg-green-600 px-3 py-1 rounded hover:bg-green-500" onClick={save}>Add</button>
            </div>

            <div className="text-xs text-gray-400 mb-2">{status}</div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.map(r => (
                    <div key={r.id} className="bg-gray-700 p-2 rounded text-sm flex justify-between items-start">
                        <div>
                            <div className="font-mono text-xs text-gray-400">{r.id} (Score: {r.score.toFixed(2)})</div>
                            <div>{r.text}</div>
                        </div>
                        <button className="text-red-400 hover:text-red-300 ml-2" onClick={() => deleteMem(r.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
