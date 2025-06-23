/*
-작성일: 2025.05.2
- 작성자: 서현우
- 코드 목적: sns 로그인 기술 구현 */

// config/passport.js
// Passport 설정 파일: Google, GitHub OAuth 전략 등록

require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const crypto = require('crypto');
const fetch = require('node-fetch');
const axios = require('axios');

// User 모델 로드
const User = require('../models/userModel');

// Google OAuth 전략 설정
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('[Passport][Google] callback profile:', profile);
      try {
        // 이메일 추출
        const email = profile.emails?.[0]?.value;
        if (!email) throw new Error('Google 프로필에서 이메일을 가져올 수 없습니다.');
        console.log('[Passport][Google] 이메일:', email);

        // 기존 사용자 조회
        let user = await User.findByUsername(email);
        console.log('[Passport][Google] 조회된 사용자:', user);

        // 신규 사용자 생성 또는 기존 사용자 업데이트
        if (!user) {
          const tempPw = crypto.randomBytes(16).toString('hex');
          const newUser = await User.create({
            name: profile.displayName,
            username: email,
            email: email,
            password: tempPw,
            google_id: profile.id,
            profile_image: profile.photos?.[0]?.value,
            oauth_provider: 'google'
          });
          console.log('[Passport][Google] 신규 사용자 생성:', newUser.user_id);
          user = newUser;
        } else {
          // 기존 사용자의 경우 Google 정보 업데이트
          await user.updateOAuthInfo(
            'google',
            profile.id,
            profile.photos?.[0]?.value
          );
          console.log('[Passport][Google] 기존 사용자 정보 업데이트:', user.user_id);
        }

        return done(null, user);
      } catch (err) {
        console.error('[Passport][Google] 오류:', err);
        return done(err, null);
      }
    }
  )
);

// GitHub OAuth 전략 설정
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('[Passport][GitHub] callback profile:', profile);
      try {
        // 이메일 추출: profile.emails가 없으면 GitHub API 호출
        let email = profile.emails?.[0]?.value;
        if (!email) {
          // GitHub API로 이메일 목록 가져오기
          const response = await axios.get('https://api.github.com/user/emails', {
            headers: {
              Authorization: `token ${accessToken}`,
              'User-Agent': 'Node.js'
            }
          });
          const emails = response.data;
          // primary & verified 이메일 찾기
          const primaryEmailObj = emails.find(e => e.primary && e.verified);
          if (primaryEmailObj && primaryEmailObj.email) {
            email = primaryEmailObj.email;
          } else if (emails.length > 0) {
            // fallback: 첫 번째 이메일 사용
            email = emails[0].email;
          }
        }
        if (!email) {
          throw new Error('GitHub 프로필에서 이메일을 가져올 수 없습니다.');
        }
        console.log('[Passport][GitHub] 이메일:', email);

        // 기존 사용자 조회
        let user = await User.findByEmail(email); // username으로 찾는 대신 이메일로 찾기
        console.log('[Passport][GitHub] 조회된 사용자:', user);

        // 신규 사용자 생성
        if (!user) {
          const tempPw = crypto.randomBytes(16).toString('hex');
          const newUser = await User.create({
            name: profile.username,
            username: email,
            email: email,
            password: tempPw,
            oauth_provider: 'github',
            github_id: profile.id,
            profile_image: profile.photos?.[0]?.value || null
          });
          console.log('[Passport][GitHub] 신규 사용자 생성:', newUser.user_id);
          user = newUser;
        } else {
          // Update existing user's GitHub info if changed
          await user.updateOAuthInfo(
            'github',
            profile.id,
            profile.photos?.[0]?.value || null
          );
          console.log('[Passport][GitHub] 기존 사용자 정보 업데이트:', user.user_id);
        }

        return done(null, user);
      } catch (err) {
        console.error('[Passport][GitHub] 오류:', err);
        return done(err, null);
      }
    }
  )
);


module.exports = passport;