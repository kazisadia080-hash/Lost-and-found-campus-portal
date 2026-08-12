export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'claimed' | 'resolved';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';
export type Role = 'user' | 'admin';

export const CATEGORIES = [
  'Electronics',
  'ID Cards',
  'Bags',
  'Keys',
  'Books',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  role: Role;
  status?: 'active' | 'pending' | 'suspended' | 'banned';
  createdAt?: string;
}

export interface Item {
  _id: string;
  type: ItemType;
  title: string;
  description: string;
  category: Category;
  location: string;
  dateLostOrFound: string;
  images: string[];
  postedBy: { _id: string; name: string; email: string };
  status: ItemStatus;
  createdAt: string;
  pendingClaimCount?: number;
}

export interface Comment {
  _id: string;
  item: string;
  author: { _id: string; name: string };
  parent?: { _id: string; author?: { _id?: string; name: string } | null } | null;
  text: string;
  attachments?: string[];
  createdAt: string;
}

export interface Claim {
  _id: string;
  item: Item | string;
  claimant: { _id: string; name: string; email: string; phone?: string };
  verificationNote: string;
  status: ClaimStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface Message {
  _id: string;
  sender: { _id: string; name: string };
  recipient: { _id: string; name: string };
  item?: { _id: string; title: string } | null;
  text: string;
  attachments?: string[];
  read: boolean;
  deliveredAt?: string | null;
  seenAt?: string | null;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: 'comment' | 'reply' | 'message' | 'claim';
  text?: string;
  from?: { _id: string; name: string };
  item?: { _id: string; title?: string };
  comment?: { _id: string; item?: { _id: string; title?: string } };
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  user: { _id: string; name: string };
  lastMessage: string;
  lastAt: string | null;
  unread: number;
}

export interface Stats {
  totalItems: number;
  openItems: number;
  claimedItems: number;
  resolvedItems: number;
  pendingClaims: number;
  totalUsers: number;
}
