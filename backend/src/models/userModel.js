const bcrypt = require('bcryptjs');
const pool = require('../config/database');

class User {
    constructor(user) {
        this.user_id = user.user_id;
        this.username = user.username;
        this.email = user.email;
        this.password = user.password;
        this.name = user.name;
        this.phone = user.phone;
        this.department = user.department;
        this.status = user.status;
        this.created_at = user.created_at;
    }

    // 사용자 생성
    static async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // 사용자 생성 - 이메일 필드 추가
            const [result] = await pool.query(
                'INSERT INTO user (name, username, email, password, phone, department) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    userData.name,      // 이름
                    userData.username,   // 사용자명
                    userData.email || null, // 이메일
                    hashedPassword,      // 비밀번호
                    userData.phone || null,
                    userData.department || null
                ]
            );
            
            // 생성된 사용자 정보 조회
            const [users] = await pool.query(
                'SELECT * FROM user WHERE username = ?',
                [userData.username]
            );
            return users[0] ? new User(users[0]) : null;
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    // username으로 사용자 찾기
    static async findByUsername(username) {
        try {
            console.log('Finding user with username:', username);
            const [users] = await pool.query(
                'SELECT * FROM user WHERE username = ?',
                [username]
            );
            console.log('Found users:', users);
            if (users[0]) {
                return new User(users[0]);
            }
            return null;
        } catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }

    // ID로 사용자 찾기
    static async findById(userId) {
        const [users] = await pool.query(
            'SELECT * FROM user WHERE user_id = ?',
            [userId]
        );
        return users[0] ? new User(users[0]) : null;
    }

    // 사용자 상태 업데이트
    async updateStatus(status) {
        const [result] = await pool.query(
            'UPDATE user SET status = ? WHERE username = ?',
            [status, this.username]
        );
        if (result.affectedRows > 0) {
            this.status = status;
        }
        return result.affectedRows > 0;
    }

    // 사용자 정보 업데이트
    async update(userData) {
        const { name, email, phone, department } = userData;
        const [result] = await pool.query(
            'UPDATE user SET name = ?, email = ?, phone = ?, department = ? WHERE username = ?',
            [name, email || null, phone || null, department || null, this.username]
        );
        if (result.affectedRows > 0) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.department = department;
        }
        return result.affectedRows > 0;
    }

    // 비밀번호 검증
    async comparePassword(candidatePassword) {
        try {
            console.log('Comparing passwords for user:', this.username);
            console.log('Stored hashed password:', this.password);
            const isMatch = await bcrypt.compare(candidatePassword, this.password);
            console.log('Password match result:', isMatch);
            return isMatch;
        } catch (error) {
            console.error('Error in comparePassword:', error);
            throw error;
        }
    }

    // 민감한 정보를 제외한 사용자 정보 반환
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User;