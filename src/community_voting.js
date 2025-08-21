import React, { useState, useEffect } from "react";
import { db } from "./services/firebase";
import { collection, addDoc, doc, setDoc, increment, onSnapshot } from "firebase/firestore";
import "./App.css";

const PETITION_GOAL = 1000; // how many petitions needed to mark "eligible"

const toTitleCase = (str) =>
  str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );

const CommunityVoting = () => {
  const [petitionTypes, setPetitionTypes] = useState({
    fencing: false,
    signs: false,
    overpasses: false,
  });
  const [area, setArea] = useState("");
  const [counts, setCounts] = useState({}); // { "york county": 90, "lancaster": 40 }

  useEffect(() => {
    const q = collection(db, "petitionCounts");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCounts({}); // clear everything if no data
        return;
      }

      const newCounts = {};
      snapshot.forEach((docSnap) => {
        newCounts[docSnap.id] = docSnap.data().count;
      });
      setCounts(newCounts);
    });

    return () => unsubscribe();
  }, []);

  const handleCheckboxChange = (type) => {
    setPetitionTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSubmit = async () => {
    const selectedTypes = Object.keys(petitionTypes).filter((key) => petitionTypes[key]);
    if (selectedTypes.length === 0 || !area.trim()) {
      alert("Please fill out the specified area and select what you would like to petition for.");
      return;
    }

    const normalizedArea = area.trim().toLowerCase();
    const petition = {
      types: selectedTypes,
      area: normalizedArea,
      timestamp: new Date().toISOString(),
    };

    try {
      // Add the individual petition
      await addDoc(collection(db, "communityPetitions"), petition);

      // Increment the petition count
      const areaRef = doc(db, "petitionCounts", normalizedArea);
      await setDoc(areaRef, { count: increment(1) }, { merge: true });

      alert("✅ Petition submitted!");
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting petition.");
    }
  };

  return (
    <div className="community-action-wrapper" style={{ display: "flex", gap: "20px" }}>
      
      {/* LEFT: Petition Form */}
      <div className="community-action-container" style={{ flex: 1 }}>
        <h2>Community Action Tools</h2>
        <p>
          Vote to request local governments to install signs, fences, or overpasses
          in high-risk areas.
        </p>

        <div className="community-action-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label className="checkbox-label">
            <input type="checkbox" checked={petitionTypes.signs} onChange={() => handleCheckboxChange("signs")} />
            I would like to petition for warning signs
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={petitionTypes.fencing} onChange={() => handleCheckboxChange("fencing")} />
            I would like to petition for fencing
          </label>

          <label className="checkbox-label">
            <input type="checkbox" checked={petitionTypes.overpasses} onChange={() => handleCheckboxChange("overpasses")} />
            I would like to petition for wildlife overpasses
          </label>

          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Which County would you like to petition for"
            className="action-textbox"
          />

          <button className="action-button" onClick={handleSubmit}>
            Submit Petition
          </button>
        </div>
      </div>

      {/* RIGHT: Leaderboard */}
      <div className="petition-leaderboard" style={{ flex: 1, background: "#f8f8f8", padding: "20px", borderRadius: "12px" }}>
        <h3>Petition Progress</h3>
        {Object.entries(counts)
          .sort((a, b) => b[1] - a[1]) // sort by most petitions first
          .map(([county, count]) => {
            const remaining = Math.max(PETITION_GOAL - count, 0);
            const percent = Math.min((count / PETITION_GOAL) * 100, 100);
            return (
              <div key={county} style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  {toTitleCase(county)}: {count} petitions
                </div>
                <div style={{ height: "10px", background: "#a8cfb9", borderRadius: "5px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: "#467d5e",
                      transition: "width 0.4s ease"
                    }}
                  />
                </div>

                <small style={{ color: "#666" }}>
                  {remaining > 0
                    ? `Only ${remaining} more petitions needed to reach ${PETITION_GOAL}!`
                    : `Eligible as a RoadSafe risk area!`}
                </small>
              </div>
            );
          })}
      </div>

    </div>
  );
};

export default CommunityVoting;
