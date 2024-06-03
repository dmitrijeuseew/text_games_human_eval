import json
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from utils.envs_cfg import ENV_NAMES, FIRST_OBS
from utils.win_cond import win_cond_clean_place, win_cond_clean_take
from utils.textworld_adapter import TextWorldWrapper, graph_from_facts
from utils.utils import observation_processing, simulate_environment_actions, action_processing, action_deprocessing


app = FastAPI()

origins = [
    "http://localhost",
    "http://146.0.79.240"
]

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

env_id2name = {1: "hunt", 2: "cook", 3: "clean"}

class Payload(BaseModel):
    env_id: int
    user_id: str
    action: str

# env_name can be picked from:
# ["hunt", "hunt_hard", "cook", "cook_hard", "cook_rl_baseline", "clean"]
# for test another envs edit utils.envs_cfg

def process_action_get_reward(action, env, info, env_name):
    G_true = graph_from_facts(info)    
    full_graph = G_true.edges(data = True)
    
    step_reward = 0
    observation, reward_, done, info = env.step(action)
    step_reward += reward_
    
    G_true_new = graph_from_facts(info)    
    full_graph_new = G_true_new.edges(data = True)

    step_reward = simulate_environment_actions(full_graph, full_graph_new, win_cond_clean_take, win_cond_clean_place) \
        if env_name == "clean" else step_reward
    return observation, step_reward, done, info

if not os.path.exists("logs"):
    os.mkdir("logs")

envs_dict, info_dict, scores_dict, steps_dict = {}, {}, {}, {}

@app.post("/play")
async def play(payload: Payload):
    env_id = payload.env_id
    env_name = env_id2name[env_id]
    user_id = payload.user_id
    action = payload.action
    files = os.listdir("logs")
    pattern = f"{user_id}_{env_name}"
    attempt = len([flname for flname in files if pattern in flname])
    if not action:
        attempt += 1
        filename = f"logs/{user_id}_{env_name}_{attempt}.json"
        if os.path.exists(filename):
            os.remove(filename)
        env = TextWorldWrapper(ENV_NAMES[env_name])
        observation, info = env.reset()
        if user_id not in envs_dict:
            envs_dict[user_id] = {}
            info_dict[user_id] = {}
            scores_dict[user_id] = {}
            steps_dict[user_id] = {}
        envs_dict[user_id][env_name] = env
        info_dict[user_id][env_name] = info
        scores_dict[user_id][env_name] = 0
        steps_dict[user_id][env_name] = 0
    else:
        filename = f"logs/{user_id}_{env_name}_{attempt}.json"
        steps_dict[user_id][env_name] += 1
        if "cook" in env_name:
            action = action_deprocessing(action)
        observation, step_reward, done, info = process_action_get_reward(
            action, envs_dict[user_id][env_name], info_dict[user_id][env_name], env_name)
        info_dict[user_id][env_name] = info
        scores_dict[user_id][env_name] += step_reward

    observation = observation.split("$$$")[-1]
    observation = observation_processing(observation)
    if steps_dict[user_id][env_name] == 0:
        observation += FIRST_OBS[env_name]
    observation = "Game step #" + str(steps_dict[user_id][env_name] + 1) + "\n" + observation
    inventory = envs_dict[user_id][env_name].get_inventory()

    valid_actions = [
        action_processing(action)
        for action in envs_dict[user_id][env_name].get_valid_actions()
    ] if "cook" in env_name else envs_dict[user_id][env_name].get_valid_actions()

    if os.path.exists(filename):
        with open(filename, 'r') as inp:
            states = json.load(inp)
    else:
        states = []
    states.append({"step": steps_dict[user_id][env_name], "observation": observation, "inventory": inventory,
                   "valid_actions": valid_actions, "action_taken": action})
    with open(filename, 'w') as out:
        json.dump(states, out, indent=2)

    return {"observation": observation,
            "actions": [{"action": action} for action in valid_actions],
            "inventory": inventory,
            "score": scores_dict[user_id][env_name]}


uvicorn.run(app, host='0.0.0.0', port=8001)