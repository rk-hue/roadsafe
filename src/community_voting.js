import React, { useState } from "react";
import { db } from "./services/firebase";
import { collection, addDoc } from "firebase/firestore";
import "./App.css"; // add CSS here

const CommunityVoting = () => {
  const [isPetitioning, setIsPetitioning] = useState(false);
  const [petitionTypes, setPetitionTypes] = useState({
    fencing: false,
    signs: false,
    overpasses: false,
  });
  const [area, setArea] = useState("");

  const handleCheckboxChange = (type) => {
    setPetitionTypes({ ...petitionTypes, [type]: !petitionTypes[type] });
  };

  const handleSubmit = async () => {
    const selectedTypes = Object.keys(petitionTypes).filter(
      (key) => petitionTypes[key]
    );

    if (!isPetitioning) return alert("Please check the petition box to submit.");
    if (selectedTypes.length === 0) return alert("Select at least one petition type.");
    if (!area) return alert("Please enter an area.");

    const petition = {
      types: selectedTypes,
      area,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "communityPetitions"), petition);
      alert("✅ Petition submitted!");
      setPetitionTypes({ fencing: false, signs: false, overpasses: false });
      setArea("");
      setIsPetitioning(false);
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting petition.");
    }
  };

  return (
    <div
      className="community-action-container"
      
    >
      <h2>Community Action Tools</h2>
      <p>
        Vote to request local governments to install signs, fences, or overpasses in high-risk areas.
      </p>
  
      <div className="community-action-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label className="checkbox-label">
          <input type="checkbox" name="petition" value="signs" />
          I would like to petition for warning signs
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="petition" value="fences" />
          I would like to petition for fencing
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="petition" value="overpasses" />
          I would like to petition for wildlife overpasses
        </label>
  
        <input
          type="text"
          placeholder="Which area would you like to petition for? (County name)"
          className="action-textbox"
        />
  
        <button
          className="action-button"
          onClick={() => {
            alert("Petition submitted! ✅");
          }}
        >
          Submit Petition
        </button>
      </div>
  
      <p style={{ marginTop: "12px", fontStyle: "italic", color: "#555" }}>
        Pre-written messages are included in each petition for your convenience.
      </p>
    </div>
  );
};

export default CommunityVoting;