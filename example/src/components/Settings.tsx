import { useState } from "react";
import { LlmConfig, ToolDefinition } from "../api";

interface SettingsProps {
    onInit: (name: string, description: string, config: LlmConfig, tools: ToolDefinition[]) => void;
    isInitialized: boolean;
}

export function Settings({ onInit, isInitialized }: SettingsProps) {
    const [name, setName] = useState("Radkit Agent");
    const [description, setDescription] = useState("A helpful assistant");
    const [provider, setProvider] = useState<string>("OpenAI");
    const [model, setModel] = useState("gpt-3.5-turbo");
    const [apiKey, setApiKey] = useState("");
    const [temp, setTemp] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1024);

    // OpenRouter specifics
    const [siteUrl, setSiteUrl] = useState("");
    const [appName, setAppName] = useState("");

    const handleInit = () => {
        let llmConfig: any = {
            provider,
            model,
            apiKey: apiKey || undefined,
            temperature: temp,
            maxTokens: maxTokens
        };

        if (provider === "OpenRouter") {
            llmConfig.siteUrl = siteUrl;
            llmConfig.appName = appName;
        }

        // Define default tools (can be expanded)
        const tools: ToolDefinition[] = [
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
            },
            {
                name: "read_file",
                description: "Read a file from disk. Params: path",
                parameters: {
                    type: "object",
                    properties: {
                        path: { type: "string" }
                    },
                    required: ["path"]
                }
            },
             {
                name: "write_file",
                description: "Write content to a file. Params: path, content",
                parameters: {
                    type: "object",
                    properties: {
                        path: { type: "string" },
                        content: { type: "string" }
                    },
                    required: ["path", "content"]
                }
            },
            {
                name: "fetch_url",
                description: "Fetch content from a URL. Params: url",
                parameters: {
                    type: "object",
                    properties: {
                        url: { type: "string" }
                    },
                    required: ["url"]
                }
            }
        ];

        onInit(name, description, llmConfig, tools);
    };

    return (
        <div className="p-4 border-b border-gray-700 bg-gray-800 text-white">
            <h3 className="text-lg font-bold mb-2">Agent Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="block text-sm">Name</label>
                    <input className="w-full bg-gray-700 p-1 rounded" value={name} onChange={e => setName(e.target.value)} disabled={isInitialized} />
                </div>
                 <div className="form-group">
                    <label className="block text-sm">Description</label>
                    <input className="w-full bg-gray-700 p-1 rounded" value={description} onChange={e => setDescription(e.target.value)} disabled={isInitialized} />
                </div>
                <div className="form-group">
                     <label className="block text-sm">Provider</label>
                    <select className="w-full bg-gray-700 p-1 rounded" value={provider} onChange={e => setProvider(e.target.value)} disabled={isInitialized}>
                        <option value="OpenAI">OpenAI</option>
                        <option value="Anthropic">Anthropic</option>
                        <option value="Gemini">Gemini</option>
                        <option value="OpenRouter">OpenRouter</option>
                        <option value="Grok">Grok</option>
                        <option value="DeepSeek">DeepSeek</option>
                    </select>
                </div>
                 <div className="form-group">
                    <label className="block text-sm">Model</label>
                    <input className="w-full bg-gray-700 p-1 rounded" value={model} onChange={e => setModel(e.target.value)} disabled={isInitialized} />
                </div>
                 <div className="form-group">
                    <label className="block text-sm">API Key</label>
                    <input className="w-full bg-gray-700 p-1 rounded" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={isInitialized} />
                </div>
                <div className="form-group">
                    <label className="block text-sm">Temperature</label>
                    <input className="w-full bg-gray-700 p-1 rounded" type="number" step="0.1" value={temp} onChange={e => setTemp(Number(e.target.value))} disabled={isInitialized} />
                </div>
                <div className="form-group">
                    <label className="block text-sm">Max Tokens</label>
                    <input className="w-full bg-gray-700 p-1 rounded" type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} disabled={isInitialized} />
                </div>
                {provider === "OpenRouter" && (
                    <>
                        <div className="form-group">
                            <label className="block text-sm">Site URL</label>
                            <input className="w-full bg-gray-700 p-1 rounded" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} disabled={isInitialized} />
                        </div>
                         <div className="form-group">
                            <label className="block text-sm">App Name</label>
                            <input className="w-full bg-gray-700 p-1 rounded" value={appName} onChange={e => setAppName(e.target.value)} disabled={isInitialized} />
                        </div>
                    </>
                )}
            </div>

            <button className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50" onClick={handleInit} disabled={isInitialized}>
                {isInitialized ? "Agent Active" : "Initialize Agent"}
            </button>
        </div>
    );
}
