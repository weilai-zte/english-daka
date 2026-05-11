import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './MobileGuide.css';

const STEPS = [
  {
    icon: '📱',
    title: '扫码',
    desc: '用手机相机扫描下方二维码',
  },
  {
    icon: '🌐',
    title: 'Safari 打开',
    desc: '扫码后点击右上角「Safari」打开',
  },
  {
    icon: '📲',
    title: '添加到主屏幕',
    desc: 'Safari中点击分享按钮 → 「添加至主屏幕」',
  },
  {
    icon: '✨',
    title: '完成',
    desc: '桌面上找到「英语打卡」图标，点击使用',
  },
];

function getLanIP() {
  return new Promise((resolve) => {
    // 尝试从 RTCPeerConnection 获取IP
    const pc = new window.RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (match) resolve(match[1]);
      pc.close();
    };
    setTimeout(() => { pc.close(); resolve('192.168.1.100'); }, 2000);
  });
}

export default function MobileGuide({ onBack }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [installUrl, setInstallUrl] = useState('');

  useEffect(() => {
    getLanIP().then((ip) => {
      const url = `http://${ip}:5173`;
      setInstallUrl(url);

      QRCode.toDataURL(url, {
        width: 220,
        margin: 2,
        color: { dark: '#334155', light: '#ffffff' },
      }).then(setQrDataUrl).catch(() => {
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`);
      });
    });
  }, []);

  return (
    <div className="mobile-guide">
      <div className="guide-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>📲 手机安装指南</h2>
      </div>

      <div className="guide-qr-section">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="安装二维码" className="guide-qr" />
        ) : (
          <div className="guide-qr-loading">生成中...</div>
        )}
        <p className="guide-url">{installUrl}</p>
        <p className="guide-hint">确保手机和电脑在同一Wi-Fi网络</p>
      </div>

      <div className="guide-steps">
        {STEPS.map((step, i) => (
          <div key={i} className="guide-step">
            <div className="step-num">{i + 1}</div>
            <div className="step-icon">{step.icon}</div>
            <div className="step-text">
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
