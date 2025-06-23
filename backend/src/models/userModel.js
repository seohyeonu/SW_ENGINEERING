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
        this.description = user.description;
        this.google_id = user.google_id;
        this.github_id = user.github_id;
        this.profile_image = user.profile_image;
        this.oauth_provider = user.oauth_provider;
    }

    // 사용자 생성
    static async create(userData) {
        try {
            const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : null;
            
            // 사용자 생성 - 소셜 로그인 필드 추가
            const [result] = await pool.query(
                `INSERT INTO user (
                    name, username, email, password, phone, department, description,
                    google_id, github_id, profile_image, oauth_provider
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userData.name,
                    userData.username,
                    userData.email || null,
                    hashedPassword,
                    userData.phone || null,
                    userData.department || null,
                    userData.description || null,
                    userData.google_id || null,
                    userData.github_id || null,
                    userData.profile_image || null,
                    userData.oauth_provider || 'local'
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

    // 이메일로 사용자 찾기 (소셜 로그인용)
    static async findByEmail(email) {
        try {
            const [users] = await pool.query(
                'SELECT * FROM user WHERE email = ?',
                [email]
            );
            return users[0] ? new User(users[0]) : null;
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }

    // Google ID로 사용자 찾기
    static async findByGoogleId(googleId) {
        try {
            const [users] = await pool.query(
                'SELECT * FROM user WHERE google_id = ?',
                [googleId]
            );
            return users[0] ? new User(users[0]) : null;
        } catch (error) {
            console.error('Error in findByGoogleId:', error);
            throw error;
        }
    }

    // 소셜 로그인 정보 업데이트
    async updateOAuthInfo(provider, providerId, profileImage = null) {
        const updates = {};
        if (provider === 'google') {
            updates.google_id = providerId;
        } else if (provider === 'github') {
            updates.github_id = providerId;
        }
        if (profileImage) {
            updates.profile_image = profileImage;
        }
        updates.oauth_provider = provider;

        const setClause = Object.entries(updates)
            .map(([key]) => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(updates), this.user_id];

        const [result] = await pool.query(
            `UPDATE user SET ${setClause} WHERE user_id = ?`,
            values
        );

        if (result.affectedRows > 0) {
            Object.assign(this, updates);
        }
        return result.affectedRows > 0;
    }

    // 민감한 정보를 제외한 사용자 정보 반환
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        userWithoutPassword.phone = this.formatPhoneNumber(userWithoutPassword.phone);
        return userWithoutPassword;
    }

    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        const cleaned = ('' + phoneNumber).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2,3})(\d{3,4})(\d{4})$/);
        if (match) {
            return match[1] + '-' + match[2] + '-' + match[3];
        }
        return null;
    }

    // 2025.05.25 오후 5시 10분 추가
    static async updatePassword(userId, hashedPassword) {
        await pool.query('UPDATE user SET password = ? WHERE user_id = ?', [hashedPassword, userId]);
    }
}

module.exports = User;