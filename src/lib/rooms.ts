/** Same room names and display order as the website (src/content/projects.ts → ROOM_ORDER). */
export const ROOMS = [
  "Entrance & Foyer",
  "Living Room",
  "Dining & Crockery",
  "Kitchen",
  "Master Bedroom",
  "Guest Bedroom",
  "Kids' Bedroom",
  "Wall Décor",
  "Details",
  "Interiors",
] as const;

export const CONFIGURATIONS = ["2 BHK", "2.5 BHK", "3 BHK", "3.5 BHK", "4 BHK", "Villa"] as const;

export const roomRank = (room: string) => {
  const i = (ROOMS as readonly string[]).indexOf(room);
  return i === -1 ? ROOMS.length : i;
};
