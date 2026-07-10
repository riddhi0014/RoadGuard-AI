export type Severity = "critical" | "high" | "medium" | "low";
export type ComplaintStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "approved"
  | "verified"
  | "completed"
  | "rejected";

export interface Complaint {
  id: string;
  location: string;
  severity: Severity;
  status: ComplaintStatus;
  contractor: string | null;
  reportedAt: Date;
  priority: number;
  lat: number;
  lng: number;
}

// Ward 4 sits roughly around this coordinate for the mock data -
// replace with real geocoded complaint locations once the backend
// returns lat/lng on each complaint.
const WARD_CENTER = { lat: 27.1767, lng: 78.0081 };

export const mockComplaints: Complaint[] = [
  { id: "RG-2842", location: "Ashford Ave, Central", severity: "critical", status: "pending", contractor: null, reportedAt: new Date("2026-07-04T06:00:00"), priority: 97, lat: WARD_CENTER.lat + 0.012, lng: WARD_CENTER.lng - 0.01 },
  { id: "RG-2838", location: "Station Road", severity: "high", status: "pending", contractor: null, reportedAt: new Date("2026-07-02T11:22:00"), priority: 87, lat: WARD_CENTER.lat + 0.004, lng: WARD_CENTER.lng + 0.006 },
  { id: "RG-2841", location: "MG Road x 4th Cross", severity: "high", status: "assigned", contractor: null, reportedAt: new Date("2026-07-03T09:14:00"), priority: 81, lat: WARD_CENTER.lat + 0.005, lng: WARD_CENTER.lng + 0.0065 },
  { id: "RG-2843", location: "Elm Crescent, East", severity: "medium", status: "in_progress", contractor: "RoadFix Ltd.", reportedAt: new Date("2026-07-04T10:30:00"), priority: 63, lat: WARD_CENTER.lat - 0.006, lng: WARD_CENTER.lng + 0.014 },
  { id: "RG-2840", location: "Sector 12, Metro Gate", severity: "medium", status: "in_progress", contractor: "Kumar & Co.", reportedAt: new Date("2026-07-03T07:40:00"), priority: 58, lat: WARD_CENTER.lat - 0.009, lng: WARD_CENTER.lng + 0.017 },
  { id: "RG-2837", location: "Civil Lines, Block C", severity: "medium", status: "approved", contractor: "Kumar & Co.", reportedAt: new Date("2026-07-01T14:50:00"), priority: 54, lat: WARD_CENTER.lat - 0.002, lng: WARD_CENTER.lng + 0.003 },
  { id: "RG-2839", location: "Ring Road, km 8.2", severity: "low", status: "verified", contractor: "BuildRight", reportedAt: new Date("2026-07-02T16:05:00"), priority: 31, lat: WARD_CENTER.lat - 0.014, lng: WARD_CENTER.lng + 0.021 },
  { id: "RG-2836", location: "Old Bus Stand", severity: "low", status: "completed", contractor: "BuildRight", reportedAt: new Date("2026-07-01T08:30:00"), priority: 23, lat: WARD_CENTER.lat + 0.009, lng: WARD_CENTER.lng - 0.016 },
  { id: "RG-2844", location: "Parade St, South", severity: "low", status: "completed", contractor: "Kumar & Co.", reportedAt: new Date("2026-07-05T15:15:00"), priority: 18, lat: WARD_CENTER.lat + 0.007, lng: WARD_CENTER.lng - 0.005 },
  { id: "RG-2831", location: "North Bypass, Km 2", severity: "high", status: "pending", contractor: null, reportedAt: new Date("2026-06-29T09:00:00"), priority: 84, lat: WARD_CENTER.lat + 0.0055, lng: WARD_CENTER.lng + 0.0068 },
  { id: "RG-2830", location: "Lakeview Junction", severity: "medium", status: "assigned", contractor: "RoadFix Ltd.", reportedAt: new Date("2026-06-29T13:10:00"), priority: 49, lat: WARD_CENTER.lat + 0.016, lng: WARD_CENTER.lng + 0.011 },
  { id: "RG-2828", location: "Temple Road", severity: "low", status: "verified", contractor: "BuildRight", reportedAt: new Date("2026-06-28T11:45:00"), priority: 27, lat: WARD_CENTER.lat - 0.011, lng: WARD_CENTER.lng - 0.008 },
];
