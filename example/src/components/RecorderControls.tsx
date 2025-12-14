import { useState, useEffect } from "react";
import { recorder } from "../stores/recorder";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function RecorderControls() {
    const [isRecording, setIsRecording] = useState(recorder.recording);

    useEffect(() => {
        const unsub = recorder.subscribe((recording) => {
            setIsRecording(recording);
        });
        return unsub;
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recorder.stop();
        } else {
            recorder.start();
        }
    };

    const saveRecording = async () => {
        try {
            const logs = recorder.logs;
            if (logs.length === 0) {
                alert("No logs to save.");
                return;
            }

            const path = await save({
                filters: [{
                    name: "JSON",
                    extensions: ["json"]
                }],
                defaultPath: "session_log.json"
            });

            if (path) {
                await writeTextFile(path, JSON.stringify(logs, null, 2));
                alert("Saved to " + path);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save: " + String(e));
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={toggleRecording}
                className={`px-3 py-1 rounded text-xs font-bold ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
                {isRecording ? "● Recording" : "● Record"}
            </button>
            <button
                onClick={saveRecording}
                className="bg-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-500 disabled:opacity-50"
                disabled={isRecording || recorder.logs.length === 0}
            >
                Save Log
            </button>
        </div>
    );
}
