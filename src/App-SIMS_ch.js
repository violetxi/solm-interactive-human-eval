import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // 导入Firebase配置
import Instructions from './Instructions'; // 导入Instructions组件
import Demographics from './Demographics'; // 导入Demographics组件
import './App.css';

// 加载CSV文件的函数
const loadCSV = (url) => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// 使用Fisher-Yates算法打乱数组的函数
const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const attentionChecks = [
  { question: "请确定以下陈述是正确还是错误。", statement: "1 + 1 = 2", note: "你不应该选择“模棱两可”。", correctAnswer: "True", isAttentionCheck: true },
  { question: "请确定以下陈述是正确还是错误。", statement: "请选择“正确”。", note: "你不应该选择“模棱两可”。", correctAnswer: "True", isAttentionCheck: true },
  { question: "请确定以下陈述是正确还是错误。", statement: "请选择“错误”。", note: "你不应该选择“模棱两可”。", correctAnswer: "False", isAttentionCheck: true }
];

function App() {
  // 说明内容
  const [showInstructions, setShowInstructions] = useState(true);
  const [prolificID, setProlificID] = useState('');
  // 主研究内容
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // 人口统计内容
  const [showDemographics, setShowDemographics] = useState(false);
  const [responses, setResponses] = useState([]);

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  useEffect(() => {
    loadCSV('data/interactive.csv')
      .then((data) => {
        const questionsData = data.map(item => ({
          question: `当一个人在对话中说"${item.original_data}"时，他们的情感是什么？`,
          statement: item.conversation,
          note: item.note || '',
          isAttentionCheck: false
        }));
        const allQuestions = shuffleArray([...questionsData, ...attentionChecks]);
        setQuestions(allQuestions);
      })
      .catch((error) => {
        console.error('加载CSV时出错:', error);
      });
  }, []);

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 === questions.length) {
      setShowDemographics(true);
    } else {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  const logResponse = async (response) => {
    console.log('记录响应:', response);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const newResponse = {
        question: currentQuestion.question,
        statement: currentQuestion.statement,
        response: response,
        timestamp: new Date(),
      };
      let updatedProlificID = `SIMS-ch-1-${prolificID}`;
      await addDoc(collection(db, updatedProlificID), newResponse);
      console.log('响应已记录:', response);

      // 确保在记录响应后调用此函数
      handleNextQuestion();
    } catch (e) {
      console.error('添加文档时出错: ', e);
    }
  };

  const handleDemographicsComplete = async (demographicsData) => {
    // 处理人口统计调查的完成
    console.log('人口统计调查已完成');
  };

  const parseConversation = (conversation) => {
    return conversation.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('A：')) {
        return { speaker: 'A', content: trimmedLine.substring(2).trim() };
      } else if (trimmedLine.startsWith('B：')) {
        return { speaker: 'B', content: trimmedLine.substring(2).trim() };
      }
      return null;
    }).filter(Boolean);    
  };

  const currentQuestion = questions[currentQuestionIndex]?.question || '加载中...';
  const currentStatement = questions[currentQuestionIndex]?.statement || '';
  const currentNote = questions[currentQuestionIndex]?.note || '';
  const isAttentionCheck = questions[currentQuestionIndex]?.isAttentionCheck || false;
  const parsedConversation = parseConversation(currentStatement);
  
  return (    
    <div className="App">
      {showInstructions ? (
        <Instructions onComplete={handleInstructionsComplete} setProlificID={setProlificID} />
      ) : showDemographics ? (
        <Demographics
          onComplete={handleDemographicsComplete}
          responses={responses}
          ratings={[]} // 假设您有需要传递的评分
          prolificID={prolificID}
        />
      ) : (
        <header className="App-header">
          {!isAttentionCheck && <p>请阅读下面的对话：</p>}
          <div className="conversation">            
            {!isAttentionCheck && parsedConversation.map((line, index) => (              
              <p key={index} style={{ color: line.speaker === 'A' ? 'red' : 'blue', margin: '0 0 10px 0' }}>
                {line.speaker}: {line.content}
              </p>
            ))}            
          </div>          
          <p>{currentQuestion}</p>
          {isAttentionCheck && <p>{currentStatement}</p>}
          {currentNote && <p>{currentNote}</p>}
          <div>
            {isAttentionCheck ? (
              <>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('True')}>
                  正确
                </button>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('False')}>
                  错误
                </button>
                <button className="App-link" onClick={() => logResponse('Ambiguous')}>
                  模棱两可
                </button>
              </>
            ) : (
              <>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('positive')}>
                  积极的
                </button>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('negative')}>
                  消极的
                </button>               
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('neutral')}>
                  中立的
                </button>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('ambiguous')}>
                  模棱两可
                </button>
              </>
            )}
          </div>
        </header>
      )}
    </div>
  );
}

export default App;
