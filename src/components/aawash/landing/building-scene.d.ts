export type BuildingProject = "avenue" | "savitri" | "shree";
export type BuildingArea = "two" | "three" | "parking" | "roof";

export function mountBuilding(
  host: HTMLElement,
  project: BuildingProject,
  selected: BuildingArea,
  onSelect: (area: BuildingArea) => void,
): {
  select(area: BuildingArea): void;
  rotate(delta: number): void;
  reset(): void;
  setInteractive(value: boolean): void;
  pick(clientX: number, clientY: number): void;
  dispose(): void;
};
