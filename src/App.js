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

// Map dataset filenames to specific order of choices
const choiceOrderMap = {
  'set_4.csv': [
    { label: 'Ambiguous', value: 'ambiguous' },
    { label: 'Positive', value: 'positive' },
    { label: 'Negative', value: 'negative' },
    { label: 'Neutral', value: 'neutral' }
  ],
  'set_5.csv': [
    { label: 'Negative', value: 'negative' },
    { label: 'Positive', value: 'positive' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Ambiguous', value: 'ambiguous' }
  ],
  'set_6.csv': [
    { label: 'Neutral', value: 'neutral' },
    { label: 'Ambiguous', value: 'ambiguous' },
    { label: 'Positive', value: 'positive' },
    { label: 'Negative', value: 'negative' }
  ],
  // Add more datasets if needed
};

const attentionChecks = [
  { question: "Please determine if the following statement is true or false.", statement: "1 + 1 = 2", note: "", correctAnswer: "True", isAttentionCheck: true },
  { question: "Please determine if the following statement is true or false.", statement: "Mary was excited about her vacation, but had to cancel it due to work. Mary is likely to feel excited about this situation.", note: "", correctAnswer: "False", isAttentionCheck: true },
  { question: " ", statement: "Please select 'False'", note: "", correctAnswer: "False", isAttentionCheck: true },
  { question: "Please determine if the following statement is true or false.", statement: "John believes vaccines are effective at preventing diseases. John is likely to support vaccination programs.", note: "", correctAnswer: "True", isAttentionCheck: true }
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
  const [currentDataset, setCurrentDataset] = useState('set_4.csv'); // Track the dataset being used

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  useEffect(() => {
    loadCSV(`data/${currentDataset}`)
      .then((data) => {
        const questionsData = data.filter(item => item.original_data !== undefined && item.original_data.trim() !== '')
          .map(item => ({
            question: `What was the person's sentiment when they said "${item.original_data}" during the conversation?`,
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
  }, [currentDataset]);

  useEffect(() => {
    loadCSV(`data/${currentDataset}`)
      .then((data) => {
        const questionsData = data.filter(item => item.original_data !== undefined && item.original_data.trim() !== '')
        .map(item => ({
          question: `What was the person's sentiment when they said "${item.original_data}" during the conversation?`,
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
  }, [currentDataset]); // Re-run when currentDataset changes

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

      // Extract the set number from the dataset filename (e.g., 'set_3.csv' -> '3')
      const setNumber = currentDataset.match(/set_(\d+)\.csv/)[1];
      // Update Prolific ID using just the number from the dataset
      let updatedProlificID = `Full-SemT6_Sentiment-${setNumber}-${prolificID}`;
      
      await addDoc(collection(db, updatedProlificID), newResponse);
      console.log('Response logged:', response);

      handleNextQuestion();
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  };

  const handleDemographicsComplete = async (demographicsData) => {
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

  const currentQuestion = questions[currentQuestionIndex]?.question || 'Loading...';
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
