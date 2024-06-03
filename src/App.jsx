import React, { useRef, useState, useEffect } from 'react'
import axios from "axios";
import arigraphLogo from '/arigraph.jpg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [flag, setFlag] = useState(0)
  const [score, setScore] = useState(0)
  const [userIP, setUserIP] = useState("")
  const [results, setResults] = useState([]);

  function sendAction(e) {
    if (results.length > 0) {
      results[results.length - 1]["action_taken"] = e.target.innerHTML;
    }
    console.log(count)
    console.log(userIP)
    console.log(e.target.innerHTML)
    axios.post("http://146.0.79.240:8001/play",
      {env_id: count, user_id: userIP, action: e.target.innerHTML}).then((response) => {
      results.push({obs: response.data.observation,
                    actions: response.data.actions,
                    inventory: response.data.inventory})
      setScore(response.data.score)
      setResults(results)
      setFlag(flag + 1)
    }, (error) => {
      console.log(error);
    });
  }

  function getIP() {
    setFlag(flag + 1)
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setUserIP(data.ip))
      .catch(error => console.log(error))
  }

  function sendActionInit() {
    console.log(count)
    console.log(userIP)
    setResults([])
    setAttempt(attempt + 1)
    axios.post("http://146.0.79.240:8001/play",
      {env_id: count, user_id: userIP, action: ""}).then((response) => {
      console.log(response.data)
      setScore(response.data.score)
      setResults([{obs: response.data.observation,
        actions: response.data.actions,
        inventory: response.data.inventory}])
      setFlag(flag + 1)
    }, (error) => {
      console.log(error);
    });
  }

  const bottomRef = useRef();

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, []);

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
          <button className="gamebutton" onClick={() => {setCount(1); getIP(); setAttempt(0);}}>
            Navigation
          </button>
          <button className="gamebutton" onClick={() => {setCount(2); getIP(); setAttempt(0);}}>
            Cooking
          </button>
          <button className="gamebutton" onClick={() => {setCount(3); getIP(); setAttempt(0);}}>
            Cleaning
          </button>
        </div>
      </>}

      {(count != 0 && count != 4 && flag > 0) && <div className="chatpage">
          <button className="buttonback" onClick={() => {setCount(4); setResults([]);}}>
            Назад
          </button>
          <div className="chatbox">
            <div style={{color: "#e5fff4"}}>abc abc abc abc abc abc abc abc abc abc abc abc</div>
            <div className="scorebox">
              <p className="score">Score: {score}</p>
            </div>
            <div className="uttr">
              {results.map((res) => (
                <GameStates { ...res} />
              ))}
              <div ref={bottomRef} style={{color: "#e5fff4"}}>abc</div>
            </div>
            {attempt == 0 &&
              <div className="startend">
                <button className="startgame" onClick={sendActionInit}>Начать игру</button>
              </div>}
            {attempt > 0 &&
              <div className="startend">
                <button className="startgame" onClick={sendActionInit}>Новая попытка</button>
              </div>}
          </div>
        </div>
      }
    </>
  )
}

export default App
