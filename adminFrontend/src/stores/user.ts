import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { login as loginApi, getUserInfo } from '../api/admin';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setUser = (newUser: User) => {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const login = async (username: string, password: string) => {
    const data = await loginApi({ username, password });
    setToken(data.token);
    setUser(data.user);
  };

  const fetchUserInfo = async () => {
    const userInfo = await getUserInfo();
    setUser(userInfo);
  };

  const logout = () => {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return {
    token,
    user,
    isLoggedIn,
    setToken,
    setUser,
    login,
    fetchUserInfo,
    logout,
  };
});
