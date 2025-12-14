import { useState, useEffect } from "react";
import { api } from "../api";

interface SidebarProps {
    onSelectThread: (threadId: string | undefined) => void;
    currentThreadId?: string;
}

export function Sidebar({ onSelectThread, currentThreadId }: SidebarProps) {
    const [tasks, setTasks] = useState<any[]>([]);

    const refreshTasks = async () => {
        try {
            const list = await api.listTasks();
            setTasks(list);
        } catch (e) {
            console.error("Failed to list tasks", e);
        }
    };

    useEffect(() => {
        refreshTasks();
        const interval = setInterval(refreshTasks, 5000); // Poll for updates
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col border-r border-gray-700 h-full">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Radkit</h2>
                <button
                    className="mt-2 w-full bg-green-600 px-2 py-1 rounded text-sm hover:bg-green-500"
                    onClick={() => onSelectThread(undefined)}
                >
                    New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tasks.length === 0 && <div className="p-4 text-gray-500 text-sm">No active tasks</div>}
                {tasks.map(task => (
                    <div
                        key={task.task_id}
                        className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${currentThreadId === task.task_id ? "bg-gray-800" : ""}`}
                        onClick={() => onSelectThread(task.task_id)}
                    >
                        <div className="text-sm font-medium truncate">{task.task_id}</div>
                        <div className="text-xs text-gray-400">{task.status}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
