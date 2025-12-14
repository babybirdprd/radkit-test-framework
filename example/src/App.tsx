import { useState, useEffect, useRef } from "react";
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
  const [showLogs, setShowLogs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

            result = { result: val };
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
            result,
            isError
          }
        });
      } catch (e) {
        addLog(`Error submitting tool output: ${e}`);
      }
    });

    const unlistenStream = listen("stream_event", (event: any) => {
        // Handle streaming events if we use stream_chat
        // For now logging it
        // addLog(`Stream Event: ${JSON.stringify(event.payload)}`);
        // If we implement streaming, we would append to last message here
    });

    return () => {
      unlistenPromise.then(f => f());
      unlistenStream.then(f => f());
    };
  }, []);

  async function initAgent() {
    if (!apiKey) {
        addLog("Please enter an API Key");
        return;
    }
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
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    try {
      addLog("Sending message...");
      const response: any = await invoke("plugin:radkit|chat", {
        message: userMsg
      });

      console.log("Response:", response);

      let msgContent = "";

      if (response.Task) {
          const task = response.Task;
          const history = task.history;
          if (history && history.length > 0) {
              // Find the last assistant message
              const assistantMsgs = history.filter((m: any) => m.role === "Assistant" || m.role === "assistant"); // Check casing
              if (assistantMsgs.length > 0) {
                  const last = assistantMsgs[assistantMsgs.length - 1];
                  if (last.parts) {
                       last.parts.forEach((p: any) => {
                           if (p.text) msgContent += p.text;
                       });
                  }
              } else {
                  // Fallback: just check last message if it's not user
                  const last = history[history.length - 1];
                  if (last.role !== "User" && last.role !== "user") {
                       if (last.parts) {
                           last.parts.forEach((p: any) => {
                               if (p.text) msgContent += p.text;
                           });
                       }
                  }
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
           msgContent = JSON.stringify(response);
      }

      if (msgContent) {
        setMessages(prev => [...prev, { role: "assistant", content: msgContent }]);
      } else {
        // Maybe tool call?
        addLog("No text content in response (possibly tool call)");
      }

    } catch (e) {
      addLog(`Error sending message: ${e}`);
      console.error(e);
    }
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Radkit Agent</h2>

        <div className="config-group">
            <label>API Key</label>
            <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
            />
        </div>

        <div className="config-group">
            <label>Model</label>
            <input
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="gpt-3.5-turbo"
            />
        </div>

        <button
            className={`init-btn ${isInitialized ? 'active' : ''}`}
            onClick={initAgent}
            disabled={isInitialized}
        >
            {isInitialized ? "Agent Active" : "Initialize Agent"}
        </button>

        <div className="logs-toggle">
            <button onClick={() => setShowLogs(!showLogs)}>
                {showLogs ? "Hide Logs" : "Show Logs"}
            </button>
        </div>

        {showLogs && (
            <div className="logs-panel">
                {logs.map((log, i) => <div key={i} className="log-entry">{log}</div>)}
            </div>
        )}
      </div>

      <div className="chat-area">
        <div className="messages-list">
            {messages.length === 0 && (
                <div className="empty-state">
                    <h3>Welcome to Radkit</h3>
                    <p>Enter your API key and initialize the agent to start chatting.</p>
                </div>
            )}
            {messages.map((m, i) => (
                <div key={i} className={`message-wrapper ${m.role}`}>
                    <div className="message-bubble">
                        <div className="message-content">{m.content}</div>
                    </div>
                    <div className="message-role">{m.role}</div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="input-box">
            <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={isInitialized ? "Type your message..." : "Initialize agent first..."}
                disabled={!isInitialized}
            />
            <button onClick={sendMessage} disabled={!isInitialized || !input.trim()}>
                Send
            </button>
        </div>
      </div>
    </div>
  );
}

export default App;
