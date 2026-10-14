const AVATAR_COLORS = [
  { bg: "#E6F5F4", fg: "#0B6362" },
  { bg: "#EEF2FF", fg: "#4338CA" },
  { bg: "#FEF3C7", fg: "#92400E" },
  { bg: "#FCE7F3", fg: "#9D174D" },
  { bg: "#DCFCE7", fg: "#166534" },
  { bg: "#E0F2FE", fg: "#075985" },
];

export function avatarColor(name) {
  const code = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}