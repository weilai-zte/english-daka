import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import './MobileCheckin.css';

const getToday = () => new Date().toISOString().split('T')[0];

export default function MobileCheckin({ child, onBack }) {
  const today = getToday();
  const [status, setStatus] = useState(() => storage.isCheckedIn(child.id, today) ? 'done' : 'idle');
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const checkins = child.checkins?.sort().reverse() || [];
    let count = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (checkins.includes(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(count);
  }, []);

  const handleCheckin = () => {
    storage.addCheckin(child.id, today);
    setStatus('done');
    setStreak(prev => prev + 1);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  return (
    <div className="mobile-checkin">
      {showConfetti && (
        <div className="confetti">🎉</div>
      )}

      <div className="mc-header">
        <button className="mc-back" onClick={onBack}>←</button>
        <span className="mc-title">📝 每日打卡</span>
        <span className="mc-child">{child.name}</span>
      </div>

      <div className="mc-date">{today}</div>

      {status === 'done' ? (
        <div className="mc-done">
          <div className="mc-check">✓</div>
          <div className="mc-done-text">今日已完成打卡！</div>
          <div className="mc-streak">
            🔥 连续 <span className="mc-streak-num">{streak}</span> 天
          </div>
        </div>
      ) : (
        <div className="mc-idle">
          <button className="mc-btn" onClick={handleCheckin}>
            打卡
          </button>
          <div className="mc-streak-preview">
            今日打卡后可获得 <span className="mc-streak-num">{streak + 1}</span> 天连续
          </div>
        </div>
      )}
    </div>
  );
}
