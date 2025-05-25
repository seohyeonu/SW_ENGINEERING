/*
-작성일: 2025.05.2
- 작성자: 서현우
- 코드 목적: sns 로그인 기술 구현 */

// backend/src/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/userModel');
require('dotenv').config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findByUsername(email);
    if (!user) {
      user = await User.create({
        username: email,
        email: email,
        name: profile.displayName || email,
        password: accessToken  // OAuth 유저는 비밀번호 대신 토큰으로 처리
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const username = profile.username;
    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.create({
        username: username,
        email: (profile.emails && profile.emails[0]?.value) || null,
        name: profile.displayName || username,
        password: accessToken
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
