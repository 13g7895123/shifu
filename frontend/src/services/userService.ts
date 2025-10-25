import axios from 'axios';
import { User, AddPointsRequest, AddPointsResponse, UpdateProfileRequest, UpdateProfileResponse } from '../types/user';

// 優先使用 REACT_APP_BACKEND_API_URL，若無則使用 REACT_APP_API_URL，最後才使用預設值
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 設定 axios 預設配置
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export class UserService {
  // 獲取所有用戶
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('獲取用戶列表失敗');
    }
  }

  // 獲取單個用戶
  static async getUserById(id: string): Promise<User> {
    try {
      const response = await axios.get(`/api/users/${id}`);
      // UserController 直接回傳 user 物件
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.error || '獲取用戶資料失敗';
        throw new Error(errorMessage);
      }
      throw new Error('獲取用戶資料失敗');
    }
  }

  // 為用戶增加願望幣
  static async addUserPoints(id: string, points: number): Promise<AddPointsResponse> {
    try {
      const request: AddPointsRequest = { points };
      const response = await axios.post(`/api/users/${id}/points`, request);
      return response.data;
    } catch (error) {
      console.error('Error adding points:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || '增加願望幣失敗');
      }
      throw new Error('增加願望幣失敗');
    }
  }

  // 更新用戶個人資料
  static async updateUserProfile(id: string, profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      const response = await axios.put(`/api/users/${id}/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || '更新個人資料失敗');
      }
      throw new Error('更新個人資料失敗');
    }
  }
}
