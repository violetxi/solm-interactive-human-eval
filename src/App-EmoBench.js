import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Import Firebase config
import Instructions from './Instructions'; // Import the Instructions component
import Demographics from './Demographics'; // Import the Demographics component
import './App.css';

// Function to load the CSV file
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

// Function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

const attentionChecks = [
  { question: "", statement: "Is 1 + 1 = 2 true? Select your answer below.", note: "", correctAnswer: "True", isAttentionCheck: true },
  { question: "", statement: "Please select 'True'.", note: "", correctAnswer: "True", isAttentionCheck: true },
  { question: "", statement: "Please select 'False'", note: "", correctAnswer: "False", isAttentionCheck: true }
];

function App() {
  // instruction content
  const [showInstructions, setShowInstructions] = useState(true);
  const [prolificID, setProlificID] = useState('');
  // main study content
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // demographics content
  const [showDemographics, setShowDemographics] = useState(false);
  const [responses, setResponses] = useState([]);

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  useEffect(() => {
    loadCSV('data/interactive.csv')
      .then((data) => {
        const questionsData = data.map(item => ({
          question: `Was the person intended to be sarcastic when "${item.original_data}" was said during the conversation?`,
          statement: item.conversation,
          note: item.note || '',
          isAttentionCheck: false
        }));
        const allQuestions = shuffleArray([...questionsData, ...attentionChecks]);
        setQuestions(allQuestions);
      })
      .catch((error) => {
        console.error('Error loading CSV:', error);
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
    console.log('Logging response:', response);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const newResponse = {
        question: currentQuestion.question,
        statement: currentQuestion.statement,
        response: response,
        timestamp: new Date(),
      };
      let updatedProlificID = `iSarcasm-No-Amb-${prolificID}`;
      await addDoc(collection(db, updatedProlificID), newResponse);
      console.log('Response logged:', response);

      // Ensure this is called after logging the response
      handleNextQuestion();
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const handleDemographicsComplete = async (demographicsData) => {
    // Handle completion of the demographics survey
    console.log('Demographics survey completed');
  };

  const parseConversation = (conversation) => {
    return conversation.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('A:')) {
        return { speaker: 'A', content: trimmedLine.substring(2).trim() };
      } else if (trimmedLine.startsWith('B:')) {
        return { speaker: 'B', content: trimmedLine.substring(2).trim() };
      }
      return null;
    }).filter(Boolean);
  };

  const currentQuestion = questions[currentQuestionIndex]?.question || ' ';
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
          ratings={[]} // Assuming you have ratings to pass here
          prolificID={prolificID}
        />
      ) : (
        <header className="App-header">
          {!isAttentionCheck && <p>Please read the conversation below:</p>}
          <div className="conversation">
            {!isAttentionCheck && parsedConversation.map((line, index) => (
              <p key={index} style={{ color: line.speaker === 'A' ? 'red' : 'blue', margin: '0 0 10px 0' }}>
                {line.speaker}: {line.content}
              </p>
            ))}
            {isAttentionCheck && <p>{currentStatement}</p>}
          </div>
          <p>{currentQuestion}</p>
          {currentNote && <p>{currentNote}</p>}
          <div>
            {isAttentionCheck ? (
              <>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('True')}>
                  True
                </button>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('False')}>
                  False
                </button>                
              </>
            ) : (
              <>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('True')}>
                  True: the statement is sarcastic
                </button>
                <button className="App-link" style={{ marginRight: '25px' }} onClick={() => logResponse('False')}>
                  False: the statement is not sarcastic
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
