import { useState, useEffect } from "react";
import { recorder } from "../stores/recorder";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { emit } from "@tauri-apps/api/event";

export function RecorderControls() {
    const [isRecording, setIsRecording] = useState(recorder.recording);
    const [isPlaying, setIsPlaying] = useState(false);

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

    const loadRecording = async () => {
        try {
            const selected = await open({
                filters: [{
                    name: "JSON",
                    extensions: ["json"]
                }]
            });

            if (selected && !Array.isArray(selected)) {
                 const content = await readTextFile(selected);
                 const entries = JSON.parse(content);

                 if (Array.isArray(entries)) {
                     if (confirm("Start playback? This will clear current chat.")) {
                         setIsPlaying(true);
                         await emit("playback_start");

                         for (const entry of entries) {
                             if (["prompt", "stream", "tool_call", "tool_output"].includes(entry.type)) {
                                 await new Promise(r => setTimeout(r, 100));
                                 await emit("playback_event", entry);
                             }
                         }

                         setIsPlaying(false);
                     }
                 }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load: " + String(e));
            setIsPlaying(false);
        }
    };

    return (
        <div className="flex gap-2 items-center">
            <button
                onClick={toggleRecording}
                className={`px-3 py-1 rounded text-xs font-bold ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}
                disabled={isPlaying}
            >
                {isRecording ? "● Recording" : "● Record"}
            </button>
            <button
                onClick={saveRecording}
                className="bg-blue-600 px-3 py-1 rounded text-xs hover:bg-blue-500 disabled:opacity-50"
                disabled={isRecording || recorder.logs.length === 0 || isPlaying}
            >
                Save
            </button>
            <button
                onClick={loadRecording}
                className="bg-green-600 px-3 py-1 rounded text-xs hover:bg-green-500 disabled:opacity-50"
                disabled={isRecording || isPlaying}
            >
                {isPlaying ? "Playing..." : "Load"}
            </button>
        </div>
    );
}
