import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import './Reminder.css';

export default function ReminderSettings({ onBack }) {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('19:00');
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // 加载设置
    const data = storage.getData();
    setEnabled(data.reminder?.enabled || false);
    setTime(data.reminder?.time || '19:00');
    
    // 检查通知权限
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('您的浏览器不支持通知功能');
      return;
    }
    
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const saveSettings = () => {
    const data = storage.getData();
    data.reminder = {
      enabled,
      time,
      permission
    };
    storage.saveData(data);
    
    // 提示用户
    if (enabled && permission === 'granted') {
      alert('✅ 提醒设置已保存！每天 ' + time + ' 会收到打卡提醒');
    } else if (enabled && permission !== 'granted') {
      alert('⚠️ 请先允许通知权限');
    }
  };

  const testNotification = () => {
    if (permission !== 'granted') {
      alert('请先允许通知权限');
      return;
    }
    
    new Notification('📚 英语打卡', {
      body: '是时候来打卡学习啦！',
      icon: '/pwa-192x192.svg',
      tag: 'test'
    });
  };

  return (
    <div className="reminder-settings">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      <h1>🔔 每日提醒</h1>

      <div className="reminder-card">
        <div className="reminder-status">
          <span>通知权限状态：</span>
          <span className={`status-badge ${permission}`}>
            {permission === 'granted' ? '✅ 已授权' : 
             permission === 'denied' ? '❌ 被拒绝' : '⏳ 待授权'}
          </span>
        </div>

        {permission !== 'granted' && (
          <button className="perm-btn" onClick={requestPermission}>
            点击授权通知权限
          </button>
        )}

        {permission === 'granted' && (
          <>
            <div className="setting-row">
              <label>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                开启每日提醒
              </label>
            </div>

            {enabled && (
              <div className="setting-row">
                <label>提醒时间：</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            )}

            <button className="save-btn" onClick={saveSettings}>
              保存设置
            </button>

            <button className="test-btn" onClick={testNotification}>
              🔔 测试通知
            </button>
          </>
        )}

        {permission === 'denied' && (
          <div className="denied-hint">
            <p>通知权限被拒绝了。</p>
            <p>请在浏览器设置中手动开启：</p>
            <p className="hint-path">设置 → 网站 → 通知 → 允许</p>
          </div>
        )}
      </div>

      <div className="reminder-info">
        <h3>💡 使用说明</h3>
        <ul>
          <li>提醒功能需要在浏览器中保持打开状态才能生效</li>
          <li>建议将 App "添加到主屏幕"以获得最佳体验</li>
          <li>每天只能在设定时间收到一次提醒</li>
        </ul>
      </div>
    </div>
  );
}

// 每日提醒检查器 - 在首页调用
export function setupDailyReminder() {
  const checkReminder = () => {
    const data = storage.getData();
    if (!data.reminder?.enabled || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    const [hours, minutes] = data.reminder.time.split(':').map(Number);
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    // 如果当前时间接近设定时间（1分钟内）且今天还未提醒
    const diff = Math.abs(now - targetTime);
    const today = new Date().toISOString().split('T')[0];
    
    if (diff < 60000 && data.reminder.lastDate !== today) {
      new Notification('📚 英语打卡提醒', {
        body: '是时候来打卡学习啦！点击开始今日练习~',
        icon: '/pwa-192x192.svg',
        tag: 'daily-reminder',
        requireInteraction: true
      });
      
      // 记录今天已提醒
      data.reminder.lastDate = today;
      storage.saveData(data);
    }
  };

  // 每分钟检查一次
  setInterval(checkReminder, 60000);
  
  // 立即检查一次
  checkReminder();
}