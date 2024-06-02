import React, { useRef, useState, useEffect } from 'react'
import axios from "axios";
import arigraphLogo from '/arigraph.jpg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)
  const [score, setScore] = useState(0)
  const [dummyScore, setDummyScore] = useState(0)
  const [results, setResults] = useState([]);

  function sendAction(e) {
    if (results.length > 0) {
      results[results.length - 1]["action_taken"] = e.target.innerHTML;
    }
    axios.post("http://localhost:8000/action", {action: e.target.innerHTML}).then((response) => {
      results.push({obs: response.data.observation,
                    actions: response.data.actions,
                    inventory: response.data.inventory})
      setScore(response.data.score)
      setDummyScore(response.data.score)
    }, (error) => {
      console.log(error);
    });
    setDummyScore(0)
  }

  function sendActionInit() {
    axios.post("http://localhost:8000/action", {action: ""}).then((response) => {
      results.push({obs: response.data.observation,
                    actions: response.data.actions,
                    inventory: response.data.inventory})
      setScore(response.data.score)
      setDummyScore(response.data.score)
    }, (error) => {
      console.log(error);
    });
    setDummyScore(0)
  }

  const bottomRef = useRef();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, []);

  function handleUttr(e) {
    setUttrText(e.target.value)
  }

  function ActButton({action}) {
    return (
      <button className="actbutton" onClick={sendAction}>{action}</button>
    )
  }

  function GameStates(res) {
    return (
      <div className="state">
        <p className="observation"><b>Observation: </b>{res.obs}</p>
        <p className="inventory"><b>Inventory: </b>{res.inventory}</p>
        { res.action_taken && <p className="inventory"><b>Action taken: </b>{res.action_taken}</p>}
        { !res.action_taken &&
          <div className="actions">
            {res.actions.map((action) => (
              <ActButton { ...action} />
            ))}
          </div>}
      </div>
    )
  }

  return (
    <>
      {(count == 0 || count == 4) && <>
        <div>
          <a>
            <img src={arigraphLogo} className="logo" alt="AriGraph logo" />
          </a>
        </div>
        <h1>Выбрать игру</h1>
        <div className="buttonlist">
          <button className="gamebutton" onClick={() => {setCount(1); sendActionInit();}}>
            Navigation
          </button>
          <button className="gamebutton" onClick={() => {setCount(2); sendActionInit();}}>
            Cooking
          </button>
          <button className="gamebutton" onClick={() => {setCount(3); sendActionInit();}}>
            Cleaning
          </button>
        </div>
      </>}

      {(count != 0 && count != 4) && <div className="chatpage">
          <button className="buttonback" onClick={() => setCount(4)}>
            Назад
          </button>
          <div className="chatbox">
            <div className="scorebox">
              <p className="score">Score: {score}</p>
            </div>
            <div className="uttr">
              {results.map((res) => (
                <GameStates { ...res} />
              ))}
              <div ref={bottomRef} style={{color: "#e5fff4"}}>abc</div>
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default App
