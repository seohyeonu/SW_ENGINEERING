import styles from './css_folder/SignInAndSignUp.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore'
import Cookies from 'js-cookie'; // js-cookie 라이브러리 추가

function SignInAndSignUp() {
  const [isPhoneNum, setIsPhoneNum] = useState('');
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  // #. 로그인 로직에 대한 부분
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // #. 회원가입 로직에 대한 부분 (추가해야 할 부분)
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState(''); // 이 부분이 중요!
  const [registerPasswordCheck, setRegisterPasswordCheck] = useState(''); // 이 부분이 중요!
  const [registerDepartment, setRegisterDepartment] = useState('');
  const [passwordError, setPasswordError] = useState(''); // 비밀번호 불일치 에러 메시지

  const { login } = useAuthStore(); // 상태 저장 함수 불러오기

  // URL 파라미터 체크를 위한 useEffect 추가
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGoogleSignup = params.get('isGoogleSignup');
    
    if (isGoogleSignup === 'true') {
      // Google 회원가입 정보로 폼 초기화
      setRegisterEmail(params.get('email') || '');
      setRegisterName(params.get('name') || '');
      setIsActive(true); // 회원가입 폼으로 전환
      
      // Google ID 저장을 위한 state 추가
      setGoogleId(params.get('google_id'));
    }
  }, []);

  // Google ID를 저장하기 위한 state 추가
  const [googleId, setGoogleId] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert('로그인 실패: ' + data.message);
        return;
      }

      // 토큰을 쿠키에 저장
      Cookies.set('token', data.token, {
        expires: 1,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
      });

      // 로그인 상태 업데이트 (구글 로그인과 동일한 방식)
      login({ 
        user: {
          ...data.user,
          oauth_provider: 'local'
        }, 
        token: data.token, 
        type: 'local' 
      });
      
      // 리다이렉트 전에 상태 업데이트가 완료되도록 setTimeout 사용
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('로그인 중 오류:', error);
      alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
  };

  // 회원가입 제출 함수
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (registerPassword !== registerPasswordCheck) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: registerName,
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
          phone: isPhoneNum.replace(/-/g, ''),
          department: registerDepartment,
          google_id: googleId || null  // 소셜 로그인 ID 추가
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert('회원가입 실패: ' + data.message);
        return;
      }

      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      handleToggleToLogin();
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 소셜 로그인 핸들러 추가
  const handleSocialLogin = (provider) => {
    // 현재 URL을 저장하여 소셜 로그인 후 돌아올 수 있도록 함
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    
    // 소셜 로그인 URL로 리다이렉트
    window.location.href = `/api/auth/${provider}`;
  };

  // 소셜 로그인 콜백 처리
  useEffect(() => {
    // URL에서 토큰과 사용자 정보 파라미터 확인
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // 토큰을 쿠키에 저장
      Cookies.set('token', token, {
        expires: 1,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
      });

      // 사용자 정보 객체 생성
      const user = {
        user_id: params.get('user_id'),
        username: params.get('username'),
        email: params.get('email'),
        name: params.get('name'),
        phone: params.get('phone'),
        department: params.get('department'),
        status: params.get('status'),
        created_at: params.get('created_at')
      };

      // 상태 업데이트 및 리다이렉트
      login(user);
      navigate('/dashboard');
    }
  }, [navigate, login]);

  // #. 회원가입과 로그인 창 변경 로직
  const handleToggleToRegister = () => setIsActive(true);
  const handleToggleToLogin = () => setIsActive(false);

  // #. 회원가입 중 전화번호 입력에 대한 로직
  const handleKeyDownBlockNonNumeric = (e) => {
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

    // 숫자 키(0~9) 또는 허용된 키만 통과
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };


  // 0. 전화번호 입력시 fomat 알아서 맞춰주기
  const formatPhoneNumber = (value) => {
    const onlyNums = value.replace(/[^0-9]/g, '');
    if (onlyNums.length < 4) return onlyNums;
    if (onlyNums.length < 8) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
    return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
  };
  /*
  const str = "0123456789";
  str.slice(0, 3);  "012"       0~2번째 문자까지
  str.slice(3);     "3456789"   3번째부터 끝까지
  */

  const inputRef = useRef(null);

  const handlePhoneNum = (e) => {
    const input = e.target;
    const raw = e.target.value;
    const cursor = input.selectionStart;

    // 숫자만 추출
    const nextDigits = raw.replace(/\D/g, '');

    // 새 포맷
    const formatted = formatPhoneNumber(nextDigits);

    // 커서 기준으로 앞에 있던 숫자 개수 파악
    /*
    [코드 이해용 지표]
      인덱스:    0   1   2   3   4   5   6   7
      문자열:    0   1   0   -   1   2   3   4
      커서:                ↑ (cursor = 3) & (rawLeft = "010") & (leftDigitsCount = 3)
      커서:                    ↑ (cursor = 4) & (rawLeft = "010-") & (leftDigitsCount = 3)
    */
    const rawLeft = raw.slice(0, cursor); // → "010"
    const leftDigitsCount = rawLeft.replace(/\D/g, '').length; // #. 문자열에서 숫자 아닌 것 모두 제거 후 "010"의 길이 → '3'

    // 포맷된 문자열에서 그 숫자 수만큼 진행한 커서 위치 찾아냄
    let nextCursor = 0;
    let digitsSeen = 0;

    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {  // "010-1234-5678"에서 하이픈이 아니면 digitsSeen을 1씩 증가 시킴.
        digitsSeen++;
      }
      if (digitsSeen === leftDigitsCount) {
        /*
          "010" 이어도 leftDigitsCount = 3 이라 i = 2;
          "010-" 이어도 leftDigitsCount = 3 이라 i = 2;
        */
        nextCursor = i + 1;
        break;
      }
    }

    setIsPhoneNum(formatted);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = nextCursor;
      }
    }, 0);
  };

  // 1. 전화번호 지울때 하이픈을 건너서 숫자를 지우는 방식
  const handlePhoneKeyDown = (e) => {
    const input = e.target;
    const cursor = input.selectionStart;

    // 현재 커서 앞 글자가 하이픈이면 → 숫자까지 삭제되도록 보정
    if (e.key === 'Backspace' && cursor > 0 && isPhoneNum[cursor - 1] === '-') {
      e.preventDefault(); // 기본 동작 막고
      const newCursor = cursor - 1;

      // 하이픈을 뛰어넘은 상태에서 삭제할 문자열 재구성
      const raw = isPhoneNum.slice(0, newCursor - 1) + isPhoneNum.slice(newCursor);
      const formatted = formatPhoneNumber(raw.replace(/[^0-9]/g, ''));

      setIsPhoneNum(formatted);

      // 커서 복원
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursor - 1;
        }
      }, 0);
    }// if 종료
  };

  /*
  [참고 지표]
    문자열:  1   2   3   -   4   5   6   7
    인덱스:  0   1   2   3   4   5   6   7
    커서:  ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑
    위치:  0   1   2   3   4   5   6   7   8
  */

  /*
  백에서 정제된 상태로 폰 번호를 받고 싶다면 이렇게 해서 넘기면 됨.
    const str = "010-1234-5678";
    console.log(str.replace(/[^0-9]/g, '')); [res: "01012345678"]
  */


  return (
    <div className={`${styles.container} ${isActive ? styles.active : ''}`}>
      <div className={styles.headLine}>
        <h1>
          <button
            className={`${styles['headLine-login-btn']} ${isActive ? styles['move-right'] : ''}`}
            onClick={() => navigate('/')}
          >
            wiffle
          </button>
          <button
            className={`${styles['headLine-register-btn']} ${isActive ? styles['move-left'] : ''}`}
            onClick={() => navigate('/')}
          >
            wiffle
          </button>
        </h1>
      </div>

      <div className={`${styles['form-box']} ${styles.login}`}>
        <form onSubmit={handleLoginSubmit}>
          <h1>Login</h1>
          <br />
          <hr />
          <div className={styles['input-box']}>
            <i className="bx bxs-user-account"></i>
            <input type="text" name="username" placeholder="Username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-lock-alt"></i>
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)} 
              autoComplete="current-password"
              required 
            />
          </div>
          <div className={styles['forgot-link']}>
            <Link to="#">Forgot Password?</Link>
          </div>
          <button type="submit" className={styles.btn}>Login</button>
          <p>or login with social platforms</p>
          <div className={styles['social-icons']}>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className={styles['social-btn']}
            >
              <i className="bx bxl-google"></i>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className={styles['social-btn']}
            >
              <i className="bx bxl-github"></i>
            </button>
            <Link to="#"><i className="bx bxl-instagram"></i></Link>
          </div>
        </form>
      </div>

      <div className={`${styles['form-box']} ${styles.register}`}>
        <form onSubmit={handleRegisterSubmit}>
          <h1>Sign up</h1>
          <br />
          <hr />
          <div className={styles['input-box']}>
            <i className="bx bxs-user"></i>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-user-account"></i>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-envelope"></i>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-phone"></i>
            <input
              ref={inputRef}
              type="text"
              id='phone'
              name="phone"
              placeholder="010-0000-0000"
              value={isPhoneNum}
              onChange={handlePhoneNum}
              onKeyDown={(e)=> {handlePhoneKeyDown(e); handleKeyDownBlockNonNumeric(e);}}
              maxLength={13}
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-buildings"></i>
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={registerDepartment}
              onChange={(e) => setRegisterDepartment(e.target.value)}
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className="bx bxs-lock-alt"></i>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className={styles['input-box']}>
            <i className='bx bxs-badge-check'></i>
            <input
              type="password"
              name="passwordCheck"
              placeholder="Password check"
              value={registerPasswordCheck}
              onChange={(e) => {
                setRegisterPasswordCheck(e.target.value);
                setPasswordError(''); // 비밀번호 확인 시 에러 메시지 초기화
              }}
              autoComplete="new-password"
              required
            />
          </div>
          {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
          <button type="submit" className={styles.btn}>Sign up</button>
          <p>or register with social platforms</p>
          <div className={styles['social-icons']}>
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className={styles['social-btn']}
            >
              <i className="bx bxl-google"></i>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className={styles['social-btn']}
            >
              <i className="bx bxl-github"></i>
            </button>
            <Link to="#"><i className="bx bxl-instagram"></i></Link>
          </div>
        </form>
      </div>

      <div className={styles['toggle-box']}>
        <div className={`${styles['toggle-panel']} ${styles['toggle-left']}`}>
          <h1>Hello, Welcome!</h1>
          <p>Don't have an account?</p>
          <button className={`${styles.btn} ${styles['register-btn']}`} onClick={handleToggleToRegister}>Sign up</button>
        </div>
        <div className={`${styles['toggle-panel']} ${styles['toggle-right']}`}>
          <h1>Welcome Back!</h1>
          <p>Already have an account?</p>
          <button className={`${styles.btn} ${styles['login-btn']}`} onClick={handleToggleToLogin}>Login</button>
        </div>
      </div>
    </div>
  );
}


export default SignInAndSignUp;