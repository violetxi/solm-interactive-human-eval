import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // 导入Firebase配置
import Instructions from './Instructions'; // 导入Instructions组件
import Demographics from './Demographics'; // 导入人口统计组件
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

// 根据不同数据集定义特定的选项顺序
const choiceOrderMap = {
  'set_4.csv': [
    { label: '模糊', value: '模糊' },
    { label: '积极', value: '积极' },
    { label: '消极', value: '消极' },
    { label: '中性', value: '中性' }    
  ],
  'set_5.csv': [
    { label: '消极', value: '消极' },
    { label: '积极', value: '积极' },
    { label: '中性', value: '中性' },
    { label: '模糊', value: '模糊' }
  ],
  'set_6.csv': [
    { label: '中性', value: '中性' },
    { label: '积极', value: '积极' },
    { label: '消极', value: '消极' },
    { label: '模糊', value: '模糊' }
  ]
  // Add more datasets if needed
};

const attentionChecks = [
  { question: "请确定以下陈述是正确还是错误的。", statement: "1 + 1 = 2", note: "", correctAnswer: "正确", isAttentionCheck: true },
  { question: "请确定以下陈述是正确还是错误的。", statement: "玛丽对她的假期感到兴奋，但由于工作不得不取消。玛丽对这种情况可能感到兴奋。", note: "", correctAnswer: "错误", isAttentionCheck: true },
  { question: " ", statement: "请选择‘错误’", note: "", correctAnswer: "错误", isAttentionCheck: true },
  { question: "请确定以下陈述是正确还是错误的。", statement: "约翰认为疫苗在预防疾病方面是有效的。约翰可能会支持疫苗接种计划。", note: "", correctAnswer: "正确", isAttentionCheck: true }
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
  const [currentDataset, setCurrentDataset] = useState('set_1.csv'); // 跟踪正在使用的数据集

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  useEffect(() => {
    loadCSV(`data/${currentDataset}`)
      .then((data) => {
        const questionsData = data.filter(item => item.original_data !== undefined && item.original_data.trim() !== '')
          .map(item => ({
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
  }, [currentDataset]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const choices = currentQuestion.isAttentionCheck
        ? [
            { label: '正确', value: 'True' },
            { label: '错误', value: 'False' }
          ]
        : choiceOrderMap[currentDataset]; // 根据数据集使用特定顺序的选项

      setShuffledChoices(choices); // 对于常规问题不再打乱，使用预定义顺序
    }
  }, [currentQuestionIndex, questions, currentDataset]);

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

      // 从数据集文件名中提取set号 (例如, 'set_1.csv' -> '1')
      const setNumber = currentDataset.match(/set_(\d+)\.csv/)[1];
      // 更新Prolific ID，使用数据集的set号
      let updatedProlificID = `Full-SIMS-ch-${setNumber}-${prolificID}`;
      
      await addDoc(collection(db, updatedProlificID), newResponse);
      console.log('响应已记录:', response);

      handleNextQuestion();
    } catch (e) {
      console.error('添加文档时出错: ', e);
    }
  };

  const handleDemographicsComplete = async (demographicsData) => {
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
              </>
            ) : (
              <>
                {choiceOrderMap[currentDataset]?.map((choice, index) => (
                  <button
                    key={index}
                    className="App-link"
                    style={{ marginRight: '25px' }}
                    onClick={() => logResponse(choice.value)}
                  >
                    {choice.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </header>
      )}
    </div>
  );
}

export default App;
