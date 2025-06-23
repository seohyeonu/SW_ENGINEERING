const Log = require('../models/logModel');

// 생성된 로그 기입
exports.createLog = async (req, res) => {
  try {
    const { project_id, user_id, content } = req.body;
    if (!project_id || !user_id || !content) {
      return res.status(400).json({ success: false, message: '필수 항목 누락' });
    }

    await Log.create({ project_id, user_id, content });
    res.status(201).json({ success: true, message: '로그 저장 완료' });
  } catch (error) {
    console.error('로그 생성 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// 로그 조회
exports.getLogsForUser = async (req, res) => {
  try {
    const user_id = req.user?.user_id;  // 인증 미들웨어에 의해 설정된 값
    if (!user_id) {
      return res.status(401).json({ success: false, message: '인증 필요' });
    }

    const [rows] = await Log.findByUser(user_id);
    res.status(200).json({ success: true, logs: rows });
  } catch (err) {
    console.error('유저 로그 조회 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};

// 단일 로그 삭제
exports.deleteLogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'log_id 필요' });
    }

    await Log.deleteById(id);
    res.status(200).json({ success: true, message: '로그 삭제 완료' });
  } catch (err) {
    console.error('로그 삭제 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
};
