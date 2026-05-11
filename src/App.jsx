import { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { grade7Vocabulary, grammarQuestions, sentences } from './data/vocabulary';
import AdminView from './components/Admin';
import ReminderSettings, { setupDailyReminder } from './components/Reminder';
import './App.css';

// 获取今日日期字符串
const getToday = () => new Date().toISOString().split('T')[0];

// 随机打乱数组
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// 发音函数（使用浏览器内置 SpeechSynthesis）
const speak = (text) => {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.7;  // 较慢，清晰
  utterance.pitch = 1.0;
  
  // Mac 上优先用高质量语音
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Fiona', 'Google US English'];
    let voice = voices.find(v => v.lang.startsWith('en') && preferredVoices.some(n => v.name.includes(n)));
    if (!voice) voice = voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    trySpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => setTimeout(trySpeak, 100);
  }
};

if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export default function App() {
  const [currentChild, setCurrentChild] = useState(null);
  const [view, setView] = useState('home'); // home, checkin, vocab, grammar, sentence, stats, admin, reminder
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  useEffect(() => {
    const child = storage.getCurrentChild();
    if (child) setCurrentChild(child);
    setupDailyReminder();
  }, []);

  const handleSelectChild = (child) => {
    storage.selectChild(child.id);
    setCurrentChild(child);
  };

  const handleAddChild = () => {
    if (!newChildName.trim()) return;
    const child = storage.addChild(newChildName.trim());
    storage.selectChild(child.id);
    setCurrentChild(child);
    setShowAddChild(false);
    setNewChildName('');
  };

  const handleSwitchChild = () => {
    setCurrentChild(null);
    setView('home');
  };

  // 如果没有选择孩子，显示选择/添加界面
  if (!currentChild) {
    return (
      <div className="app">
        <h1>📚 英语打卡</h1>
        <div className="child-selector">
          {storage.getChildren().map(child => (
            <button key={child.id} className="child-btn" onClick={() => handleSelectChild(child)}>
              {child.name}
            </button>
          ))}
          
          {showAddChild ? (
            <div className="add-child-form">
              <input
                type="text"
                placeholder="输入名字"
                value={newChildName}
                onChange={e => setNewChildName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddChild()}
                autoFocus
              />
              <button onClick={handleAddChild}>确认</button>
              <button onClick={() => setShowAddChild(false)}>取消</button>
            </div>
          ) : (
            <button className="add-btn" onClick={() => setShowAddChild(true)}>
              + 添加新成员
            </button>
          )}
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="app">
      <header className="header">
        <span className="child-name">👤 {currentChild.name}</span>
        <div className="header-actions">
          <button className="admin-btn" onClick={() => setView('admin')}>🛠️</button>
          <button className="switch-btn" onClick={handleSwitchChild}>切换</button>
        </div>
      </header>

      {view === 'home' && <HomeView child={currentChild} onNavigate={setView} />}
      {view === 'checkin' && <CheckinView child={currentChild} onBack={() => setView('home')} />}
      {view === 'vocab' && <VocabView child={currentChild} onBack={() => setView('home')} />}
      {view === 'grammar' && <GrammarView child={currentChild} onBack={() => setView('home')} />}
      {view === 'sentence' && <SentenceView child={currentChild} onBack={() => setView('home')} />}
      {view === 'stats' && <StatsView child={currentChild} onBack={() => setView('home')} />}
      {view === 'admin' && <AdminView onBack={() => setView('home')} />}
      {view === 'reminder' && <ReminderSettings onBack={() => setView('home')} />}
    </div>
  );
}

// 首页
function HomeView({ child, onNavigate }) {
  const today = getToday();
  const isCheckedIn = storage.isCheckedIn(child.id, today);
  
  const weakVocab = storage.getWeakVocab(child.id, 5);
  
  return (
    <div className="home">
      <div className={`checkin-card ${isCheckedIn ? 'checked' : ''}`} onClick={() => onNavigate('checkin')}>
        <div className="checkin-icon">{isCheckedIn ? '✅' : '📝'}</div>
        <div className="checkin-text">
          <div className="checkin-title">{isCheckedIn ? '今日已打卡' : '今日打卡'}</div>
          <div className="checkin-date">{today}</div>
        </div>
      </div>

      <div className="practice-grid">
        <div className="practice-card" onClick={() => onNavigate('vocab')}>
          <span className="practice-icon">📖</span>
          <span className="practice-name">词汇练习</span>
        </div>
        <div className="practice-card" onClick={() => onNavigate('grammar')}>
          <span className="practice-icon">📐</span>
          <span className="practice-name">语法练习</span>
        </div>
        <div className="practice-card" onClick={() => onNavigate('sentence')}>
          <span className="practice-icon">🔄</span>
          <span className="practice-name">翻译练习</span>
        </div>
        <div className="practice-card" onClick={() => onNavigate('stats')}>
          <span className="practice-icon">📊</span>
          <span className="practice-name">学习统计</span>
        </div>
        <div className="practice-card" onClick={() => onNavigate('reminder')}>
          <span className="practice-icon">🔔</span>
          <span className="practice-name">打卡提醒</span>
        </div>
      </div>

      {weakVocab.length > 0 && (
        <div className="weak-section">
          <h3>⚠️ 需要加强的词汇</h3>
          <div className="weak-tags">
            {weakVocab.map(word => (
              <span key={word} className="weak-tag">{word}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 打卡界面
function CheckinView({ child, onBack }) {
  const today = getToday();
  const [status, setStatus] = useState(() => storage.isCheckedIn(child.id, today) ? 'done' : 'idle');
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    // 计算连续打卡天数
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
  };

  return (
    <div className="checkin-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      
      <div className="checkin-main">
        <div className="date-display">{today}</div>
        
        {status === 'done' ? (
          <div className="checkin-success">
            <div className="big-check">✓</div>
            <div className="checkin-msg">今日已完成打卡！</div>
          </div>
        ) : (
          <button className="checkin-btn" onClick={handleCheckin}>
            点击打卡
          </button>
        )}
        
        <div className="streak-info">
          🔥 连续打卡 <span className="streak-num">{streak}</span> 天
        </div>
      </div>
    </div>
  );
}

// 词汇练习
function VocabView({ child, onBack }) {
  const [mode, setMode] = useState('choice'); // choice, spelling
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    const shuffled = shuffle(grade7Vocabulary).slice(0, 10);
    setQuestions(shuffled.map(v => ({
      ...v,
      options: shuffle([
        v.translation,
        ...shuffle(grade7Vocabulary.filter(w => w.word !== v.word))
          .slice(0, 3)
          .map(w => w.translation)
      ])
    })));
    setCurrent(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
    setInputAnswer('');
    setShowFeedback(false);
  };

  const handleChoice = (option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    const correct = option === questions[current].translation;
    storage.recordVocabAnswer(child.id, questions[current].word, correct);
    if (correct) setScore(prev => prev + 1);
  };

  const handleSpelling = () => {
    if (showFeedback) {
      if (current < questions.length - 1) {
        setCurrent(prev => prev + 1);
        setInputAnswer('');
        setShowFeedback(false);
      } else {
        setShowResult(true);
      }
      return;
    }
    setShowFeedback(true);
    const correct = inputAnswer.toLowerCase().trim() === questions[current].word.toLowerCase();
    storage.recordVocabAnswer(child.id, questions[current].word, correct);
    if (correct) setScore(score + 1);
    if (current < questions.length - 1) {
      setTimeout(() => {
        setCurrent(prev => prev + 1);
        setInputAnswer('');
        setShowFeedback(false);
      }, 1000);
    } else {
      setTimeout(() => setShowResult(true), 1000);
    }
  };

  if (showResult) {
    return (
      <div className="result-view">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>练习完成！</h2>
        <div className="score-display">
          <span className="score-num">{score}</span>
          <span className="score-total">/{questions.length}</span>
        </div>
        <button className="restart-btn" onClick={generateQuestions}>再来一次</button>
      </div>
    );
  }

  if (questions.length === 0) return <div>加载中...</div>;

  const q = questions[current];

  return (
    <div className="practice-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      
      <div className="mode-switch">
        <button className={mode === 'choice' ? 'active' : ''} onClick={() => { setMode('choice'); generateQuestions(); }}>选择题</button>
        <button className={mode === 'spelling' ? 'active' : ''} onClick={() => { setMode('spelling'); generateQuestions(); }}>拼写题</button>
      </div>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${(current / questions.length) * 100}%` }}></div>
      </div>
      <div className="progress-text">{current + 1}/{questions.length}</div>

      {mode === 'choice' ? (
        <div className="choice-mode">
          <div className="word-display">
            <button className="speak-btn" onClick={() => speak(q.word)} title="点击听发音">
              🔊
            </button>
            <div className="the-word">{q.word}</div>
            <div className="phonetic">{q.phonetic}</div>
          </div>
          <div className="options">
            {q.options.map(opt => (
              <button
                key={opt}
                className={`option ${showFeedback ? (opt === q.translation ? 'correct' : opt === selected ? 'wrong' : '') : ''}`}
                onClick={() => handleChoice(opt)}
                disabled={showFeedback}
              >
                {opt}
              </button>
            ))}
          </div>
          {showFeedback && (
            <div className={`feedback ${selected === q.translation ? 'correct' : 'wrong'}`}>
              {selected === q.translation ? '✓ 正确！' : `✗ 正确答案是：${q.translation}`}
            </div>
          )}
          {showFeedback && current < questions.length - 1 && (
            <button className="next-btn" onClick={() => { setCurrent(prev => prev + 1); setShowFeedback(false); setSelected(null); }}>下一题</button>
          )}
        </div>
      ) : (
        <div className="spelling-mode">
          <div className="word-display">
            <button className="speak-btn" onClick={() => speak(q.word)} title="点击听发音">
              🔊
            </button>
            <div className="the-word chinese-only">{q.translation}</div>
          </div>
          <div className="meaning-hint">请拼写这个单词的英文</div>
          <input
            type="text"
            className="spelling-input"
            value={inputAnswer}
            onChange={e => setInputAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSpelling()}
            placeholder="输入英文单词"
            disabled={showFeedback}
          />
          {showFeedback && (
            <div className={`feedback ${inputAnswer.toLowerCase().trim() === q.word.toLowerCase() ? 'correct' : 'wrong'}`}>
              {inputAnswer.toLowerCase().trim() === q.word.toLowerCase() ? '✓ 正确！' : `✗ 正确答案是：${q.word}`}
            </div>
          )}
          <button className="submit-btn" onClick={handleSpelling}>
            {showFeedback ? (current < questions.length - 1 ? '下一题' : '查看结果') : '确认'}
          </button>
        </div>
      )}
    </div>
  );
}

// 语法练习
function GrammarView({ child, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    const shuffled = shuffle(grammarQuestions).slice(0, 10);
    setQuestions(shuffled);
    setCurrent(0);
    setScore(0);
    setShowResult(false);
    setSelected(null);
    setShowFeedback(false);
  };

  const handleSelect = (option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    const correct = option === questions[current].correct;
    storage.recordGrammarAnswer(child.id, questions[current].id, correct);
    if (correct) setScore(prev => prev + 1);
  };

  if (showResult) {
    return (
      <div className="result-view">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>语法练习完成！</h2>
        <div className="score-display">
          <span className="score-num">{score}</span>
          <span className="score-total">/{questions.length}</span>
        </div>
        <button className="restart-btn" onClick={generateQuestions}>再来一次</button>
      </div>
    );
  }

  if (questions.length === 0) return <div>加载中...</div>;

  const q = questions[current];

  return (
    <div className="practice-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      
      <div className="question-type">{q.type === 'preposition' ? '介词' : q.type === 'adverb' ? '副词' : q.type === 'be-verb' ? 'Be动词' : '时态'}</div>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${(current / questions.length) * 100}%` }}></div>
      </div>
      <div className="progress-text">{current + 1}/{questions.length}</div>

      <div className="question-box">
        <div className="question-text">{q.question}</div>
        <div className="options">
          {q.options.map(opt => (
            <button
              key={opt}
              className={`option ${showFeedback ? (opt === q.correct ? 'correct' : opt === selected ? 'wrong' : '') : ''}`}
              onClick={() => handleSelect(opt)}
              disabled={showFeedback}
            >
              {opt}
            </button>
          ))}
        </div>
        {showFeedback && (
          <div className={`feedback ${selected === q.correct ? 'correct' : 'wrong'}`}>
            {selected === q.correct ? '✓ 正确！' : `✗ ${q.explanation}`}
          </div>
        )}
        {showFeedback && current < questions.length - 1 && (
          <button className="next-btn" onClick={() => { setCurrent(prev => prev + 1); setShowFeedback(false); setSelected(null); }}>下一题</button>
        )}
      </div>
    </div>
  );
}

// 翻译练习
function SentenceView({ child, onBack }) {
  const [mode, setMode] = useState('c2e'); // c2e, e2c
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [inputAnswer, setInputAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [mode]);

  const generateQuestions = () => {
    const pool = sentences.filter(s => s.type === mode);
    const shuffled = shuffle(pool).slice(0, 8);
    setQuestions(shuffled);
    setCurrent(0);
    setScore(0);
    setShowResult(false);
    setInputAnswer('');
    setShowFeedback(false);
  };

  const handleSubmit = () => {
    if (showFeedback) {
      if (current < questions.length - 1) {
        setCurrent(prev => prev + 1);
        setInputAnswer('');
        setShowFeedback(false);
      } else {
        setShowResult(true);
      }
      return;
    }
    setShowFeedback(true);
    const correct = inputAnswer.toLowerCase().trim() === (mode === 'c2e' ? questions[current].english.toLowerCase() : questions[current].chinese);
    storage.recordSentenceAnswer(child.id, questions[current].id, correct);
    if (correct) setScore(prev => prev + 1);
  };

  if (showResult) {
    return (
      <div className="result-view">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <h2>翻译练习完成！</h2>
        <div className="score-display">
          <span className="score-num">{score}</span>
          <span className="score-total">/{questions.length}</span>
        </div>
        <button className="restart-btn" onClick={generateQuestions}>再来一次</button>
      </div>
    );
  }

  if (questions.length === 0) return <div>加载中...</div>;

  const q = questions[current];

  return (
    <div className="practice-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      
      <div className="mode-switch">
        <button className={mode === 'c2e' ? 'active' : ''} onClick={() => setMode('c2e')}>中译英</button>
        <button className={mode === 'e2c' ? 'active' : ''} onClick={() => setMode('e2c')}>英译中</button>
      </div>

      <div className="progress-bar">
        <div className="progress" style={{ width: `${(current / questions.length) * 100}%` }}></div>
      </div>
      <div className="progress-text">{current + 1}/{questions.length}</div>

      <div className="sentence-box">
        <div className="sentence-prompt">
          {mode === 'c2e' ? '请翻译成英文：' : '请翻译成中文：'}
        </div>
        <div className="sentence-text">
          {mode === 'c2e' ? q.chinese : q.english}
        </div>
        {mode === 'c2e' && (
          <input
            type="text"
            className="translate-input"
            value={inputAnswer}
            onChange={e => setInputAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="输入英文翻译"
            disabled={showFeedback}
          />
        )}
        {mode === 'e2c' && (
          <textarea
            className="translate-input"
            value={inputAnswer}
            onChange={e => setInputAnswer(e.target.value)}
            placeholder="输入中文翻译"
            disabled={showFeedback}
          />
        )}
        {showFeedback && (
          <div className={`feedback ${inputAnswer.toLowerCase().trim() === (mode === 'c2e' ? q.english.toLowerCase() : q.chinese) ? 'correct' : 'wrong'}`}>
            {inputAnswer.toLowerCase().trim() === (mode === 'c2e' ? q.english.toLowerCase() : q.chinese) 
              ? '✓ 正确！' 
              : `✗ 正确答案：${mode === 'c2e' ? q.english : q.chinese}`}
          </div>
        )}
        <button className="submit-btn" onClick={handleSubmit}>
          {showFeedback ? (current < questions.length - 1 ? '下一题' : '查看结果') : '确认'}
        </button>
      </div>
    </div>
  );
}

// 统计界面
function StatsView({ child, onBack }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const vocabProgress = child.vocabularyProgress || {};
    const grammarProgress = child.grammarProgress || {};
    const sentenceProgress = child.sentenceProgress || {};

    const vocabTotal = Object.values(vocabProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });
    const grammarTotal = Object.values(grammarProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });
    const sentenceTotal = Object.values(sentenceProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });

    setStats({
      totalDays: child.checkins?.length || 0,
      vocab: vocabTotal,
      grammar: grammarTotal,
      sentence: sentenceTotal
    });
  }, []);

  const calcRate = (correct, wrong) => {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  return (
    <div className="stats-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      
      <h2>📊 学习统计</h2>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.totalDays}</div>
          <div className="stat-label">累计打卡天数</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-value">{calcRate(stats.vocab?.correct || 0, stats.vocab?.wrong || 0)}%</div>
          <div className="stat-label">词汇正确率</div>
          <div className="stat-detail">({stats.vocab?.correct || 0}对/{stats.vocab?.wrong || 0}错)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📐</div>
          <div className="stat-value">{calcRate(stats.grammar?.correct || 0, stats.grammar?.wrong || 0)}%</div>
          <div className="stat-label">语法正确率</div>
          <div className="stat-detail">({stats.grammar?.correct || 0}对/{stats.grammar?.wrong || 0}错)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{calcRate(stats.sentence?.correct || 0, stats.sentence?.wrong || 0)}%</div>
          <div className="stat-label">翻译正确率</div>
          <div className="stat-detail">({stats.sentence?.correct || 0}对/{stats.sentence?.wrong || 0}错)</div>
        </div>
      </div>
    </div>
  );
}
