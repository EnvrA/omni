export const FLAGS: { id: string; name: string; enabled: boolean }[] = [
  { id: "beta", name: "Beta Features", enabled: false },
  { id: "new-ui", name: "New UI", enabled: false },
];

export const TEMPLATES: { id: string; text: string }[] = [];

export type LogEntry = {
  id: string;
  timestamp: string;
  tenant: string;
  level: string;
  message: string;
  resolved: boolean;
};

export const LOGS: LogEntry[] = [];
