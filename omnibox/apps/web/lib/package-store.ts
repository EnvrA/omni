import { promises as fs } from "fs";
import path from "path";
import { Package } from "./admin-data";

// Resolve the packages file relative to the Next.js app root so it works
// in development and in production.
const filePath = path.join(process.cwd(), "data", "packages.json");

export async function readPackages(): Promise<Package[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Package[];
  } catch {
    return [];
  }
}

export async function writePackages(packages: Package[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(packages, null, 2));
}
