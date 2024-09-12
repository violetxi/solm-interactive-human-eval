import React, { useState, useEffect } from 'react';
import './Demographics.css';
import { db } from './firebaseConfig'; // 导入Firestore实例
import { collection, addDoc } from 'firebase/firestore'; // 导入Firestore函数

const Demographics = ({ onComplete, responses, ratings, prolificID }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    const isValid = age && gender;
    setFormValid(isValid);
  }, [age, gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const demographics = {
      age,
      gender,
      prolificID,
      timestamp: new Date()
    };

    const data = {
      responses,
      ratings,
      demographics
    };

    try {
      // 保存所有数据到Firestore
      await addDoc(collection(db, "surveys"), data);
      console.log("问卷成功提交！");
      setSubmitted(true);
      onComplete();
    } catch (error) {
      console.error("提交问卷时出错: ", error);
      // 将数据记录到控制台
      console.log("问卷数据:", data);
      setSubmitted(true);
      onComplete();
    }
  };

  return (
    <div className="container">
      {submitted ? (
        <div>
          <h2>感谢您完成问卷！</h2>
          {/* <p>您的完成代码是: <strong>ABCD</strong></p>
          <p>您的完成URL是: <a href="https://completion.url">https://completion.url</a></p> */}
        </div>
      ) : (
        <>
          <h2>人口统计问卷</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="age">年龄:</label>
              <input
                type="number"
                id="age"
                className="form-control"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="18"
                max="120"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">性别:</label>
              <select
                id="gender"
                className="form-control"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled>选择您的性别</option>
                <option value="female">女性</option>
                <option value="male">男性</option>
                <option value="non-binary">非二元</option>
                <option value="other">其他</option>
                <option value="prefer not to say">不愿透露</option>
              </select>
            </div>
            <button type="submit" className={`btn ${!formValid ? 'btn-secondary' : 'btn-primary'}`} disabled={!formValid}>
              提交
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Demographics;
