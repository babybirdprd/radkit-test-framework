import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { api, LlmConfig, ToolDefinition } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { Settings } from "./components/Settings";
import { StateViewer } from "./components/StateViewer";
import { RecorderControls } from "./components/RecorderControls";
import { recorder } from "./stores/recorder";
import "./App.css";

function App() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | undefined>(undefined);
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        const unlistenPromise = listen("tool_execution_request", async (event: any) => {
            const { requestId, name, args } = event.payload;
            addLog(`Tool Request: ${name} with args ${JSON.stringify(args)}`);
            recorder.logEvent("tool_call", { name, args, requestId });

            let result;
            let isError = false;

            try {
                if (name === "calculator") {
                     const a = Number(args.a);
                     const b = Number(args.b);
                     let val = 0;
                     if (args.op === "+") val = a + b;
                     if (args.op === "-") val = a - b;
                     if (args.op === "*") val = a * b;
                     if (args.op === "/") val = a / b;
                     result = { result: val };
                } else if (name === "read_file") {
                     result = { content: "Mock file content for " + args.path };
                } else if (name === "write_file") {
                     result = { success: true, path: args.path };
                } else if (name === "fetch_url") {
                     try {
                         const response = await fetch(args.url);
                         const text = await response.text();
                         result = { content: text.substring(0, 500) + "..." };
                     } catch(e) {
                         throw new Error("Fetch failed: " + e);
                     }
                } else {
                    throw new Error("Unknown tool: " + name);
                }
            } catch (e) {
                result = String(e);
                isError = true;
            }

            try {
                recorder.logEvent("tool_output", { requestId, result, isError });
                await api.submitToolOutput({
                    requestId,
                    result,
                    isError
                });
                addLog(`Tool Result submitted for ${name}`);
            } catch (e) {
                addLog(`Error submitting tool output: ${e}`);
            }
        });

        return () => {
            unlistenPromise.then(f => f());
        };
    }, []);

    const init = async (name: string, description: string, llm: LlmConfig, tools: ToolDefinition[]) => {
        try {
            await api.initAgent({ name, description, llm, tools });
            setIsInitialized(true);
            addLog("Agent Initialized");
        } catch (e) {
            addLog("Init Error: " + String(e));
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-900 text-white font-sans">
            <Sidebar onSelectThread={setCurrentTaskId} currentThreadId={currentTaskId} />

            <div className="flex-1 flex flex-col min-w-0">
                {!isInitialized ? (
                     <div className="flex-1 overflow-y-auto p-4">
                        <Settings onInit={init} isInitialized={isInitialized} />
                        {logs.length > 0 && (
                            <div className="mt-4 p-4 bg-black text-xs font-mono h-40 overflow-y-auto border border-gray-700 rounded">
                                {logs.map((l, i) => <div key={i}>{l}</div>)}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Chat taskId={currentTaskId} onTaskCreated={setCurrentTaskId} isInitialized={isInitialized} />
                        <StateViewer />
                    </>
                )}
            </div>

            <div className="fixed top-4 right-4 z-50">
                <RecorderControls />
            </div>

            <div className="fixed bottom-4 right-4">
                 <button onClick={() => setShowLogs(!showLogs)} className="bg-gray-700 text-xs px-2 py-1 rounded opacity-50 hover:opacity-100">
                    {showLogs ? "Hide Logs" : "Show Logs"}
                 </button>
            </div>
             {showLogs && (
                <div className="fixed bottom-12 right-4 w-96 h-64 bg-black border border-gray-700 p-2 overflow-y-auto text-xs font-mono opacity-90 rounded z-50">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            )}
        </div>
    );
}

export default App;
