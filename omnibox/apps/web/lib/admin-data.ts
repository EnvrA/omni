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

export type Package = {
  id: string;
  name: string;
  contactsLimit: number;
  dealsLimit: number;
  messagingLimit: number;
  invoicingLimit: number;
  revenueReportingLimit: number;
  segmentingLimit: number;
};

export const PACKAGES: Package[] = [
  {
    id: "starter",
    name: "Starter",
    contactsLimit: 100,
    dealsLimit: 5,
    messagingLimit: 100,
    invoicingLimit: 10,
    revenueReportingLimit: 0,
    segmentingLimit: 0,
  },
  {
    id: "pro",
    name: "Pro",
    contactsLimit: 1000,
    dealsLimit: 20,
    messagingLimit: 1000,
    invoicingLimit: 50,
    revenueReportingLimit: 50,
    segmentingLimit: 10,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    contactsLimit: 10000,
    dealsLimit: 200,
    messagingLimit: 10000,
    invoicingLimit: 500,
    revenueReportingLimit: 100,
    segmentingLimit: 50,
  },
];
