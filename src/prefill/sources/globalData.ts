import type { DataSource } from "../source";

/**
 * Brief, source 3: global data. The brief allows any global data; these two
 * groups mirror the reference picker and the objects the real API's
 * expressions use (`action.*`, `clientOrg.*`). Swapping the constant for a
 * fetch would not change the contract.
 */
const GLOBAL_GROUPS: readonly {
  group: string;
  label: string;
  /** Prefix in the row label, e.g. "Action.id". */
  short: string;
  keys: readonly string[];
}[] = [
  {
    group: "action",
    label: "Action Properties",
    short: "Action",
    keys: ["id", "name", "status", "created_at", "initiator_email"],
  },
  {
    group: "clientOrg",
    label: "Client Organisation Properties",
    short: "Client Organisation",
    keys: ["id", "name", "tier", "country"],
  },
];

export const globalDataSource: DataSource = {
  id: "global_data",
  label: "Global data",

  getGroups: () =>
    GLOBAL_GROUPS.map(({ group, label, keys }) => ({
      id: group,
      label,
      elements: keys.map((key) => ({
        reference: { kind: "global", group, key },
        label: key,
      })),
    })),

  describe(reference) {
    if (reference.kind !== "global") return undefined;
    const group = GLOBAL_GROUPS.find((candidate) => candidate.group === reference.group);
    if (!group?.keys.includes(reference.key)) return undefined;
    return `${group.short}.${reference.key}`;
  },
};
