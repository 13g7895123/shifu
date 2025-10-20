export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  point: number;
  role: 'player' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AddPointsRequest {
  points: number;
}

export interface AddPointsResponse {
  success: boolean;
  newPoints: number;
  message: string;
  error?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: User;
  message: string;
  error?: string;
}
