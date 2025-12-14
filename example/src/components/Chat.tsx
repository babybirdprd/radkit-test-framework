import { useState, useRef, useEffect } from "react";
import { api } from "../api";

interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
}

interface ChatProps {
    taskId?: string;
    onTaskCreated: (taskId: string) => void;
    isInitialized: boolean;
}

export function Chat({ taskId, onTaskCreated, isInitialized }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const response: any = await api.chat(userMsg, undefined, taskId);

            let msgContent = "";
            let newTaskId = taskId;

             if (response.Task) {
                const task = response.Task;
                newTaskId = task.task_id;
                 const history = task.history;
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
            }

            if (!taskId && newTaskId) {
                onTaskCreated(newTaskId);
            }

            if (msgContent) {
                 setMessages(prev => [...prev, { role: "assistant", content: msgContent }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: "system", content: "Error: " + String(e) }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            setMessages([]);
            api.getTask(taskId).then((task: any) => {
                 if (task.history) {
                     const msgs: Message[] = task.history.map((h: any) => {
                         let content = "";
                         if (h.parts) {
                             h.parts.forEach((p: any) => {
                                 if (p.text) content += p.text;
                             });
                         }
                         return { role: h.role.toLowerCase(), content };
                     });
                     setMessages(msgs);
                 }
            }).catch(console.error);
        } else {
            setMessages([]);
        }
    }, [taskId]);

    return (
        <div className="flex-1 flex flex-col bg-gray-900 text-white h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        {isInitialized ? "Start a conversation..." : "Initialize agent first."}
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3/4 p-3 rounded-lg ${
                            m.role === 'user' ? 'bg-blue-600' :
                            m.role === 'system' ? 'bg-red-900' : 'bg-gray-700'
                        }`}>
                            <div className="text-xs opacity-50 mb-1 capitalize">{m.role}</div>
                            <div className="whitespace-pre-wrap break-words">{m.content}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder={isInitialized ? "Type a message..." : "Waiting for initialization..."}
                        disabled={!isInitialized || loading}
                    />
                    <button
                        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
                        onClick={sendMessage}
                        disabled={!isInitialized || loading || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
