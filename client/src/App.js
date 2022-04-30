import { useState, useEffect } from "react";
import CreateTask from "./components/CreateTask";
import TaskList from "./components/TaskList";
import UpdateDoku from "./components/UpdateDoku";
import styles from "./assets/app.module.css";
import axios from "axios";

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/tasks").then((response) => {
      if (response.status === 200) {
        setTasks(response.data.tasks);
      } else {
        console.log("error retrieving info");
      }
    });
  }, []);

  function newTask(taskDetails) {
    console.log(taskDetails);
    setTasks([
      ...tasks,
      {
        ...taskDetails,
        id: `task-${Math.random().toString(16).slice(2)}`,
      },
    ]);
  }

  function handleDelete(trashId) {
    console.log(trashId);
    console.log(tasks.filter((task) => task.id !== trashId));
    setTasks([...tasks.filter((task) => task.id !== trashId)]);
  }

  return (
    <div>
      <div className={styles.pageTitle}>Team 56 Task Creator</div>
      <div className={styles.parentContainer}>
        <div className={styles.createTaskContainer}>
          <CreateTask newTask={newTask}></CreateTask>
        </div>
        <div className={styles.taskListContainer}>
          <TaskList tasks={tasks} setTasks={setTasks} deleteTask={handleDelete}></TaskList>
        </div>
        <div className={styles.updateDokuContainer}>
          <UpdateDoku tasks={tasks}></UpdateDoku>
        </div>
      </div>
    </div>
  );
}

export default App;
