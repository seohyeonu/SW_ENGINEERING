import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      login: (userData) => set({ isAuthenticated: true, user: userData }),
      logout: () => {
        console.log('로그아웃 시작: 백엔드 API 호출');
        
        // 현재 사용자 정보 가져오기
        const currentUser = get().user;
        const username = currentUser?.username;
        
        // 백엔드 로그아웃 API 호출 // ㅅㅂ 경로 설정 좀 ....
        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        })
        .then(response => {
          console.log('백엔드 로그아웃 응답:', response.status);
          
          // 상태 초기화
          set({ isAuthenticated: false, user: null });
          console.log('로그아웃 완료: 상태 초기화됨');
        })
        .catch(error => {
          console.error('로그아웃 API 호출 중 오류:', error);
          
          // API 호출 실패해도 상태는 초기화
          set({ isAuthenticated: false, user: null });
          console.log('로그아웃 부분 완료: 상태만 초기화됨');
        });
      },

      // 2025.5.25.6시 15분 추가
      setUser: (newUserData) => set({ user: newUserData }),

    }),
    {
      name: 'wiffle-storage', // 로컬 스토리지에 저장될 키 이름
    }
  )
)