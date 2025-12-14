export interface LogEntry {
  timestamp: string;
  type: "prompt" | "stream" | "tool_call" | "tool_output" | "response" | "error";
  data: any;
}

class SessionRecorder {
  private isRecording: boolean = false;
  private log: LogEntry[] = [];
  private listeners: ((recording: boolean) => void)[] = [];

  start() {
    this.isRecording = true;
    this.log = [];
    this.notify();
    console.log("Session recording started");
  }

  stop() {
    this.isRecording = false;
    this.notify();
    console.log("Session recording stopped", this.log);
  }

  get recording() {
    return this.isRecording;
  }

  get logs() {
    return this.log;
  }

  logEvent(type: LogEntry["type"], data: any) {
    if (!this.isRecording) return;
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      data
    };
    this.log.push(entry);
    // console.log("Recorded event:", entry);
  }

  subscribe(listener: (recording: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.isRecording));
  }

  clear() {
      this.log = [];
  }
}

export const recorder = new SessionRecorder();
