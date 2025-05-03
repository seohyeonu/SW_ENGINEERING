// 프론트에서 백으로 api 호출 함수 모아두는 js 코드

import { API_BASE_URL } from './config';

//1. 회원가입
export const register = async (username, email, password, passwordCheck) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                password_check: passwordCheck // 백엔드에서 사용하는 이름으로 변경
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || '회원가입에 실패했습니다.');
        }

        return data; // { success: true, message: '회원가입 성공' }
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
};



//2. 로그인
export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,    // 백엔드에서 req.body.email로 받음
                password // 백엔드에서 req.body.password로 받음
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '로그인에 실패했습니다.');
        }

        return data; // { success: true, message: '로그인 성공', user: {...} }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

//3. 로그아웃
export const logout = async (email) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || '로그아웃에 실패했습니다.');
        }

        return data;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};




