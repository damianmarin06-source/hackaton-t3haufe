import React, { useState, useEffect } from 'react';
import CollaborativeEditor from './CollaborativeEditor'; 
import { createNewRoom, loadRooms } from './idk1'; 

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // Load existing rooms from Supabase
  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await loadRooms();
    setDocuments(data);
  }

  const handleCreate = async () => {
    if (!newTitle) return alert("Enter a name!");
    const room = await createNewRoom(newTitle, "user_1");
    if (room) {
      setNewTitle("");
      refresh();
      setActiveDocId(room.id);
    }
  };

  if (activeDocId) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <button 
          onClick={() => setActiveDocId(null)} 
          style={{ padding: '10px', cursor: 'pointer', background: '#333', color: '#fff', border: 'none' }}
        >
          ⬅ Back to Menu
        </button>
        <CollaborativeEditor documentId={activeDocId} onBack={() => setActiveDocId(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: '50px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <h1>ITECify</h1>

      {/* THE NEW ADDITION: CREATE BUTTON */}
      <div style={{ marginBottom: '30px' }}>
        <input 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New Room Name..."
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button onClick={handleCreate} style={buttonStyle}>+ Create New Room</button>
      </div>

      <hr style={{ borderColor: '#222' }} />

      {/* THE OLD MENU: JUST BUTTONS */}
      <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDocId(doc.id)}
            style={buttonStyle}
          >
            {doc.title || 'Room'}
          </button>
        ))}
      </div>
    </div>
  );
}

// Exactly the style you had before
const buttonStyle = {
  padding: '15px 25px',
  backgroundColor: '#3ecf8e',
  color: '#000',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
};