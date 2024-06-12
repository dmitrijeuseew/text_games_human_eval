import React, { useRef, useState, useEffect } from 'react'
import axios from "axios";
import arigraphLogo from '/arigraph.jpg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [username, setUserName] = useState("")
  const [man_woman, setManWoman] = useState("")
  const [age, setAge] = useState("")
  const [flag, setFlag] = useState(1)
  const [score, setScore] = useState(0)
  const [userIP, setUserIP] = useState("")
  const [results, setResults] = useState([]);
  const [isend, setIsEnd] = useState(false);

  function sendAction(e) {
    if (results.length > 0) {
      results[results.length - 1]["action_taken"] = e.target.innerHTML;
    }
    console.log(count)
    console.log(userIP)
    console.log(e.target.innerHTML)
    let userID = username + "---" + man_woman + "---" + age;
    axios.post("http://146.0.79.240:8001/play",
      {env_id: count, user_id: userID, action: e.target.innerHTML}).then((response) => {
      results.push({obs: response.data.observation,
                    actions: response.data.actions,
                    inventory: response.data.inventory})
      setScore(response.data.score)
      setIsEnd(response.data.is_end)
      if (response.data.is_end) {
        setCount(4);
      }
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
    setResults([])
    setAttempt(attempt + 1)
    let userID = username + "---" + man_woman + "---" + age;
    axios.post("http://146.0.79.240:8001/play",
      {env_id: count, user_id: userID, action: ""}).then((response) => {
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

  function handleSubmit(e) {
    const elem = document.getElementById("name");
    setUserName(elem.value);
    console.log(document.getElementById('man').checked)
    if (document.getElementById('man').checked) {
      setManWoman("male");
    }
    console.log(document.getElementById('woman').checked)
    if (document.getElementById('woman').checked) {
      setManWoman("female");
    }
    const curAge = document.getElementById("age")
    console.log(curAge.value);
    setAge(curAge.value);
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

  function ObsLine({line}) {
    return (
      <p className="obsline">{line}</p>
    )
  }

  function GameStates(res) {
    return (
      <div className="state">
        <div className="observation">
          <p><b style={{color: "red"}}>Observation: </b></p>
          {res.obs.map((line) => (
              <ObsLine { ...line} />
            ))}
        </div>
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
        <div className="inputnick">
          <p>
            <b>Введите пожалуйста username:</b>
          </p>
          <input id="name" type="text" name="name" />
          <p>
            <b>Укажите пожалуйста свой пол:</b>
          </p>
          <label>
            <input id="man" type="checkbox" name="man_woman" value="man"/>
            мужской
          </label>
          <label>
            <input id="woman" type="checkbox" name="man_woman" value="woman"/>
            женский
          </label>
          <p>
            <b>Ваш возраст:</b>
          </p>
          <input id="age" type="text" name="age" />
          <button className="buttonsubmit" onClick={handleSubmit}>
            Отправить
          </button>
        </div>
        <h1>Выбрать игру</h1>
        <div className="buttonlist">
        <button className="gamebutton" onClick={() => {setCount(2); setAttempt(0); setIsEnd(false);}}>
            Cooking
          </button>
          <button className="gamebutton" onClick={() => {setCount(1); setAttempt(0); setIsEnd(false);}}>
            Treasure Hunt
          </button>
          <button className="gamebutton" onClick={() => {setCount(3); setAttempt(0); setIsEnd(false);}}>
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
            {count != 3 && <div className="scorebox">
              <p className="score">Score: {score}</p>
            </div>}
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
