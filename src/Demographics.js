import React, { useState, useEffect } from 'react';
import './Demographics.css';
import { db } from './firebaseConfig'; // Import the Firestore instance
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions

const Demographics = ({ onComplete, responses, ratings, prolificID }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    const isValid = age && gender && race && ethnicity;
    setFormValid(isValid);
  }, [age, gender, race, ethnicity]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const demographics = {
      age,
      gender,
      race,
      ethnicity,
      prolificID,
      timestamp: new Date()
    };

    const data = {
      responses,
      ratings,
      demographics
    };

    try {
      // Save all data to Firestore
      await addDoc(collection(db, "surveys"), data);
      console.log("Survey successfully written!");
      setSubmitted(true);
      onComplete();
    } catch (error) {
      console.error("Error writing survey: ", error);
      // Log data to console instead
      console.log("Survey data:", data);
      setSubmitted(true);
      onComplete();
    }
  };

  return (
    <div className="container">
      {submitted ? (
        <div>
          <h2>Thank you for completing the survey!</h2>
          {/* <p>Your completion code is: <strong>ABCD</strong></p>
          <p>Your completion URL is: <a href="https://completion.url">https://completion.url</a></p> */}
        </div>
      ) : (
        <>
          <h2>Demographics Survey</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="age">Age:</label>
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
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                className="form-control"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled>Select your gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-Binary</option>
                <option value="other">Other</option>
                <option value="prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="race">Race:</label>
              <select
                id="race"
                className="form-control"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                required
              >
                <option value="" disabled>Select your race</option>
                <option value="white">White</option>
                <option value="black">Black/African American</option>
                <option value="american_indian">American Indian/Alaska Native</option>
                <option value="asian">Asian</option>
                <option value="native_hawaiian">Native Hawaiian/Pacific Islander</option>
                <option value="multiracial">Multiracial/Mixed</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ethnicity">Ethnicity:</label>
              <select
                id="ethnicity"
                className="form-control"
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                required
              >
                <option value="" disabled>Select your ethnicity</option>
                <option value="hispanic">Hispanic</option>
                <option value="non_hispanic">Non-Hispanic</option>
              </select>
            </div>
            <button type="submit" className={`btn ${!formValid ? 'btn-secondary' : 'btn-primary'}`} disabled={!formValid}>
              Submit
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Demographics;
