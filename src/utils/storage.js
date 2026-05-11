// 本地存储工具
const STORAGE_KEY = 'english-打卡';

export const storage = {
  // 获取所有数据
  getData: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDefaultData();
  },
  
  // 保存所有数据
  saveData: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  
  // 孩子管理
  getChildren: () => {
    return storage.getData().children || [];
  },
  
  addChild: (name) => {
    const data = storage.getData();
    const newChild = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      checkins: [],
      vocabularyProgress: {},
      grammarProgress: {},
      sentenceProgress: {}
    };
    data.children = data.children || [];
    data.children.push(newChild);
    storage.saveData(data);
    return newChild;
  },
  
  selectChild: (childId) => {
    const data = storage.getData();
    data.currentChildId = childId;
    storage.saveData(data);
  },
  
  getCurrentChild: () => {
    const data = storage.getData();
    if (!data.currentChildId) return null;
    return data.children?.find(c => c.id === data.currentChildId) || null;
  },
  
  // 打卡记录
  addCheckin: (childId, date) => {
    const data = storage.getData();
    const child = data.children?.find(c => c.id === childId);
    if (!child) return;
    child.checkins = child.checkins || [];
    if (!child.checkins.includes(date)) {
      child.checkins.push(date);
    }
    storage.saveData(data);
  },
  
  isCheckedIn: (childId, date) => {
    const child = storage.getChildren().find(c => c.id === childId);
    return child?.checkins?.includes(date) || false;
  },
  
  // 词汇练习进度
  recordVocabAnswer: (childId, word, correct) => {
    const data = storage.getData();
    const child = data.children?.find(c => c.id === childId);
    if (!child) return;
    child.vocabularyProgress = child.vocabularyProgress || {};
    if (!child.vocabularyProgress[word]) {
      child.vocabularyProgress[word] = { correct: 0, wrong: 0 };
    }
    if (correct) {
      child.vocabularyProgress[word].correct++;
    } else {
      child.vocabularyProgress[word].wrong++;
    }
    storage.saveData(data);
  },
  
  // 语法练习进度
  recordGrammarAnswer: (childId, questionId, correct) => {
    const data = storage.getData();
    const child = data.children?.find(c => c.id === childId);
    if (!child) return;
    child.grammarProgress = child.grammarProgress || {};
    if (!child.grammarProgress[questionId]) {
      child.grammarProgress[questionId] = { correct: 0, wrong: 0 };
    }
    if (correct) {
      child.grammarProgress[questionId].correct++;
    } else {
      child.grammarProgress[questionId].wrong++;
    }
    storage.saveData(data);
  },
  
  // 句子练习进度
  recordSentenceAnswer: (childId, sentenceId, correct) => {
    const data = storage.getData();
    const child = data.children?.find(c => c.id === childId);
    if (!child) return;
    child.sentenceProgress = child.sentenceProgress || {};
    if (!child.sentenceProgress[sentenceId]) {
      child.sentenceProgress[sentenceId] = { correct: 0, wrong: 0 };
    }
    if (correct) {
      child.sentenceProgress[sentenceId].correct++;
    } else {
      child.sentenceProgress[sentenceId].wrong++;
    }
    storage.saveData(data);
  },
  
  // 获取薄弱词汇
  getWeakVocab: (childId, limit = 10) => {
    const child = storage.getChildren().find(c => c.id === childId);
    if (!child) return [];
    const progress = child.vocabularyProgress || {};
    return Object.entries(progress)
      .filter(([_, stats]) => stats.wrong > stats.correct)
      .sort((a, b) => (b[1].wrong - b[1].correct) - (a[1].wrong - a[1].correct))
      .slice(0, limit)
      .map(([word]) => word);
  }
};

function getDefaultData() {
  return {
    children: [],
    currentChildId: null
  };
}
