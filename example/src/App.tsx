import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function App() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    const unlistenPromise = listen("tool_execution_request", async (event: any) => {
      const { requestId, name, args } = event.payload;
      addLog(`Tool Request: ${name} with args ${JSON.stringify(args)}`);

      let result;
      let isError = false;

      if (name === "calculator") {
        try {
            console.log("Executing calculator with", args);
            let val = 0;
            const a = Number(args.a);
            const b = Number(args.b);
            if (args.op === "+") val = a + b;
            if (args.op === "-") val = a - b;
            if (args.op === "*") val = a * b;
            if (args.op === "/") val = a / b;

            result = { result: val }; // Return object as JSON
            addLog(`Tool Result: ${val}`);
        } catch (e) {
            result = String(e);
            isError = true;
            addLog(`Tool Error: ${e}`);
        }
      } else {
         result = "Unknown tool";
         isError = true;
      }

      try {
        await invoke("plugin:radkit|submit_tool_output", {
          payload: {
            requestId,
            result, // Value type, so object is fine
            isError
          }
        });
      } catch (e) {
        addLog(`Error submitting tool output: ${e}`);
      }
    });

    return () => {
      unlistenPromise.then(f => f());
    };
  }, []);

  async function initAgent() {
    try {
      addLog("Initializing agent...");
      await invoke("plugin:radkit|init_agent", {
        config: {
          name: "My Agent",
          description: "A helpful assistant",
          llm: {
            provider: "OpenAI",
            model: model,
            apiKey: apiKey || undefined
          },
          tools: [
            {
              name: "calculator",
              description: "Perform basic arithmetic operations",
              parameters: {
                type: "object",
                properties: {
                  a: { type: "number" },
                  b: { type: "number" },
                  op: { type: "string", enum: ["+", "-", "*", "/"] }
                },
                required: ["a", "b", "op"]
              }
            }
          ]
        }
      });
      setIsInitialized(true);
      addLog("Agent Initialized successfully");
    } catch (e) {
      addLog(`Error initializing: ${e}`);
      console.error(e);
    }
  }

  async function sendMessage() {
    if (!input) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    try {
      addLog("Sending message...");
      const response: any = await invoke("plugin:radkit|chat", {
        message: userMsg
      });

      console.log("Response:", response);
      addLog("Response received");

      // Parse response. It might be { "Task": { ... } } or { "Message": { ... } } or just properties if flattened?
      // Rust enums with serde defaults: { "Variant": content }

      let msgContent = "";

      if (response.Task) {
          const task = response.Task;
          const history = task.history;
          // Get last message which should be assistant (unless tool call happened and it's waiting?)
          // If task state is Completed, last message is likely assistant response.
          // Or we iterate history.

          // Simple heuristic: find last assistant message that is later than our user message?
          // Or just take the last message in history.
          if (history && history.length > 0) {
              const last = history[history.length - 1];
              if (last.parts) {
                   last.parts.forEach((p: any) => {
                       if (p.text) msgContent += p.text;
                   });
              }
          }
      } else if (response.Message) {
          const msg = response.Message;
           if (msg.parts) {
               msg.parts.forEach((p: any) => {
                   if (p.text) msgContent += p.text;
               });
           }
      } else {
          // Fallback if structure is different
           msgContent = JSON.stringify(response);
      }

      if (msgContent) {
        setMessages(prev => [...prev, { role: "assistant", content: msgContent }]);
      }

    } catch (e) {
      addLog(`Error sending message: ${e}`);
      console.error(e);
    }
  }

  return (
    <div className="container">
      <h1>Radkit Tauri Plugin</h1>

      <div className="section">
        <h2>Configuration</h2>
        <div className="row">
            <input
                placeholder="OpenAI API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                type="password"
            />
            <input
                placeholder="Model (e.g. gpt-4o)"
                value={model}
                onChange={e => setModel(e.target.value)}
            />
            <button onClick={initAgent} disabled={isInitialized}>
                {isInitialized ? "Initialized" : "Init Agent"}
            </button>
        </div>
      </div>

      <div className="section chat-section">
        <h2>Chat</h2>
        <div className="chat-window">
            {messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                    <strong>{m.role}:</strong> {m.content}
                </div>
            ))}
        </div>
        <div className="input-area">
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage} disabled={!isInitialized}>Send</button>
        </div>
      </div>

      <div className="section logs-section">
        <h2>Logs</h2>
        <pre className="logs">{logs.join("\n")}</pre>
      </div>
    </div>
  );
}

export default App;
