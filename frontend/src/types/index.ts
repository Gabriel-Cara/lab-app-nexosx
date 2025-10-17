import { Role } from "../providers/auth-provider";

export interface Resident {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  apartment?: string | null;
  role: Role;
  residents?: {
    building?: string | null;
    vehicle?: string | null;
    emergencyContact?: string | null;
  } | null;
  createdAt: string;
}

export interface Package {
  id: string;
  code: string;
  description: string;
  carrier?: string | null;
  receivedAt: string;
  retrievedAt?: string | null;
  resident: {
    name: string;
    apartment?: string | null;
    phone?: string | null;
  };
  createdBy: {
    name: string;
  };
}

export interface VisitorLog {
  id: string;
  entryTime: string;
  exitTime?: string | null;
  notes?: string | null;
  visitor: {
    name: string;
    document: string;
    phone?: string | null;
  };
  host: {
    name: string;
    apartment?: string | null;
  };
  handledBy?: {
    name: string;
  } | null;
}

export interface EventBooking {
  id: string;
  resident: {
    id: string;
    name: string;
    apartment?: string | null;
  };
  notes?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  capacity: number;
  startDate: string;
  endDate: string;
  createdBy: {
    name: string;
  };
  bookings: EventBooking[];
}
