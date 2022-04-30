import { useState } from "react";
import styles from "../assets/createTask.module.css";
import "axios";
import axios from "axios";

function UpdateDoku(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [noUsername, setNoUsername] = useState(false);
  const [noPassword, setNoPassword] = useState(false);

  async function handleClick() {
    if (!username || !password) {
      if (!username) {
        setNoUsername(true);
      }
      if (!password) {
        setNoPassword(true);
      }
    } else {
      setUsername("");
      setPassword("");
      const response = await axios.post("http://localhost:5000/update", {
        data: { tasks: props.tasks },
        username,
        password,
      });
      console.log(response);
    }
  }
  return (
    <div className={styles.newTaskContainer}>
      <div>
        <div className={styles.inputContainer}>
          <label>Username</label>
          <input
            className="inputField"
            type="text"
            value={username}
            onChange={(e) => {
              if (e.target.value) {
                setNoUsername(false);
              }
              setUsername(e.target.value);
            }}
          />
          {noUsername && <div>Please provide a username!</div>}
        </div>
        <div className={styles.inputContainer}>
          <label>Password</label>
          <input
            className="inputField"
            type="password"
            value={password}
            onChange={(e) => {
              if (e.target.value) {
                setNoPassword(false);
              }
              setPassword(e.target.value);
            }}
          />
          {noPassword && <div>Please provide a password!</div>}
        </div>
      </div>
      <div className={styles.inputContainer}>
        <button className="btn" onClick={handleClick}>
          Update Wiki
        </button>
      </div>
    </div>
  );
}

export default UpdateDoku;
