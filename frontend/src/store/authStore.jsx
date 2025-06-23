import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      loginType: null, // 'local' 또는 'social'
      login: ({ user, token, type = 'local' }) => {
        // 로컬 로그인인 경우에만 프론트엔드에서 토큰을 설정
        if (type === 'local' && token) {
          Cookies.set('token', token, {
            expires: 1,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax'
          });
        }
        set({ isAuthenticated: true, user, loginType: type });
      },
      logout: async () => {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error(`Logout failed: ${response.status}`);
          }

          // 쿠키에서 토큰 제거 (로컬/소셜 모두)
          Cookies.remove('token', { path: '/' });
          
          // 상태 초기화
          set({ isAuthenticated: false, user: null, loginType: null });
          
          // localStorage에서 persist 데이터 제거
          window.localStorage.removeItem('wiffle-storage');
          
          return true;
        } catch (error) {
          console.error('로그아웃 API 호출 중 오류:', error);
          // API 호출 실패해도 상태는 초기화
          set({ isAuthenticated: false, user: null, loginType: null });
          window.localStorage.removeItem('wiffle-storage');
          return false;
        }
      },
      setUser: (userData) => set({ user: userData }),
    }),
    {
      name: 'wiffle-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loginType: state.loginType
      }),
      onRehydrateStorage: () => (state) => {
        // 토큰 체크
        const token = Cookies.get('token');
        
        if (!token) {
          state.isAuthenticated = false;
          state.user = null;
          state.loginType = null;
          return;
        }

        // localStorage에서 사용자 정보 복원
        const storedUser = localStorage.getItem('wiffle-storage');
        if (storedUser) {
          try {
            const parsedData = JSON.parse(storedUser);
            if (parsedData.state && parsedData.state.user) {
              state.isAuthenticated = true;
              state.user = parsedData.state.user;
              state.loginType = parsedData.state.loginType;
            }
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
            state.isAuthenticated = false;
            state.user = null;
            state.loginType = null;
          }
        }
      }
    }
  )
)