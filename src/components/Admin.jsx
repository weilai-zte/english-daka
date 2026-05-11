import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { grade7Vocabulary, grammarQuestions, sentences } from '../data/vocabulary';
import './Admin.css';

export default function AdminView({ onBack }) {
  const [tab, setTab] = useState('stats'); // stats, vocab, grammar, sentences
  const [children, setChildren] = useState([]);

  useEffect(() => {
    setChildren(storage.getChildren());
  }, []);

  return (
    <div className="admin-view">
      <button className="back-btn" onClick={onBack}>← 返回</button>
      <h1>🛠️ 管理后台</h1>

      <div className="admin-tabs">
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>统计概览</button>
        <button className={tab === 'vocab' ? 'active' : ''} onClick={() => setTab('vocab')}>词库管理</button>
        <button className={tab === 'grammar' ? 'active' : ''} onClick={() => setTab('grammar')}>语法库</button>
        <button className={tab === 'sentences' ? 'active' : ''} onClick={() => setTab('sentences')}>句型库</button>
      </div>

      {tab === 'stats' && <StatsTab children={children} />}
      {tab === 'vocab' && <VocabTab />}
      {tab === 'grammar' && <GrammarTab />}
      {tab === 'sentences' && <SentencesTab />}
    </div>
  );
}

// 统计概览
function StatsTab({ children }) {
  const [selectedChild, setSelectedChild] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children]);

  useEffect(() => {
    if (selectedChild) {
      const vocabProgress = selectedChild.vocabularyProgress || {};
      const grammarProgress = selectedChild.grammarProgress || {};
      const sentenceProgress = selectedChild.sentenceProgress || {};

      const vocabTotal = Object.values(vocabProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });
      const grammarTotal = Object.values(grammarProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });
      const sentenceTotal = Object.values(sentenceProgress).reduce((a, b) => ({ correct: a.correct + b.correct, wrong: a.wrong + b.wrong }), { correct: 0, wrong: 0 });

      // 计算薄弱词汇
      const weakVocab = Object.entries(vocabProgress)
        .filter(([_, s]) => s.wrong > s.correct)
        .sort((a, b) => (b[1].wrong - b[1].correct) - (a[1].wrong - a[1].correct))
        .slice(0, 10);

      // 计算薄弱语法
      const weakGrammar = Object.entries(grammarProgress)
        .filter(([_, s]) => s.wrong > s.correct)
        .sort((a, b) => (b[1].wrong - b[1].correct) - (a[1].wrong - a[1].correct))
        .slice(0, 10);

      setStats({
        totalDays: selectedChild.checkins?.length || 0,
        vocab: vocabTotal,
        grammar: grammarTotal,
        sentence: sentenceTotal,
        weakVocab,
        weakGrammar
      });
    }
  }, [selectedChild]);

  const calcRate = (correct, wrong) => {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  if (!selectedChild) {
    return <div className="empty-state">还没有添加成员，请先在首页添加</div>;
  }

  return (
    <div className="stats-tab">
      <div className="child-selector-row">
        {children.map(c => (
          <button
            key={c.id}
            className={`child-chip ${selectedChild?.id === c.id ? 'active' : ''}`}
            onClick={() => setSelectedChild(c)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="overall-stats">
        <h3>📊 {selectedChild.name} 的学习报告</h3>
        <div className="stat-row">
          <span>📅 累计打卡</span>
          <strong>{stats?.totalDays || 0} 天</strong>
        </div>
        <div className="stat-row">
          <span>📖 词汇正确率</span>
          <strong className={calcRate(stats?.vocab?.correct || 0, stats?.vocab?.wrong || 0) >= 80 ? 'good' : 'warn'}>
            {calcRate(stats?.vocab?.correct || 0, stats?.vocab?.wrong || 0)}%
          </strong>
        </div>
        <div className="stat-row">
          <span>📐 语法正确率</span>
          <strong className={calcRate(stats?.grammar?.correct || 0, stats?.grammar?.wrong || 0) >= 80 ? 'good' : 'warn'}>
            {calcRate(stats?.grammar?.correct || 0, stats?.grammar?.wrong || 0)}%
          </strong>
        </div>
        <div className="stat-row">
          <span>🔄 翻译正确率</span>
          <strong className={calcRate(stats?.sentence?.correct || 0, stats?.sentence?.wrong || 0) >= 80 ? 'good' : 'warn'}>
            {calcRate(stats?.sentence?.correct || 0, stats?.sentence?.wrong || 0)}%
          </strong>
        </div>
      </div>

      {stats?.weakVocab?.length > 0 && (
        <div className="weak-section">
          <h4>⚠️ 词汇薄弱点</h4>
          <div className="weak-list">
            {stats.weakVocab.map(([word, s]) => (
              <div key={word} className="weak-item">
                <span className="weak-word">{word}</span>
                <span className="weak-count">❌{s.wrong}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.weakGrammar?.length > 0 && (
        <div className="weak-section">
          <h4>⚠️ 语法薄弱点</h4>
          <div className="weak-list">
            {stats.weakGrammar.map(([id, s]) => {
              const q = grammarQuestions.find(g => g.id === parseInt(id));
              return q ? (
                <div key={id} className="weak-item">
                  <span className="weak-word">{q.question.substring(0, 30)}...</span>
                  <span className="weak-count">❌{s.wrong}次</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {(!stats?.weakVocab?.length && !stats?.weakGrammar?.length) && (
        <div className="empty-state">🎉 学习数据还不够，继续加油！</div>
      )}
    </div>
  );
}

// 词库管理
function VocabTab() {
  const [vocab, setVocab] = useState(grade7Vocabulary);
  const [filter, setFilter] = useState('all');

  const filteredVocab = filter === 'all' 
    ? vocab 
    : vocab.filter(v => v.unit === filter);

  const units = [...new Set(vocab.map(v => v.unit))].sort();

  return (
    <div className="vocab-tab">
      <div className="filter-row">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">全部 ({vocab.length})</option>
          {units.map(u => (
            <option key={u} value={u}>{u} ({vocab.filter(v => v.unit === u).length})</option>
          ))}
        </select>
      </div>

      <div className="vocab-list">
        {filteredVocab.map((v, i) => (
          <div key={i} className="vocab-item">
            <div className="vocab-word">{v.word}</div>
            <div className="vocab-trans">{v.translation}</div>
            <div className="vocab-meta">
              <span className="vocab-unit">{v.unit}</span>
              <span className="vocab-phonetic">{v.phonetic}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="add-hint">
        💡 如需添加更多词汇，请编辑 <code>src/data/vocabulary.js</code> 文件
      </div>
    </div>
  );
}

// 语法库管理
function GrammarTab() {
  const [filter, setFilter] = useState('all');

  const types = [...new Set(grammarQuestions.map(q => q.type))];
  const filtered = filter === 'all' 
    ? grammarQuestions 
    : grammarQuestions.filter(q => q.type === filter);

  const typeNames = {
    'preposition': '介词',
    'adverb': '副词',
    'be-verb': 'Be动词',
    'tense': '时态'
  };

  return (
    <div className="grammar-tab">
      <div className="filter-row">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">全部 ({grammarQuestions.length})</option>
          {types.map(t => (
            <option key={t} value={t}>{typeNames[t] || t} ({grammarQuestions.filter(q => q.type === t).length})</option>
          ))}
        </select>
      </div>

      <div className="grammar-list">
        {filtered.map(q => (
          <div key={q.id} className="grammar-item">
            <div className="grammar-type">{typeNames[q.type] || q.type}</div>
            <div className="grammar-question">{q.question}</div>
            <div className="grammar-options">
              {q.options.map((opt, i) => (
                <span key={i} className={`grammar-opt ${opt === q.correct ? 'correct' : ''}`}>{opt}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="add-hint">
        💡 如需添加更多语法题，请编辑 <code>src/data/vocabulary.js</code> 文件
      </div>
    </div>
  );
}

// 句型库管理
function SentencesTab() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? sentences
    : sentences.filter(s => s.type === filter);

  return (
    <div className="sentences-tab">
      <div className="filter-row">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">全部 ({sentences.length})</option>
          <option value="c2e">中译英 ({sentences.filter(s => s.type === 'c2e').length})</option>
          <option value="e2c">英译中 ({sentences.filter(s => s.type === 'e2c').length})</option>
        </select>
      </div>

      <div className="sentence-list">
        {filtered.map(s => (
          <div key={s.id} className="sentence-item">
            <div className="sentence-type">{s.type === 'c2e' ? '🇨🇳→🇬🇧' : '🇬🇧→🇨🇳'}</div>
            {s.type === 'c2e' ? (
              <>
                <div className="sentence-chinese">{s.chinese}</div>
                <div className="sentence-english">{s.english}</div>
              </>
            ) : (
              <>
                <div className="sentence-english">{s.english}</div>
                <div className="sentence-chinese">{s.chinese}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="add-hint">
        💡 如需添加更多句型，请编辑 <code>src/data/vocabulary.js</code> 文件
      </div>
    </div>
  );
}