// 길이 체크
export function checkLength(password, minLength = 8) {
    return {
        isValid: password.length >= minLength,
        message: `비밀번호는 최소 ${minLength}자 이상이어야 합니다.`
    };
}

// 특수문자 체크
export function checkSpecialChars(password) {
    const specialChars = '!@#$%^&*';
    let hasSpecialChar = false;
    
    for (let char of password) {
        if (specialChars.includes(char)) {
            hasSpecialChar = true;
            break;
        }
    }
    
    return {
        isValid: hasSpecialChar,
        message: '특수문자(!@#$%^&*)를 포함해야 합니다.'
    };
}

// 숫자 포함 체크
export function checkNumbers(password) {
    const numbers = '0123456789';
    let hasNumber = false;
    
    for (let char of password) {
        if (numbers.includes(char)) {
            hasNumber = true;
            break;
        }
    }
    
    return {
        isValid: hasNumber,
        message: '숫자를 포함해야 합니다.'
    };
}


export function validatePassword(password) {
    const validations = [
        checkLength(password),
        checkSpecialChars(password),
        checkNumbers(password),
    ];
    
    // 첫 번째 실패한 검증의 메시지만 찾기
    const firstError = validations.find(validation => !validation.isValid);
    
    return {
        isValid: !firstError,  // 에러가 없으면 true
        errors: firstError ? [firstError.message] : []  // 에러가 있으면 해당 메시지만 포함
    };
}