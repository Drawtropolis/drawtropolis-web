// Hand-written types matching the schema in
// drawtropolis_initial_schema.sql. Once the schema stabilises, replace
// this with `supabase gen types typescript` output (the Supabase MCP has
// a generate_typescript_types tool that does this directly from the live
// project — worth running once the app is actually wired up end to end).

export type Building = {
  id: number;
  name: string;
  collection: string | null;
  is_special: boolean;
};

export type RoomVisibility = "open" | "locked";
export type RoomClaimType = "standard" | "premium";
export type RoomRole = "host" | "contributor" | "viewer";
export type RoomMemberStatus = "invited" | "requested" | "approved";

export type Room = {
  id: string;
  building_id: number;
  floor_number: number;
  room_number: number;
  host_user_id: string | null;
  visibility: RoomVisibility;
  claim_type: RoomClaimType;
  contributor_cap: number;
  purchase_id: string | null;
  created_at: string;
};

export type RoomMember = {
  id: string;
  room_id: string;
  user_id: string;
  role: RoomRole;
  status: RoomMemberStatus;
  created_at: string;
};

export type Stroke = {
  id: number;
  room_id: string;
  wall_id: number;
  user_id: string;
  path_data: unknown;
  color: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  town: string | null;
  country: string | null;
  is_public: boolean;
};

// Matches the coordinate doctrine: Building-Floor-Room, e.g. 12-56-60.
export function formatCoordinate(b: number, f: number, r: number) {
  return `${String(b).padStart(2, "0")}-${String(f).padStart(2, "0")}-${String(r).padStart(2, "0")}`;
}
