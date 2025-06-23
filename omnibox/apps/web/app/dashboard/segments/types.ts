export interface Rule {
  id: string;
  field: string;
  op:
    | "equals"
    | "contains"
    | "exists"
    | "not_equals"
    | "not_contains"
    | "not_exists";
  value?: string;
}

export interface Segment {
  id: string;
  name: string;
  rules: Rule[];
  match: "AND" | "OR";
  createdAt: string;
}

export interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tag: string | null;
}
