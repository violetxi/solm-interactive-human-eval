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
    console.log("理解测试是否有效？", isComprehensionValid);
    setIsComprehensionValid(validateComprehensionTest());
  };

  const validateComprehensionTest = () => {
    const correctAnswers = {
      "comprehension-1": "true",
      "comprehension-2": "false",
      "comprehension-3": "true",      
    };

    for (const question in correctAnswers) {
      const selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
      if (!selectedAnswer) {
        console.log(`未选择${question}的答案`);
        return false;
      }
      console.log(`${question}的选择答案: ${selectedAnswer.value}`);
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
          <h2>同意书</h2>
          <p>您的数据将用于一个研究项目的分析，并将在一篇以完全匿名化方式发表的文章中使用。</p>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              id="consent-checkbox"
              onChange={handleConsentChange}
            />
            <label className="form-check-label" htmlFor="consent-checkbox">
              我已阅读并理解上述信息，并同意参与此研究。
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
          <p>请输入您的Prolific ID以继续：</p>
          <input
            type="text"
            value={prolificID}
            onChange={handleProlificIDChange}
            placeholder="请输入您的Prolific ID.."
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
          <h2>说明 1/2：简介</h2> 
          <p>欢迎参加此情感识别实验！</p>
          <p>
            在这项研究中，您将会看到一段对话，其中包含一个陈述。您的任务是
            识别该陈述的情感是<span style={{color: 'blue'}}>积极的</span>、
            <span style={{color: 'red'}}>消极的</span>还是<span style={{color: 'green'}}>中性的</span>。
          </p>
          <p>我们的目标是了解人们在对话中识别陈述背后的情感的能力。</p>
          <p><strong>重要提示：</strong>请仔细阅读所有说明。在说明的最后，您将被要求回答理解问题，以确保您完全理解了任务和您在此实验中的角色。</p>
        </>
      ) 
    },
    { 
      id: 'intro3', 
      content: (
        <>
          <h2>说明 2/2：选择</h2>
          <p>对于每个陈述，您将从以下选项中进行选择：</p>
          <p><strong>积极的</strong></p>
          <p><strong>消极的</strong></p>
          <p><strong>中性的</strong></p>
          <p><strong>模糊的</strong>：如果您不能在没有更多上下文的情况下确定陈述的情感，或者如果您不理解该陈述。</p>
        </>
      ) 
    },
    {
      id: 'intro4',
      content: (
        <>
          <h2>理解测验</h2>
          <form onChange={handleComprehensionChange}>
            <div className="question">
              <p>1. 本实验的主要目的是识别陈述的情感是积极的、消极的还是中性的。</p>
              <div className="form-check">
                <input type="radio" id="comp-1-true" name="comprehension-1" value="true" className="form-check-input" />
                <label htmlFor="comp-1-true" className="form-check-label">正确</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-1-false" name="comprehension-1" value="false" className="form-check-input" />
                <label htmlFor="comp-1-false" className="form-check-label">错误</label>
              </div>
            </div>
            <div className="question">
              <p>2. 当您不理解陈述时，只需选择“中性”作为答案。</p>
              <div className="form-check">
                <input type="radio" id="comp-2-true" name="comprehension-2" value="true" className="form-check-input" />
                <label htmlFor="comp-2-true" className="form-check-label">正确</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-2-false" name="comprehension-2" value="false" className="form-check-input" />
                <label htmlFor="comp-2-false" className="form-check-label">错误</label>
              </div>
            </div>
            <div className="question">
              <p>3. 当您认为陈述的情感是模糊的，并且在没有更多上下文的情况下无法确定时，您应该选择“模糊”。</p>
              <div className="form-check">
                <input type="radio" id="comp-3-true" name="comprehension-3" value="true" className="form-check-input" />
                <label htmlFor="comp-3-true" className="form-check-label">正确</label>
              </div>
              <div className="form-check">
                <input type="radio" id="comp-3-false" name="comprehension-3" value="false" className="form-check-input" />
                <label htmlFor="comp-3-false" className="form-check-label">错误</label>
              </div>
            </div>
            {showComprehensionError && (
              <p style={{ color: 'red' }}>有一个理解问题回答不正确。请仔细检查答案！</p>
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
            上一页
          </button>
        )}
        <button
          id="next-btn"
          className={`btn ${((currentPage === 0 && !isConsentChecked) || (currentPage === 1 && !prolificID) || (currentPage === 4 && !isComprehensionValid)) ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleNext}
          disabled={(currentPage === 0 && !isConsentChecked) || (currentPage === 1 && !prolificID) || (currentPage === 4 && !isComprehensionValid)}
        >
          {currentPage === totalPages - 1 ? '完成' : '下一页'}
        </button>
      </div>
    </div>
  );
};

export default Instructions;
