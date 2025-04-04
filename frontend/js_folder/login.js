import * as passwordValidation from '../modules/passwordValidation.js';
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');


registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})



// 로그인 폼 제출 이벤트(프론트 -> 서버로 요청)
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async function(e) {
    // 1. 기본 제출 동작 방지
    e.preventDefault(); 

    // 2. 폼에서 사용자 이름과 비밀번호 가져오기
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    console.log(username, password);    


    // 3. 입력값 검증
    if(!username || !password) {
        alert('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }

    // 2차 확인 : 값이 입력되어 있다면 정확히 입력 되어 있는지를 확인-> 모듈에 구현된 함수를 통해서!
    const validation = passwordValidation.validatePassword(password);
    if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
    }

    // 5. 서버로 로그인 요청 보내기
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: username,
                password: password
            })
        });

        // 6. 서버 응답 처리
        const data = await response.json();
        
        if(data.success) {
            // 로그인 성공
            alert('로그인 성공!');
            window.location.href = '/'; 
        } else {
            // 로그인 실패
            alert(data.message);
        }
    } catch(error) {
        // 7. 오류 처리
        console.error('로그인 오류:', error);
        alert('로그인 처리 중 오류가 발생했습니다.');
    }
});




// 회원가입 폼 제출 이벤트(프론트 -> 서버로 요청)
const registerForm = document.querySelector('.register form');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. 폼에서 입력된 값 가져오기
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordCheck = document.getElementById('registerPasswordCheck').value;

    // 2. 입력값 검증
    if (!username || !email || !password || !passwordCheck) {
        alert('모든 필수 항목을 입력해주세요.');
        return;
    }

    // 2-1. 이메일 형식 검증
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        alert('유효하지 않은 이메일 형식입니다.');
        return;
    }

    // 3. 비밀번호 일치 확인
    if (password !== passwordCheck) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 4. 비밀번호 유효성 검사 -> 모듈로 구현해놨던 함수로 비밀번호 검증하는 과정
    // 특수문자 체크, 길이 체크, 숫자 포함 체크
    const validation = passwordValidation.validatePassword(password);
    if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
    }
    
    console.log(username,email,password,passwordCheck);
    
    try {
        // 5. 서버로 회원가입 요청 보내기
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                password_check: passwordCheck
            })
        });


        // 6. 서버에서 응답 받기 -> 서버에서 응답을 받았다면 -> 응답을 json으로 변환해서 가져온다. 
        const data = await response.json();

        if (data.success) {
            alert('회원가입이 완료되었습니다!');
            container.classList.remove('active'); // 로그인 폼으로 전환
            registerForm.reset(); // 폼 초기화 
        } else {
            alert(data.message || '회원가입 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert('회원가입 처리 중 오류가 발생했습니다.');
    }
});
