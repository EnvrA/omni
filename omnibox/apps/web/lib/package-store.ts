import { promises as fs } from "fs";
import path from "path";
import { Package } from "./admin-data";

const filePath = path.join(process.cwd(), "apps/web/data/packages.json");

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
