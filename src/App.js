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
  { question: "Please determine if the following statement is true or false.", statement: "1 + 1 = 2", note: "", correctAnswer: "True", isAttentionCheck: true },
  { question: "Please determine if the following statement is true or false.", statement: "Mary was excited about her vacation, but had to cancel it due to work. Mary is likely to feel excited about this situation.", note: "", correctAnswer: "False", isAttentionCheck: true },
  { question: " ", statement: "Please select 'False'", note: "", correctAnswer: "False", isAttentionCheck: true },
  { question: "Please determine if the following statement is true or false.", statement: "John believes vaccines are effective at preventing diseases. John is likely to support vaccination programs.", note: "", correctAnswer: "True", isAttentionCheck: true }
];

// Define choice orders for different datasets
const choiceOrderMap = {
  'set_4.csv': [
    { label: 'The statement is not sarcastic', value: 'Not Sarcastic' },
    { label: 'The statement is sarcastic', value: 'Sarcastic' },
    { label: 'Ambiguous: I am not sure if this is sarcastic or not', value: 'Ambiguous' }
  ],
  'set_5.csv': [
    { label: 'The statement is not sarcastic', value: 'Not Sarcastic' },
    { label: 'Ambiguous: I am not sure if this is sarcastic or not', value: 'Ambiguous' },
    { label: 'The statement is sarcastic', value: 'Sarcastic' }
  ],
  'set_6.csv': [
    { label: 'Ambiguous: I am not sure if this is sarcastic or not', value: 'Ambiguous' },
    { label: 'The statement is sarcastic', value: 'Sarcastic' },
    { label: 'The statement is not sarcastic', value: 'Not Sarcastic' }
  ],
  'set_7.csv': [
    { label: 'The statement is sarcastic', value: 'Sarcastic' },
    { label: 'The statement is not sarcastic', value: 'Not sarcastic' },
    { label: 'Ambiguous: I am not sure if this is sarcastic or not', value: 'Ambiguous' },
  ],
  'set_8.csv': [
    { label: 'The statement is sarcastic', value: 'Sarcastic' },
    { label: 'The statement is not sarcastic', value: 'Not sarcastic' },
    { label: 'Ambiguous: I am not sure if this is sarcastic or not', value: 'Ambiguous' },
  ],
};

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
  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [currentDataset, setCurrentDataset] = useState('set_7.csv'); // Keep track of which dataset is being used

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  useEffect(() => {
    // Load the correct dataset (e.g., set_4.csv)
    loadCSV(`data/${currentDataset}`)
      .then((data) => {
        const questionsData = data.filter(item => item.original_data !== undefined && item.original_data.trim() !== '')
          .map(item => ({
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
  }, [currentDataset]); // Re-run when currentDataset changes

  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const choices = currentQuestion.isAttentionCheck
        ? [
            { label: 'True', value: 'True' },
            { label: 'False', value: 'False' }
          ]
        : choiceOrderMap[currentDataset]; // Use the dataset-specific order

      setShuffledChoices(choices); // No shuffle for regular questions anymore, using pre-defined order
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
    console.log('Logging response:', response);
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const newResponse = {
        question: currentQuestion.question,
        statement: currentQuestion.statement,
        response: response,
        timestamp: new Date(),
      };

      // Extract the set number from the dataset filename (e.g., 'set_4.csv' -> '4')
      const setNumber = currentDataset.match(/set_(\d+)\.csv/)[1];
      // Update Prolific ID using just the number from the dataset
      let updatedProlificID = `Full-iSarcasm-${setNumber}-${prolificID}`;
      
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
            {shuffledChoices.map((choice, index) => (
              <button
                key={index}
                className="App-link"
                style={{ marginRight: '25px' }}
                onClick={() => logResponse(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </header>
      )}
    </div>
  );
}

export default App;
