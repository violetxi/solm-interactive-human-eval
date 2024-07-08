import React, { useState, useEffect } from 'react';
import './Instructions.css';

const Instructions = ({ onComplete, setProlificID }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 5;
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isComprehensionValid, setIsComprehensionValid] = useState(false);
  const [prolificID, setProlificIDState] = useState('');
  const [input, setInput] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [showComprehensionError, setShowComprehensionError] = useState(false);

  useEffect(() => {
    if (currentPage === 5) {
      setIsComprehensionValid(validateComprehensionTest());
    }
  }, [currentPage]);

  useEffect(() => {
    const nextButton = document.getElementById('next-btn');    
    if (currentPage === 0) {
      nextButton.disabled = !isConsentChecked;
    } else if (currentPage === 5) {
      nextButton.disabled = !isComprehensionValid;
    } else if (currentPage === 1) {
      nextButton.disabled = !prolificID;
    } else {
      nextButton.disabled = false;
    }
  }, [isConsentChecked, isComprehensionValid, prolificID, currentPage]);

  const handleNext = () => {
    if (currentPage === 5 && !isComprehensionValid) {
      setShowComprehensionError(true);
    } else {
      setShowComprehensionError(false);
      if (currentPage === totalPages - 1) {
        onComplete();
      } else {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePrev = () => {
    setCurrentPage(currentPage - 1);
  };

  const handleConsentChange = (event) => {
    setIsConsentChecked(event.target.checked);
  };

  const handleProlificIDChange = (event) => {
    const id = event.target.value;    
    setProlificIDState(id);
    setProlificID(id);
  };


  const handleComprehensionChange = () => {
    console.log("Is comprehension valid?", isComprehensionValid);
    setIsComprehensionValid(validateComprehensionTest());
  };


  const validateComprehensionTest = () => {
    const correctAnswers = {
      "comprehension-1": "false",
      "comprehension-2": "false",
      "comprehension-3": "true",      
    };

    for (const question in correctAnswers) {
      const selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
      if (!selectedAnswer) {
        console.log(`No answer selected for ${question}`);
        return false;
      }
      console.log(`Selected answer for ${question}: ${selectedAnswer.value}`);
      if (selectedAnswer.value !== correctAnswers[question]) {
        return false;
      }
    }

    return true;
  };

  const pages = [
    {
      id: 'intro0',
      content: (
        <>
          <h2>Consent Form</h2>
          <p> Your data will be used for analysis in a research project and will be used in a publication in a fully anonymized manner.</p>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              id="consent-checkbox"
              onChange={handleConsentChange}
            />
            <label className="form-check-label" htmlFor="consent-checkbox">
              I have read and understood the information above, and I agree to participate in this study.
            </label>
          </div>
        </>
      )
    },
    {
      id: 'intro1',
      content: (
        <>
          <h2>Prolific ID</h2>
          <p>Please enter your Prolific ID to continue:</p>
          <input
            type="text"
            value={prolificID}
            onChange={handleProlificIDChange}
            placeholder="Enter your Prolific ID [if you are testing the exp just insert 1]"
            className="form-control"
            required
          />
        </>
      )
    },
    { 
      id: 'intro2', 
      content: (
        <>
          <h2>Instructions 1/2: Introduction</h2> 
          <p>Welcome to this intent recognition experiment!</p>
          <p>
            In this study, you will be presented a conversation containing a statement and your task is to 
            judge if the statement is <span style={{color: 'blue'}}> sarcastic </span> 
            or <span style={{color: 'red'}}> not sarcastic</span> in the context of the conversation
          </p>
          <p> Our goal is to find out how well people can recognize the intent behind a statement in a conversation. </p>
          <p><strong>IMPORTANT NOTE:</strong> Please read all instructions carefully and thoroughly. At the end of the instructions, you will be asked comprehension questions to ensure you have fully understood the task and your role in this experiment.</p>
        </>
      ) 
    },
    { 
      id: 'intro3', 
      content: (
        <>
          <h2>Instructions 2/2: Choices</h2>
          <p>For each statement, you will choose from the following:</p>
          <p><strong>True</strong>: If the statement is sarcastic given the conversation.</p>
          <p><strong>False</strong>: If the statement is not sarcastic given the conversation.</p>
          <p><strong>Ambiguous</strong>: If you cannot determine if the statement is sarcastic or not, or if you do not understand the statement given the conversation.</p>
        </>
      ) 
    },
    {
      id: 'intro4',
      content: (
        <>
          <h2>Comprehension Quiz</h2>
          <form onChange={handleComprehensionChange}>
            <div className="question">
              <p>1. The main objective of this experiment is to identify if the sentiment of a statement is positive or negative.</p>
              <div className="form-check">
                <input type="radio" id="comp-1-true" name="comprehension-1" value="true" className="form-check-input" />
                <label htmlFor="comp-1-true" className="form-check-label">True</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-1-false" name="comprehension-1" value="false" className="form-check-input" />
                <label htmlFor="comp-1-false" className="form-check-label">False</label>
              </div>
            </div>
            <div className="question">
              <p>2. When you do not understand the statement, just select "not sarcastic" as the answer.</p>
              <div className="form-check">
                <input type="radio" id="comp-2-true" name="comprehension-2" value="true" className="form-check-input" />
                <label htmlFor="comp-2-true" className="form-check-label">True</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-2-false" name="comprehension-2" value="false" className="form-check-input" />
                <label htmlFor="comp-2-false" className="form-check-label">False</label>
              </div>
            </div>
            <div className="question">
              <p>3. When you think the statement is ambiguous and can be either sarcastic or not sarcastic, you should select "ambiguous". </p>
              <div className="form-check">
                <input type="radio" id="comp-3-true" name="comprehension-3" value="true" className="form-check-input" />
                <label htmlFor="comp-3-true" className="form-check-label">True</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-3-false" name="comprehension-3" value="false" className="form-check-input" />
                <label htmlFor="comp-3-false" className="form-check-label">False</label>
              </div>
            </div>
            {showComprehensionError && (
              <p style={{ color: 'red' }}>One of the comprehension is incorrect. Please double check the answers!</p>
            )}
          </form>
        </>
      )
    }
  ];

  return (
    <div className="container">
      <div className="progress">
        <div
          id="progress-bar"
          className="progress-bar progress-bar-striped bg-success"
          role="progressbar"
          style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <div id="content">
        {pages[currentPage].content}
      </div>
      <div className="text-center mt-4">
        {currentPage > 0 && (
          <button id="prev-btn" className="btn btn-secondary" onClick={handlePrev}>
            Previous
          </button>
        )}
        <button
          id="next-btn"
          className={`btn ${((currentPage === 0 && !isConsentChecked) || (currentPage === 1 && !prolificID) || (currentPage === 4 && !isComprehensionValid)) ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleNext}
          disabled={(currentPage === 0 && !isConsentChecked) || (currentPage === 1 && !prolificID) || (currentPage === 4 && !isComprehensionValid)}
        >
          {currentPage === totalPages - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default Instructions;
