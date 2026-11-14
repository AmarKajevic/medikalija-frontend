// Fizikalna terapija se više ne označava "(vanredna)" u nazivu (vanredna je označena poljem `extra`).
// Stavke i unosi sačuvani ranije još imaju tu oznaku u nazivu — ovde se uklanja pri prikazu i štampi.
export const withoutExtraTag = (name: string) => name.replace(/\s*\(vanredna\)\s*$/i, "");
